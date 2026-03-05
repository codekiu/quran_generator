"""
FFmpeg-based video generator using ASS subtitles for proper Arabic RTL rendering.
This replaces PIL-based rendering with native FFmpeg + libass for reliable Arabic text.
"""

import os
import subprocess
import json
import re
from pathlib import Path


class FFmpegVideoGenerator:
    """
    Generates videos with Arabic and Spanish subtitles using FFmpeg and ASS subtitles.
    Provides proper RTL rendering, text shaping, and diacritic positioning.
    """

    def __init__(self, font_path, output_dir="../outputs", temp_dir="../temp"):
        """
        Initialize the FFmpeg video generator.

        Args:
            font_path (str): Path to the Arabic font file (e.g., UthmanicHafs.otf)
            output_dir (str): Directory to save generated videos
            temp_dir (str): Directory for temporary files
        """
        self.font_path = Path(font_path).resolve()
        self.output_dir = Path(output_dir)
        self.temp_dir = Path(temp_dir)

        # Video settings for Instagram/TikTok (vertical format)
        self.width = 1080
        self.height = 1920
        self.fps = 30
        self.bg_color = "black"
        self.fade_in_ms = 400
        self.fade_out_ms = 400

        # Font settings
        self.arabic_font_name = "KFGQPC Uthmanic Script HAFS"
        self.translation_font_name = "Arial"
        self.verse_number_font_name = "Arial"
        self.surah_info_font_name = "Arial"
        self.watermark_font_name = "Verdana"
        
        # Font sizes
        self.arabic_font_size = 120
        self.translation_font_size = 50
        self.verse_number_font_size = 35
        self.surah_info_font_size = 45
        self.watermark_font_size = 28

        self.watermark_text = ""

        # Create directories
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.temp_dir.mkdir(parents=True, exist_ok=True)

        # Video profiles (can be extended with more formats)
        self.video_profiles = {
            "tiktok": {
                "label": "TikTok / Reels",
                "width": 1080,
                "height": 1920,
                "fps": 30,
                "bg_color": "black",
                "filename_suffix": "tiktok",
                "orientation": "vertical",
                "font_sizes": {
                    "arabic": 120,
                    "translation": 50,
                    "surah_info": 45,
                    "watermark": 28,
                },
                "margins": {
                    "arabic": 1080,
                    "translation": 880,
                    "surah_info": 420,
                    "watermark": 490,
                },
                "language_gap_lines": 1,
            },
            "youtube": {
                "label": "YouTube 1080p",
                "width": 1920,
                "height": 1080,
                "fps": 30,
                "bg_color": "black",
                "filename_suffix": "youtube",
                "orientation": "horizontal",
                "font_sizes": {
                    "arabic": 96,
                    "translation": 44,
                    "surah_info": 36,
                    "watermark": 24,
                },
                "margins": {
                    "arabic": 600,
                    "translation": 520,
                    "surah_info": 220,
                    "watermark": 260,
                },
                "language_gap_lines": 1,
            },
        }
        self.default_profile = "tiktok"

    def get_profile_names(self):
        """Return the list of supported video profile keys."""
        return list(self.video_profiles.keys())

    def get_profile(self, profile_name):
        """Fetch a video profile by name."""
        profile = self.video_profiles.get(profile_name)
        if not profile:
            raise ValueError(f"Unsupported video format: {profile_name}")
        return profile

    def create_ass_subtitle(
        self,
        subtitles_data,
        output_path,
        surah_reference=None,
        profile=None,
        watermark_text=None,
    ):
        """
        Create an ASS subtitle file from subtitle data.

        Args:
            subtitles_data (list): List of subtitle dictionaries with verse data
            output_path (str): Path to save the ASS file

        Returns:
            str: Path to the created ASS file
        """
        # ASS file header
        # Alignment: 2=center-bottom for proper vertical centering
        # MarginV: distance from bottom edge
        # WrapStyle: 0=smart wrapping with line breaks
        profile = profile or self.get_profile(self.default_profile)
        width = profile.get("width", self.width)
        height = profile.get("height", self.height)
        font_sizes = profile.get("font_sizes", {})
        margins = profile.get("margins", {})

        arabic_font_size = font_sizes.get("arabic", self.arabic_font_size)
        translation_font_size = font_sizes.get("translation", self.translation_font_size)
        surah_font_size = font_sizes.get("surah_info", self.surah_info_font_size)
        watermark_font_size = font_sizes.get("watermark", self.watermark_font_size)

        def _margin(key, fallback_ratio):
            fallback_value = int(height * fallback_ratio)
            return margins.get(key, fallback_value)

        arabic_margin_v = _margin("arabic", 0.56)
        translation_margin_v = _margin("translation", 0.46)
        surah_margin_v = _margin("surah_info", 0.22)
        watermark_margin_v = _margin("watermark", 0.26)

        language_gap_lines = profile.get("language_gap_lines")
        if language_gap_lines is None:
            vertical_gap_px = max(arabic_margin_v - translation_margin_v, 0)
            approx_gap_lines = round(vertical_gap_px / max(translation_font_size, 1))
            language_gap_lines = max(approx_gap_lines - 1, 0)
        else:
            try:
                language_gap_lines = int(language_gap_lines)
            except (TypeError, ValueError):
                language_gap_lines = 0
        language_gap_lines = max(language_gap_lines, 0)
        gap_between_languages = "\\N" + ("\\N" * language_gap_lines)

        ass_content = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Arabic,{self.arabic_font_name},{arabic_font_size},&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,80,80,{arabic_margin_v},1
