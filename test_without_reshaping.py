#!/usr/bin/env python3
"""
Test rendering WITHOUT arabic-reshaper to isolate the issue.
Sometimes the font itself handles Arabic correctly.
"""

import os
import sys
sys.path.insert(0, 'backend')

from PIL import Image, ImageDraw, ImageFont

FONT_PATH = './backend/fonts/UthmanicHafs.otf'
OUTPUT_DIR = './outputs'
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("=" * 60)
print("TESTING WITHOUT RESHAPING")
print("=" * 60)

arabic_text = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
spanish_text = "En el nombre de Allah, el Compasivo, el Misericordioso"

# Create image
img = Image.new("RGB", (1080, 1920), (0, 0, 0))
draw = ImageDraw.Draw(img)

# Load fonts
arabic_font = ImageFont.truetype(FONT_PATH, 80)
spanish_font = ImageFont.truetype(FONT_PATH, 50)

# Calculate centered positions
arabic_bbox = draw.textbbox((0, 0), arabic_text, font=arabic_font)
spanish_bbox = draw.textbbox((0, 0), spanish_text, font=spanish_font)

arabic_width = arabic_bbox[2] - arabic_bbox[0]
spanish_width = spanish_bbox[2] - spanish_bbox[0]

arabic_x = (1080 - arabic_width) // 2
spanish_x = (1080 - spanish_width) // 2

arabic_y = 1920 // 2 - 150
spanish_y = 1920 // 2 + 50

print(f"Arabic position: ({arabic_x}, {arabic_y}), width: {arabic_width}px")
print(f"Spanish position: ({spanish_x}, {spanish_y}), width: {spanish_width}px")

# Draw WITHOUT any reshaping
draw.text((arabic_x, arabic_y), arabic_text, font=arabic_font, fill=(255, 255, 255))
draw.text((spanish_x, spanish_y), spanish_text, font=spanish_font, fill=(255, 255, 255))

output_path = os.path.join(OUTPUT_DIR, 'test_no_reshaping.png')
img.save(output_path)

print(f"\n✓ Saved to: {output_path}")
print("\nSome OpenType fonts (OTF) handle Arabic shaping automatically!")
print("If this image looks CORRECT, we should skip arabic-reshaper entirely.")
print("=" * 60)
