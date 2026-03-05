#!/usr/bin/env python3
"""Verify that the FFmpeg-based generator works end-to-end."""

import os
import sys
import json
import wave
from contextlib import closing

# Allow importing backend modules when run from repo root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from ffmpeg_video_generator import FFmpegVideoGenerator


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
OUTPUT_DIR = './outputs'
TEMP_DIR = './temp'
FONT_PATH = './backend/fonts/UthmanicHafs.otf'
TEST_VIDEO_NAME = 'verify_full_pipeline.mp4'

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)


# Sample subtitles covering short, medium, and long verses
subtitle_payload = {
    "surah_reference": "Al-Fatiha · Ayat 1-2 & Al-Baqarah · Ayah 11",
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
            "verse": 11,
            "start_time": 6,
            "end_time": 11,
            "arabic_text": "وَإِذَا قِيلَ لَهُمْ لَا تُفْسِدُوا فِي الْأَرْضِ قَالُوا إِنَّمَا نَحْنُ مُصْلِحُونَ",
            "spanish_text": "Y cuando se les dice: 'No corrompáis en la tierra', dicen: 'Nosotros somos sólo reformadores'"
        }
    ]
}


def save_sample_subtitles():
    path = os.path.join(OUTPUT_DIR, 'verify_subtitles.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(subtitle_payload, f, ensure_ascii=False, indent=2)
    return path


def create_silent_audio(audio_path, duration_seconds, sample_rate=44100):
    """Create a simple silent WAV file so FFmpeg has real audio input."""
    total_frames = int(duration_seconds * sample_rate)
    with closing(wave.open(audio_path, 'w')) as wav_file:
        wav_file.setnchannels(2)  # stereo
        wav_file.setsampwidth(2)  # 16-bit samples
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(b'\x00\x00' * total_frames * 2)
    return audio_path


def main():
    print("=" * 70)
    print("VERIFYING FFmpeg-BASED VIDEO GENERATION")
    print("=" * 70)

    save_sample_subtitles()

    # Initialize generator (same settings as production/test script)
    print("\n1. Initializing generator...")
    generator = FFmpegVideoGenerator(
        font_path=FONT_PATH,
        output_dir=OUTPUT_DIR,
        temp_dir=TEMP_DIR
    )
    print("✅ Generator ready")

    # Produce a few diagnostic frames
    print("\n2. Creating diagnostic frames...")
    try:
        subs = subtitle_payload['subtitles']
        frame_paths = [
            generator.create_test_frame(
                arabic_text=subs[i]['arabic_text'],
                spanish_text=subs[i]['spanish_text'],
                verse_number=subs[i]['verse']
            )
            for i in range(min(3, len(subs)))
        ]
        for path in frame_paths:
            print(f"   • Saved frame: {path}")
    except Exception as exc:
        print(f"❌ Frame generation failed: {exc}")
        sys.exit(1)

    # Create silent audio to drive full video generation
    print("\n3. Creating silent audio track...")
    total_duration = max(sub['end_time'] for sub in subtitle_payload['subtitles'])
    audio_path = os.path.join(TEMP_DIR, 'verify_silence.wav')
    create_silent_audio(audio_path, duration_seconds=total_duration)
    print(f"   • Silent audio created: {audio_path}")

    # Generate final video
    print("\n4. Generating verification video...")
    try:
        video_path = generator.generate_video(
            subtitles_data=subtitle_payload['subtitles'],
            audio_path=audio_path,
            output_filename=TEST_VIDEO_NAME,
            surah_reference=subtitle_payload['surah_reference']
        )
        print(f"✅ Video generated: {video_path}")
    except Exception as exc:
        print(f"❌ Video generation failed: {exc}")
        sys.exit(1)

    print("\n" + "=" * 70)
    print("VERIFICATION COMPLETE")
    print("=" * 70)
    print("Artifacts:")
    print("  • Diagnostic frames: outputs/test_frame*.png")
    print(f"  • Video: {os.path.join(OUTPUT_DIR, TEST_VIDEO_NAME)}")
    print("  • Subtitles JSON: outputs/verify_subtitles.json")


if __name__ == '__main__':
    main()
