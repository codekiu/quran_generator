#!/usr/bin/env python3
"""Quick regression test for the FFmpeg-based video generator."""

import os
import sys
import wave
from contextlib import closing

# Ensure backend modules are importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from ffmpeg_video_generator import FFmpegVideoGenerator
except ImportError as exc:
    print("=" * 60)
    print("ERROR: Missing dependencies!")
    print("=" * 60)
    print(f"\n{exc}\n")
    print("Make sure to run inside the backend virtualenv:")
    print("  cd backend && source .venv/bin/activate && cd ..")
    sys.exit(1)


OUTPUT_DIR = './outputs'
TEMP_DIR = './temp'
FONT_PATH = './backend/fonts/UthmanicHafs.otf'
TEST_VIDEO_NAME = 'test_video_generation.mp4'

SUBTITLE_PAYLOAD = {
    "surah_reference": "Al-Fatiha · Ayat 1-3",
    "subtitles": [
        {
            "verse": 1,
            "start_time": 0,
            "end_time": 3,
            "arabic_text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
            "spanish_text": "En el nombre de Allah, el Compasivo, el Misericordioso"
        },
        {
            "verse": 2,
            "start_time": 3,
            "end_time": 6,
            "arabic_text": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
            "spanish_text": "Alabado sea Allah, Señor de los mundos"
        },
        {
            "verse": 3,
            "start_time": 6,
            "end_time": 11,
            "arabic_text": "مَالِكِ يَوْمِ الدِّينِ",
            "spanish_text": "Dueño del Día del Juicio"
        }
    ]
}


def create_silent_audio(path, seconds, sample_rate=44100):
    total_frames = int(seconds * sample_rate)
    with closing(wave.open(path, 'w')) as wav_file:
        wav_file.setnchannels(2)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(b'\x00\x00' * total_frames * 2)
    return path


def test_video_generation():
    print("=" * 60)
    print("Testing FFmpeg Video Generator")
    print("=" * 60)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(TEMP_DIR, exist_ok=True)

    if not os.path.exists(FONT_PATH):
        print(f"❌ Font not found: {FONT_PATH}")
        return False
    print(f"✓ Font found: {FONT_PATH}")

    # Initialize generator
    print("\n1. Initializing generator...")
    generator = FFmpegVideoGenerator(
        font_path=FONT_PATH,
        output_dir=OUTPUT_DIR,
        temp_dir=TEMP_DIR
    )
    print("✓ Generator ready")

    # Diagnostic frames
    print("\n2. Creating diagnostic frames...")
    try:
        paths = [
            generator.create_test_frame(
                arabic_text=sub['arabic_text'],
                spanish_text=sub['spanish_text'],
                verse_number=sub['verse']
            )
            for sub in SUBTITLE_PAYLOAD['subtitles']
        ]
        for p in paths:
            print(f"   • {p}")
    except Exception as exc:
        print(f"❌ Frame generation failed: {exc}")
        return False

    # Create silent audio
    print("\n3. Creating silent audio...")
    duration = max(sub['end_time'] for sub in SUBTITLE_PAYLOAD['subtitles'])
    audio_path = os.path.join(TEMP_DIR, 'test_silence.wav')
    create_silent_audio(audio_path, duration)
    print(f"   • Silent audio: {audio_path}")

    # Generate video
    print("\n4. Generating test video...")
    try:
        video_path = generator.generate_video(
            subtitles_data=SUBTITLE_PAYLOAD['subtitles'],
            audio_path=audio_path,
            output_filename=TEST_VIDEO_NAME,
            surah_reference=SUBTITLE_PAYLOAD['surah_reference']
        )
        print(f"✓ Video created: {video_path}")
    except Exception as exc:
        print(f"❌ Video generation failed: {exc}")
        return False

    print("\n" + "=" * 60)
    print("✓ ALL TESTS PASSED!")
    print("=" * 60)
    print("Artifacts:")
    print("  • Diagnostic frames: outputs/test_frame*.png")
    print(f"  • Video: {os.path.join(OUTPUT_DIR, TEST_VIDEO_NAME)}")
    print("  • Silent audio: temp/test_silence.wav")
    return True


if __name__ == '__main__':
    success = test_video_generation()
    sys.exit(0 if success else 1)
