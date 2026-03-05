import os
import json
import time
from pathlib import Path
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from ffmpeg_video_generator import FFmpegVideoGenerator
from audio_editor import AudioEditor

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "../uploads")
OUTPUT_FOLDER = os.getenv("OUTPUT_FOLDER", "../outputs")
TEMP_FOLDER = "../temp"
FONT_PATH = os.getenv("FONT_PATH", "./fonts/UthmanicHafs.otf")
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB
DEFAULT_QPC_HAFS_PATH = Path(__file__).resolve().parent.parent / "qpc-hafs.json"
QPC_HAFS_PATH = Path(os.getenv("QPC_HAFS_PATH", DEFAULT_QPC_HAFS_PATH))

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["OUTPUT_FOLDER"] = OUTPUT_FOLDER
app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_SIZE

# Create directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)
os.makedirs(TEMP_FOLDER, exist_ok=True)

# Initialize services
video_generator = FFmpegVideoGenerator(
    font_path=FONT_PATH, output_dir=OUTPUT_FOLDER, temp_dir=TEMP_FOLDER
)

audio_editor = AudioEditor(temp_dir=TEMP_FOLDER, output_dir=OUTPUT_FOLDER)

# Allowed file extensions
ALLOWED_AUDIO_EXTENSIONS = {"mp3", "wav", "ogg", "m4a", "aac"}
ALLOWED_SUBTITLE_EXTENSIONS = {"json"}


