#!/usr/bin/env python3
"""
Definitive test script to generate a correct video frame.
This implements the final, correct logic for rendering subtitles.

Fixes:
1. Re-implements arabic-reshaper and python-bidi for Arabic text.
2. Uses a separate, reliable font (Arial) for Spanish text.
3. Simplifies drawing logic.
"""

import os
import sys
from PIL import Image, ImageDraw, ImageFont

# Add backend to path to import libraries
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

try:
    import arabic_reshaper
    from bidi.algorithm import get_display
except ImportError:
    print("ERROR: Missing dependencies. Please run from the virtual environment.")
    print("  cd backend && source venv/bin/activate && cd ..")
    sys.exit(1)

# --- Configuration ---
ARABIC_FONT_PATH = './backend/fonts/UthmanicHafs.otf'
# Use a standard, reliable font for Spanish
SPANISH_FONT_PATH = None  # Let Pillow find a default like Arial
OUTPUT_DIR = './outputs'
WIDTH, HEIGHT = 1080, 1920
BG_COLOR = (0, 0, 0)
TEXT_COLOR = (255, 255, 255)

arabic_text = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
spanish_text = "En el nombre de Allah, el Compasivo, el Misericordioso"

print("=" * 70)
print("RUNNING DEFINITIVE SUBTITLE RENDERING TEST")
print("=" * 70)

# --- 1. Prepare Arabic Text (The Correct Way) ---
print("\n1. Processing Arabic text...")
reshaped_text = arabic_reshaper.reshape(arabic_text)
bidi_text = get_display(reshaped_text)
print(f"  ✓ Reshaped and BiDi text ready: {bidi_text}")

# --- 2. Load Fonts ---
print("\n2. Loading fonts...")
try:
    arabic_font = ImageFont.truetype(ARABIC_FONT_PATH, 80)
    print(f"  ✓ Arabic font loaded: {ARABIC_FONT_PATH}")
    # For Spanish, find a default system font like Arial
    try:
        spanish_font = ImageFont.truetype("arial.ttf", 50)
        print("  ✓ Spanish font loaded: arial.ttf")
    except IOError:
        print("  - Arial not found, using Pillow's default font for Spanish.")
        spanish_font = ImageFont.load_default()
except Exception as e:
    print(f"❌ FAILED to load fonts: {e}")
    sys.exit(1)

# --- 3. Create Image and Draw Text ---
print("\n3. Drawing text on image...")
img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
draw = ImageDraw.Draw(img)

# --- Draw Arabic Text ---
try:
    # Use text anchor for easy centering
    draw.text(
        (WIDTH / 2, HEIGHT / 2 - 150),  # x, y
        bidi_text,
        font=arabic_font,
        fill=TEXT_COLOR,
        anchor="ms"  # Middle-top anchor
    )
    print("  ✓ Arabic text drawn.")
except Exception as e:
    print(f"  ❌ FAILED to draw Arabic text: {e}")

# --- Draw Spanish Text ---
try:
    draw.text(
        (WIDTH / 2, HEIGHT / 2 + 50),  # x, y
        spanish_text,
        font=spanish_font,
        fill=TEXT_COLOR,
        anchor="ms"  # Middle-top anchor
    )
    print("  ✓ Spanish text drawn.")
except Exception as e:
    print(f"  ❌ FAILED to draw Spanish text: {e}")

# --- 4. Save Final Image ---
output_path = os.path.join(OUTPUT_DIR, 'FINAL_TEST_FRAME.png')
img.save(output_path)

print("\n" + "=" * 70)
print(f"✅ TEST COMPLETE! Check the output file:")
print(f"   {output_path}")
print("=" * 70)
print("This image should show CORRECTLY connected Arabic text and Spanish text.")