Style: Translation,{self.translation_font_name},{translation_font_size},&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,80,80,{translation_margin_v},1
Style: SurahInfo,{self.surah_info_font_name},{surah_font_size},&H00FFFFFF,&H000000FF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,2,0,2,120,120,{surah_margin_v},1
Style: Watermark,{self.watermark_font_name},{watermark_font_size},&H55FFFFFF,&H330000FF,&H33000000,&H00000000,0,0,0,0,100,100,0.5,0,1,2,0,2,140,140,{watermark_margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

        # Add subtitle events
        timeline_start = None
        timeline_end = None

        for subtitle in subtitles_data:
            verse = subtitle.get("verse", "")
            show_verse_number = subtitle.get("show_verse_number", True)
            start_time = subtitle["start_time"]
            end_time = subtitle["end_time"]
            arabic_text = subtitle["arabic_text"]
            translated_text = subtitle["translated_text"]

            if timeline_start is None or start_time < timeline_start:
                timeline_start = start_time
            if timeline_end is None or end_time > timeline_end:
                timeline_end = end_time

            # Convert times to ASS format (h:mm:ss.cs)
            start_ass = self._seconds_to_ass_time(start_time)
            end_ass = self._seconds_to_ass_time(end_time)

            # Escape special characters in text
            arabic_text = arabic_text.replace("\n", "\\N")
            arabic_text = self._normalize_quranic_stop_marks(arabic_text)
            translated_text = translated_text.replace("\n", "\\N")

            # Add verse number to the end of text
            if verse:
                # For Arabic: add verse number in Arabic-Indic numerals (no brackets)
                arabic_verse_num = self._convert_to_arabic_numerals(verse)
                if show_verse_number:
                    arabic_with_verse = f"{arabic_text} {arabic_verse_num}"
                else:
                    arabic_with_verse = arabic_text

                # For translation: add verse number in parentheses
                translated_with_verse = f"{translated_text} ({verse})"
            else:
                arabic_with_verse = arabic_text
                translated_with_verse = translated_text

            fade_tag = f"{{\\fad({self.fade_in_ms},{self.fade_out_ms})}}"

            bilingual_text = arabic_with_verse
            if translated_with_verse.strip():
                bilingual_text += (
                    f"{gap_between_languages}{{\\rTranslation}}{translated_with_verse}"
                )

            # Stack both languages in a single dialogue to keep relative order stable
            ass_content += (
                f"Dialogue: 0,{start_ass},{end_ass},Arabic,,0,0,{translation_margin_v},,"
                f"{fade_tag}{bilingual_text}\n"
            )

        overlay_start = 0 if timeline_start is None else max(0, timeline_start)
        overlay_end = timeline_end if timeline_end is not None else overlay_start + 5
        start_ass = self._seconds_to_ass_time(overlay_start)
        end_ass = self._seconds_to_ass_time(max(overlay_end, overlay_start + 0.1))

        if surah_reference:
            clean_surah_reference = surah_reference.replace("\n", " ").strip()
            if clean_surah_reference:
                fade_tag = f"{{\\fad({self.fade_in_ms},{self.fade_out_ms})}}"
                ass_content += (
                    f"Dialogue: 0,{start_ass},{end_ass},SurahInfo,,0,0,0,,"
                    f"{fade_tag}{clean_surah_reference}\n"
                )

        effective_watermark = watermark_text if watermark_text is not None else self.watermark_text
        if effective_watermark:
            effective_watermark = effective_watermark.strip()
            if effective_watermark:
                fade_tag = f"{{\\fad({self.fade_in_ms},{self.fade_out_ms})}}"
                ass_content += (
                    f"Dialogue: 0,{start_ass},{end_ass},Watermark,,0,0,0,,"
                    f"{fade_tag}{effective_watermark}\n"
                )

        # Write ASS file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(ass_content)

        return output_path
    
    def _convert_to_arabic_numerals(self, number):
        """Convert Western numerals to Arabic-Indic numerals."""
        arabic_numerals = {
            '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
            '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
        }
        return ''.join(arabic_numerals.get(c, c) for c in str(number))

    def _normalize_quranic_stop_marks(self, text):
        """Ensure Quranic stop marks stay attached to the preceding word."""
        stop_marks = "ۖۗۚۛۜ۝۞۩"
        pattern = re.compile(rf"([^\s])\s*([{stop_marks}])")

        def _join(match):
            return f"{match.group(1)}\u200f{match.group(2)}"

        return pattern.sub(_join, text)

    def _seconds_to_ass_time(self, seconds):
        """Convert seconds to ASS time format (h:mm:ss.cs)."""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        centisecs = int((seconds % 1) * 100)
        return f"{hours}:{minutes:02d}:{secs:02d}.{centisecs:02d}"

    def generate_video(
        self,
        subtitles_data,
        audio_path,
        output_filename,
        surah_reference=None,
        trim_end_seconds=0.0,
        profile_name=None,
        watermark_text=None,
    ):
        """
        Generate a complete video with subtitles and audio using FFmpeg.

        Args:
            subtitles_data (list): List of subtitle dictionaries with verse data
            audio_path (str): Path to the audio file (MP3)
            output_filename (str): Name of the output video file

        Returns:
            str: Path to the generated video
        """
        print(f"Starting FFmpeg video generation for {output_filename}")

        profile = self.get_profile(profile_name or self.default_profile)

        # Create ASS subtitle file
        ass_filename = f"{Path(output_filename).stem}_{profile_name or self.default_profile}.ass"
        ass_path = self.temp_dir / ass_filename
        self.create_ass_subtitle(
            subtitles_data,
            ass_path,
            surah_reference=surah_reference,
            profile=profile,
            watermark_text=watermark_text,
        )
        print(f"✓ Created ASS subtitle file: {ass_path}")

        # Output video path
        output_path = self.output_dir / output_filename

        # FFmpeg command
        ffmpeg_cmd = [
            "ffmpeg",
            "-y",  # Overwrite output file
            "-f", "lavfi",
            "-i",
            f"color=c={profile.get('bg_color', self.bg_color)}:s={profile['width']}x{profile['height']}:r={profile.get('fps', self.fps)}",
            "-i", str(audio_path),
            "-vf", f"ass={ass_path}",
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "23",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",  # Match video length to audio
            str(output_path),
        ]

        print(f"Running FFmpeg command...")
        result = subprocess.run(
            ffmpeg_cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace'
        )

        if result.returncode != 0:
            print(f"FFmpeg error: {result.stderr}")
            raise Exception(f"FFmpeg failed with error: {result.stderr}")

        print(f"✓ Video generated successfully: {output_path}")

        if trim_end_seconds and trim_end_seconds > 0:
            try:
                self._trim_video_tail(output_path, trim_end_seconds)
            except Exception as exc:
                print(f"Warning: failed to trim tail: {exc}")

        return str(output_path)

    def _trim_video_tail(self, video_path, trim_seconds):
        """Trim a number of seconds from the end of a video in-place."""
        duration = self._probe_media_duration(video_path)
        if duration is None:
            raise RuntimeError("Unable to determine video duration for trimming")

        if duration <= trim_seconds + 0.1:
            raise ValueError("trim_end_seconds exceeds or matches video duration")

        target_duration = duration - trim_seconds
        temp_path = video_path.with_suffix(".tailtrim.mp4")

        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(video_path),
            "-t",
            f"{target_duration}",
            "-c",
            "copy",
            str(temp_path),
        ]
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        if result.returncode != 0:
            raise RuntimeError(result.stderr)

        os.replace(temp_path, video_path)

    def _probe_media_duration(self, media_path):
        """Return media duration in seconds using ffprobe."""
        cmd = [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(media_path),
        ]
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        if result.returncode != 0:
            print(f"ffprobe error: {result.stderr}")
            return None

        try:
            return float(result.stdout.strip())
        except (TypeError, ValueError):
            return None

    def create_test_frame(self, arabic_text, translated_text, verse_number=None, profile_name=None):
        """
        Create a test frame image to verify rendering.

        Args:
            arabic_text (str): Arabic text
            translated_text (str): Translated text
            verse_number (int, optional): Verse number to display

        Returns:
            str: Path to the generated frame
        """
        # Create temporary subtitle data
        subtitle_data = [{
            "verse": verse_number or "",
            "start_time": 0,
            "end_time": 1,
            "arabic_text": arabic_text,
            "translated_text": translated_text,
        }]

        # Create ASS file
        profile = self.get_profile(profile_name or self.default_profile)

        ass_path = self.temp_dir / "test_frame.ass"
        self.create_ass_subtitle(subtitle_data, ass_path, profile=profile)

        # Output frame path
        frame_path = self.output_dir / "test_frame.png"

        # FFmpeg command to create single frame
        ffmpeg_cmd = [
            "ffmpeg",
            "-y",
            "-f", "lavfi",
            "-i",
            f"color=c={profile.get('bg_color', self.bg_color)}:s={profile['width']}x{profile['height']}:d=0.1",
            "-vf", f"ass={ass_path}",
            "-frames:v", "1",
            "-update", "1",
            str(frame_path),
        ]

        result = subprocess.run(
            ffmpeg_cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace'
        )

        if result.returncode != 0:
            raise Exception(f"FFmpeg failed: {result.stderr}")

        return str(frame_path)


def test_ffmpeg_generator():
    """Test function to verify FFmpeg video generation works."""
    # Sample data
    sample_subtitles = [
        {
            "verse": 1,
            "start_time": 0,
            "end_time": 5,
            "arabic_text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
            "translated_text": "En el nombre de Allah, el Compasivo, el Misericordioso",
        },
        {
            "verse": 2,
            "start_time": 5,
            "end_time": 10,
            "arabic_text": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
            "translated_text": "Alabado sea Allah, Señor de los mundos",
        },
    ]

    generator = FFmpegVideoGenerator(
        font_path="./backend/fonts/UthmanicHafs.otf",
        output_dir="./outputs",
        temp_dir="./temp",
    )

    # Note: You need an actual audio file to test full video generation
    # generator.generate_video(sample_subtitles, 'path/to/audio.mp3', 'test_video.mp4')
    
    # Test frame generation
    frame_path = generator.create_test_frame(
        arabic_text="بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        translated_text="En el nombre de Allah, el Compasivo, el Misericordioso",
        verse_number=1
    )
    print(f"Test frame created: {frame_path}")


if __name__ == "__main__":
    test_ffmpeg_generator()