def allowed_file(filename, allowed_extensions):
    """Check if file has an allowed extension."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions


def _parse_profiles_string(raw_value):
    stripped = raw_value.strip()
    if not stripped:
        return []
    if stripped.startswith("["):
        try:
            data = json.loads(stripped)
            if isinstance(data, list):
                return [str(item).strip() for item in data if str(item).strip()]
        except json.JSONDecodeError:
            pass
    return [item.strip() for item in stripped.split(",") if item.strip()]


def _get_requested_profiles(form_data, default_profile):
    """Extract requested video profile keys from form data."""
    profiles = []

    # Support FormData arrays (profiles[])
    profiles = [p.strip() for p in form_data.getlist("profiles[]") if isinstance(p, str) and p.strip()]

    if not profiles:
        raw_profiles = form_data.get("profiles")
        if isinstance(raw_profiles, str):
            profiles = _parse_profiles_string(raw_profiles)

    if not profiles:
        single_profile = form_data.get("profile")
        if isinstance(single_profile, str) and single_profile.strip():
            profiles = [single_profile.strip()]

    normalized = []
    for profile in profiles:
        key = str(profile).strip().lower()
        if key:
            normalized.append(key)

    return normalized or [default_profile]

def _load_qpc_hafs_dataset():
    if not QPC_HAFS_PATH.exists():
        raise FileNotFoundError(f"qpc-hafs dataset not found at {QPC_HAFS_PATH}")

    with QPC_HAFS_PATH.open("r", encoding="utf-8") as dataset:
        raw_data = json.load(dataset)

    surah_map = {}
    for entry in raw_data.values():
        surah = entry.get("surah")
        ayah = entry.get("ayah")
        text = entry.get("text", "").strip()
        if not (surah and ayah and text):
            continue

        verse_key = f"verse_{int(ayah)}"
        surah_bucket = surah_map.setdefault(int(surah), {})
        surah_bucket[verse_key] = text

    structured = {}
    for surah_number, verses in surah_map.items():
        ordered = dict(
            sorted(verses.items(), key=lambda item: int(item[0].split("_")[1]))
        )
        structured[surah_number] = {"verse": ordered, "translation": {}}

    return structured


QURAN_SURAH_DATA = _load_qpc_hafs_dataset()


def get_surah_with_cache(chapter_number):
    data = QURAN_SURAH_DATA.get(int(chapter_number))
    if data is None:
        raise ValueError(f"Surah {chapter_number} not found in qpc-hafs dataset")
    return data


@app.route("/api/quran/surah/<int:chapter_number>", methods=["GET"])
def get_quran_surah(chapter_number):
    if chapter_number < 1 or chapter_number > 114:
        return jsonify({"error": "Chapter number must be between 1 and 114."}), 400

    try:
        data = get_surah_with_cache(chapter_number)
        return jsonify(data)
    except Exception as e:
        print(f"Error fetching surah {chapter_number}: {e}")
        return jsonify({"error": "Failed to fetch Quran text."}), 500


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify(
        {"status": "healthy", "message": "Quran Video Generator API is running"}
    )


@app.route("/api/generate-video", methods=["POST"])
def generate_video():
    """
    Generate a video with Arabic and Spanish subtitles.

    Expected form data:
    - audio: Audio file (MP3, WAV, etc.)
    - subtitles: JSON file or JSON string with subtitle data
    - output_name: Optional custom output filename
    """
    try:
        # Validate request
        if "audio" not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files["audio"]
        if audio_file.filename == "":
            return jsonify({"error": "No audio file selected"}), 400

        if not allowed_file(audio_file.filename, ALLOWED_AUDIO_EXTENSIONS):
            return jsonify({"error": "Invalid audio file format"}), 400

        # Get subtitles data
        subtitles_payload = None
        if "subtitles" in request.files:
            subtitles_file = request.files["subtitles"]
            if subtitles_file and allowed_file(
                subtitles_file.filename, ALLOWED_SUBTITLE_EXTENSIONS
            ):
                subtitles_payload = json.load(subtitles_file)
        elif "subtitles_json" in request.form:
            subtitles_payload = json.loads(request.form["subtitles_json"])
        else:
            return jsonify({"error": "No subtitles data provided"}), 400

        # Normalize payload to extract optional global surah reference
        surah_reference = None
        if isinstance(subtitles_payload, dict):
            surah_reference = subtitles_payload.get("surah_reference", "")
            subtitles_data = subtitles_payload.get("subtitles")
        else:
            subtitles_data = subtitles_payload

        if not isinstance(subtitles_data, list) or len(subtitles_data) == 0:
            return jsonify({"error": "Subtitles must be a non-empty array"}), 400

        if not surah_reference:
            for subtitle in subtitles_data:
                candidate = subtitle.get("surah_reference", "")
                if candidate:
                    surah_reference = candidate
                    break

        required_fields = [
            "verse",
            "start_time",
            "end_time",
            "arabic_text",
            "spanish_text",
        ]
        for subtitle in subtitles_data:
            for field in required_fields:
                if field not in subtitle:
                    return jsonify({"error": f"Missing required field: {field}"}), 400

        # Ensure timing fields are numeric
        normalized_subtitles = []
        for subtitle in subtitles_data:
            try:
                start_time = float(subtitle["start_time"])
                end_time = float(subtitle["end_time"])
            except (TypeError, ValueError):
                return jsonify({
                    "error": "start_time and end_time must be numeric (supporting decimals)",
                }), 400

            normalized_subtitles.append(
                {
                    **subtitle,
                    "start_time": start_time,
                    "end_time": end_time,
                    "show_verse_number": bool(subtitle.get("show_verse_number", True)),
                }
            )

        # Save audio file
        audio_filename = secure_filename(audio_file.filename)
        audio_path = os.path.join(app.config["UPLOAD_FOLDER"], audio_filename)
        audio_file.save(audio_path)

        # Generate output filename
        output_name = request.form.get("output_name", "quran_video.mp4")
        if not output_name.endswith(".mp4"):
            output_name += ".mp4"
        output_name = secure_filename(output_name)

        trim_end_seconds = request.form.get("trim_end_seconds")
        trim_value = 0.0
        if trim_end_seconds not in (None, ""):
            try:
                trim_value = float(trim_end_seconds)
                if trim_value < 0:
                    return jsonify({"error": "trim_end_seconds must be non-negative"}), 400
            except (TypeError, ValueError):
                return jsonify({"error": "Invalid trim_end_seconds value"}), 400

        requested_profiles = _get_requested_profiles(
            request.form, video_generator.default_profile
        )

        profile_configs = []
        seen_profiles = set()
        for profile_name in requested_profiles:
            try:
                profile = video_generator.get_profile(profile_name)
            except ValueError as exc:
                return jsonify({"error": str(exc)}), 400

            if profile_name in seen_profiles:
                continue

            seen_profiles.add(profile_name)
            profile_configs.append((profile_name, profile))

        if not profile_configs:
            return jsonify({"error": "No valid video formats requested"}), 400

        print(
            f"Generating video with {len(subtitles_data)} subtitles for profiles: "
            + ", ".join(name for name, _ in profile_configs)
        )
        print(f"Surah reference for overlay: {surah_reference!r}")

        videos_info = []
        multi_profile = len(profile_configs) > 1
        output_stem = Path(output_name).stem

        for profile_name, profile in profile_configs:
            if multi_profile:
                suffix = profile.get("filename_suffix") or profile_name
                final_filename = f"{output_stem}_{suffix}.mp4"
            else:
                final_filename = output_name

            final_filename = secure_filename(final_filename)

            video_path = video_generator.generate_video(
                subtitles_data=normalized_subtitles,
                audio_path=audio_path,
                output_filename=final_filename,
                surah_reference=surah_reference,
                trim_end_seconds=trim_value,
                profile_name=profile_name,
            )

            video_size = os.path.getsize(video_path)
            videos_info.append(
                {
                    "profile": profile_name,
                    "label": profile.get("label", profile_name.title()),
                    "video_filename": final_filename,
                    "video_size": video_size,
                    "download_url": f"/api/video/{final_filename}",
                }
            )

        preferred_video = next(
            (
                video
                for video in videos_info
                if video["profile"] == video_generator.default_profile
            ),
            videos_info[0],
        )

        response_message = (
            "Videos generated successfully"
            if multi_profile
            else "Video generated successfully"
        )

        return jsonify(
            {
                "success": True,
                "message": response_message,
                "video_filename": preferred_video["video_filename"],
                "video_size": preferred_video["video_size"],
                "download_url": preferred_video["download_url"],
                "videos": videos_info,
                "requested_profiles": [name for name, _ in profile_configs],
            }
        )

    except Exception as e:
        print(f"Error generating video: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/video/<filename>", methods=["GET"])
def get_video(filename):
    """
    Download a generated video.

    Args:
        filename: Name of the video file
    """
    try:
        video_path = os.path.join(
            app.config["OUTPUT_FOLDER"], secure_filename(filename)
        )

        if not os.path.exists(video_path):
            return jsonify({"error": "Video not found"}), 404

        return send_file(video_path, as_attachment=True, download_name=filename)

    except Exception as e:
        print(f"Error retrieving video: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/audio/info", methods=["POST"])
def get_audio_info():
    """
    Get information about an audio file.

    Expected form data:
    - audio: Audio file
    """
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files["audio"]
        if audio_file.filename == "":
            return jsonify({"error": "No audio file selected"}), 400

        if not allowed_file(audio_file.filename, ALLOWED_AUDIO_EXTENSIONS):
            return jsonify({"error": "Invalid audio file format"}), 400

        # Save audio file temporarily
        audio_filename = secure_filename(audio_file.filename)
        audio_path = os.path.join(app.config["UPLOAD_FOLDER"], audio_filename)
        audio_file.save(audio_path)

        # Get audio info
        info = audio_editor.get_audio_info(audio_path)

        return jsonify({"success": True, "info": info})

    except Exception as e:
        print(f"Error getting audio info: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/audio/timestamps", methods=["POST"])
def extract_audio_timestamps():
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files["audio"]
        if audio_file.filename == "":
            return jsonify({"error": "No audio file selected"}), 400

        if not allowed_file(audio_file.filename, ALLOWED_AUDIO_EXTENSIONS):
            return jsonify({"error": "Invalid audio file format"}), 400

        # Parameters (optional)
        min_silence_len = request.form.get("min_silence_len", 700)
        silence_thresh = request.form.get("silence_thresh", -40)
        padding = request.form.get("padding", 200)
        max_segments = request.form.get("max_segments")

        try:
            min_silence_len = int(float(min_silence_len))
            silence_thresh = int(float(silence_thresh))
            padding = int(float(padding))
            max_segments = int(max_segments) if max_segments else None
        except (TypeError, ValueError):
            return jsonify({"error": "Invalid detection parameter"}), 400

        # Save audio file temporarily
        audio_filename = secure_filename(audio_file.filename)
        audio_path = os.path.join(app.config["UPLOAD_FOLDER"], audio_filename)
        audio_file.save(audio_path)

        detection = audio_editor.detect_voice_segments(
            audio_path=audio_path,
            min_silence_len=min_silence_len,
            silence_thresh=silence_thresh,
            padding=padding,
            max_segments=max_segments,
        )

        return jsonify({"success": True, **detection})

    except Exception as exc:  # noqa: BLE001
        print(f"Error detecting timestamps: {exc}")
        return jsonify({"error": str(exc)}), 500


@app.route("/api/audio/trim", methods=["POST"])
def trim_audio():
    """
    Trim an audio file.

    Expected form data:
    - audio: Audio file
    - start_time: Start time in seconds
    - end_time: End time in seconds
    - output_name: Optional custom output filename
    """
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files["audio"]
        if audio_file.filename == "":
            return jsonify({"error": "No audio file selected"}), 400

        if not allowed_file(audio_file.filename, ALLOWED_AUDIO_EXTENSIONS):
            return jsonify({"error": "Invalid audio file format"}), 400

        # Get trim parameters
        try:
            start_time = float(request.form.get("start_time", 0))
            end_time = float(request.form.get("end_time"))
        except (TypeError, ValueError):
            return jsonify({"error": "Invalid time parameters"}), 400

        # Save audio file
        audio_filename = secure_filename(audio_file.filename)
        audio_path = os.path.join(app.config["UPLOAD_FOLDER"], audio_filename)
        audio_file.save(audio_path)

        # Generate output filename
        output_name = request.form.get("output_name", f"trimmed_{audio_filename}")
        output_name = secure_filename(output_name)

        # Trim audio
        trimmed_path = audio_editor.trim_audio(
            audio_path=audio_path,
            start_time=start_time,
            end_time=end_time,
            output_filename=output_name,
        )

        # Get trimmed audio info
        trimmed_size = os.path.getsize(trimmed_path)

        return jsonify(
            {
                "success": True,
                "message": "Audio trimmed successfully",
                "audio_filename": output_name,
                "audio_size": trimmed_size,
                "download_url": f"/api/audio/{output_name}",
            }
        )

    except Exception as e:
        print(f"Error trimming audio: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/audio/clean", methods=["POST"])
def clean_audio():
    """
    Clean audio quality using noise reduction and enhancement filters.
    Ideal for mosque recordings with background noise and poor microphone quality.

    Expected form data:
    - audio: Audio file to clean
    - output_name: Optional custom output filename
    - noise_reduction: Enable/disable noise reduction (default: true)
    - equalize: Enable/disable voice equalization (default: true)
    - normalize: Enable/disable audio normalization (default: true)
    - noise_reduction_level: Noise reduction intensity 0.0-1.0 (default: 0.21)
    - highpass_freq: High-pass filter frequency in Hz (default: 80)
    - lowpass_freq: Low-pass filter frequency in Hz (default: 8000)
    """
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files["audio"]
        if audio_file.filename == "":
            return jsonify({"error": "No audio file selected"}), 400

        if not allowed_file(audio_file.filename, ALLOWED_AUDIO_EXTENSIONS):
            return jsonify({"error": "Invalid audio file format"}), 400

        # Save uploaded file temporarily
        timestamp = int(time.time())
        temp_filename = f"temp_clean_{timestamp}_{secure_filename(audio_file.filename)}"
        temp_path = os.path.join(TEMP_FOLDER, temp_filename)
        audio_file.save(temp_path)

        # Get optional parameters
        output_name = request.form.get("output_name", "").strip()
        noise_reduction = request.form.get("noise_reduction", "true").lower() == "true"
        equalize = request.form.get("equalize", "true").lower() == "true"
        normalize = request.form.get("normalize", "true").lower() == "true"
        
        try:
            noise_reduction_level = float(request.form.get("noise_reduction_level", "0.5"))
            noise_reduction_level = max(0.0, min(1.0, noise_reduction_level))  # Clamp between 0-1
        except (ValueError, TypeError):
            noise_reduction_level = 0.5
            
        try:
            highpass_freq = int(request.form.get("highpass_freq", "80"))
            highpass_freq = max(0, min(20000, highpass_freq))  # Clamp between 0-20000Hz
        except (ValueError, TypeError):
            highpass_freq = 80
            
        try:
            lowpass_freq = int(request.form.get("lowpass_freq", "8000"))
            lowpass_freq = max(0, min(20000, lowpass_freq))  # Clamp between 0-20000Hz
        except (ValueError, TypeError):
            lowpass_freq = 8000

        # Generate output filename
        if output_name:
            if not output_name.lower().endswith('.mp3'):
                output_name += '.mp3'
        else:
            base_name = os.path.splitext(audio_file.filename)[0]
            output_name = f"{base_name}_cleaned.mp3"

        # Clean the audio
        cleaned_audio_path = audio_editor.clean_audio(
            temp_path,
            output_filename=output_name,
            noise_reduction=noise_reduction,
            equalize=equalize,
            normalize=normalize,
            noise_reduction_level=noise_reduction_level,
            highpass_freq=highpass_freq,
            lowpass_freq=lowpass_freq
        )

        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)

        # Get audio info for response
        audio_info = audio_editor.get_audio_info(cleaned_audio_path)

        return jsonify(
            {
                "message": "Audio cleaned successfully",
                "cleaned_audio_url": f"/api/audio/{os.path.basename(cleaned_audio_path)}",
                "output_filename": os.path.basename(cleaned_audio_path),
                "audio_info": audio_info,
                "processing_details": {
                    "noise_reduction": noise_reduction,
                    "equalize": equalize,
                    "normalize": normalize,
                    "noise_reduction_level": noise_reduction_level,
                    "highpass_freq": highpass_freq,
                    "lowpass_freq": lowpass_freq
                }
            }
        )

    except Exception as e:
        print(f"Error cleaning audio: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/audio/<filename>", methods=["GET"])
def get_audio(filename):
    """
    Download an audio file.

    Args:
        filename: Name of the audio file
    """
    try:
        audio_path = os.path.join(
            app.config["OUTPUT_FOLDER"], secure_filename(filename)
        )

        if not os.path.exists(audio_path):
            return jsonify({"error": "Audio file not found"}), 404

        return send_file(audio_path, as_attachment=True, download_name=filename)

    except Exception as e:
        print(f"Error retrieving audio: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/audio/waveform", methods=["POST"])
def get_waveform():
    """
    Get waveform data for an audio file.

    Expected form data:
    - audio: Audio file
    - sample_rate: Optional sample rate (default: 100)
    """
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files["audio"]
        if audio_file.filename == "":
            return jsonify({"error": "No audio file selected"}), 400

        if not allowed_file(audio_file.filename, ALLOWED_AUDIO_EXTENSIONS):
            return jsonify({"error": "Invalid audio file format"}), 400

        # Save audio file temporarily
        audio_filename = secure_filename(audio_file.filename)
        audio_path = os.path.join(app.config["UPLOAD_FOLDER"], audio_filename)
        audio_file.save(audio_path)

        # Get sample rate parameter
        sample_rate = int(request.form.get("sample_rate", 100))

        # Generate waveform data
        waveform_data = audio_editor.get_waveform_data(audio_path, sample_rate)

        return jsonify({"success": True, "waveform": waveform_data})

    except Exception as e:
        print(f"Error generating waveform: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/test-arabic", methods=["POST"])
def test_arabic_rendering():
    """
    Test endpoint to verify Arabic text rendering.

    Expected JSON body:
    - arabic_text: Arabic text to test
    - spanish_text: Spanish text to test
    - verse_number: Optional verse number
    """
    try:
        data = request.get_json()
        arabic_text = data.get("arabic_text", "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ")
        spanish_text = data.get(
            "spanish_text", "En el nombre de Allah, el Compasivo, el Misericordioso"
        )
        verse_number = data.get("verse_number", 1)

        # Create a test frame using FFmpeg
        test_filename = "test_arabic_frame.png"
        frame_path = video_generator.create_test_frame(
            arabic_text=arabic_text,
            spanish_text=spanish_text,
            verse_number=verse_number
        )

        return jsonify(
            {
                "success": True,
                "message": "Test frame generated",
                "image_url": f"/api/image/{test_filename}",
            }
        )

    except Exception as e:
        print(f"Error testing Arabic rendering: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/image/<filename>", methods=["GET"])
def get_image(filename):
    """
    Download an image file.

    Args:
        filename: Name of the image file
    """
    try:
        image_path = os.path.join(
            app.config["OUTPUT_FOLDER"], secure_filename(filename)
        )

        if not os.path.exists(image_path):
            return jsonify({"error": "Image not found"}), 404

        return send_file(image_path, mimetype="image/png")

    except Exception as e:
        print(f"Error retrieving image: {str(e)}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5001))
    debug = os.getenv("FLASK_ENV", "development") == "development"

    print(f"Starting Quran Video Generator API on port {port}")
    print(f"Font path: {FONT_PATH}")
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print(f"Output folder: {OUTPUT_FOLDER}")

    app.run(host="0.0.0.0", port=port, debug=debug)
