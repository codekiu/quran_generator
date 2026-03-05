#!/usr/bin/env python3
"""
Ultimate diagnostic script for Arabic text rendering.
1. Checks if Pillow is using the required `libraqm` library.
2. Downloads and tests a known-good Arabic font (Noto Naskh).
3. Compares it with the user's provided font.
"""

import os
import sys
import urllib.request
import zipfile

# --- Setup and Dependency Check ---
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
try:
    from PIL import Image, ImageDraw, ImageFont
    import arabic_reshaper
    from bidi.algorithm import get_display
except ImportError:
    print("ERROR: Missing dependencies. Run from the virtual environment.")
    sys.exit(1)

# --- Configuration ---
USER_FONT_PATH = './backend/fonts/UthmanicHafs.otf'
NOTO_FONT_URL = "https://fonts.google.com/download?family=Noto%20Naskh%20Arabic"
NOTO_FONT_DIR = './backend/fonts'
NOTO_FONT_PATH = os.path.join(NOTO_FONT_DIR, 'NotoNaskhArabic-VariableFont_wght.ttf')
OUTPUT_DIR = './outputs'
WIDTH, HEIGHT = 1080, 1200

arabic_text = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"

print("=" * 70)
print("== ULTIMATE ARABIC FONT DIAGNOSTIC SCRIPT ==")
print("=" * 70)

# --- 1. Check for LibRaqm Support in Pillow ---
print("\n[STEP 1/4] Checking for libraqm support in Pillow...")
has_raqm = ImageFont.Layout.RAQM is not None
if has_raqm:
    print("  ✅ SUCCESS: Pillow has libraqm support enabled!")
else:
    print("  ❌ CRITICAL FAILURE: Pillow does NOT have libraqm support.")
    print("     This is the likely root cause of the problem.")
    print("     Run 'install_and_run_final_test.sh' again to fix.")
    # We can still continue, but results may be incorrect.

# --- 2. Download and Prepare Noto Font (Fallback) ---
print("\n[STEP 2/4] Preparing known-good fallback font (Noto Naskh Arabic)...")
if not os.path.exists(NOTO_FONT_PATH):
    print("  - Noto font not found. Downloading from Google Fonts...")
    try:
        zip_path, _ = urllib.request.urlretrieve(NOTO_FONT_URL)
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Extract only the variable font file we need
            for member in zip_ref.namelist():
                if 'VariableFont' in member:
                    zip_ref.extract(member, path=NOTO_FONT_DIR)
                    print(f"  - Extracted {member}")
        os.remove(zip_path)
        print("  ✓ Noto font downloaded and extracted successfully.")
    except Exception as e:
        print(f"  ❌ FAILED to download Noto font: {e}")
else:
    print("  - Noto font already exists.")

# --- 3. Prepare Arabic Text ---
print("\n[STEP 3/4] Processing Arabic text...")
reshaped_text = arabic_reshaper.reshape(arabic_text)
bidi_text = get_display(reshaped_text)
print(f"  ✓ Text ready for drawing: {bidi_text}")

# --- 4. Render with Both Fonts ---
print("\n[STEP 4/4] Rendering test image with both fonts...")
img = Image.new("RGB", (WIDTH, HEIGHT), (20, 20, 20)) # Dark grey bg
draw = ImageDraw.Draw(img)

# --- Draw with User's Font ---
draw.text((10, 10), "Attempting to render with: UthmanicHafs.otf", fill=(255, 255, 0))
try:
    user_font = ImageFont.truetype(USER_FONT_PATH, 80)
    draw.text(
        (WIDTH / 2, 200),
        bidi_text,
        font=user_font,
        fill=(255, 255, 255),
        anchor="ms"
    )
    print("  - Drew with UthmanicHafs.otf")
except Exception as e:
    error_msg = f"FAILED to draw with UthmanicHafs.otf: {e}"
    print(f"  ❌ {error_msg}")
    draw.text((10, 100), error_msg, fill=(255, 0, 0))

# --- Draw with Noto Font ---
draw.text((10, 410), "Attempting to render with: NotoNaskhArabic (known-good font)", fill=(255, 255, 0))
if os.path.exists(NOTO_FONT_PATH):
    try:
        noto_font = ImageFont.truetype(NOTO_FONT_PATH, 80)
        draw.text(
            (WIDTH / 2, 600),
            bidi_text,
            font=noto_font,
            fill=(255, 255, 255),
            anchor="ms"
        )
        print("  - Drew with NotoNaskhArabic font.")
    except Exception as e:
        error_msg = f"FAILED to draw with Noto font: {e}"
        print(f"  ❌ {error_msg}")
        draw.text((10, 500), error_msg, fill=(255, 0, 0))
else:
    draw.text((10, 500), "Noto font could not be found/downloaded.", fill=(255, 0, 0))

# --- Save Final Image ---
output_path = os.path.join(OUTPUT_DIR, 'ULTIMATE_FONT_TEST.png')
img.save(output_path)

print("\n" + "=" * 70)
print(f"✅ DIAGNOSTIC COMPLETE! Check the output file:")
print(f"   {output_path}")
print("=" * 70)
print("\nAnalysis:")
print("- If you see 'CRITICAL FAILURE' in Step 1, the environment is the problem.")
print("- If 'UthmanicHafs.otf' is blank but 'NotoNaskhArabic' appears, your font file is the problem.")
print("- If both are blank, the rendering environment is fundamentally broken.")
