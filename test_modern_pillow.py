#!/usr/bin/env python3
"""
Alternative approach using modern Pillow with libraqm support.
This eliminates the need for arabic_reshaper and python-bidi.

REQUIREMENTS:
1. Install system libraries first:
   brew install fribidi harfbuzz

2. Pillow will automatically detect and use them

ADVANTAGES:
- No text reshaping needed
- Native RTL support
- Better text shaping
- Simpler code
"""

import os
import sys
from PIL import Image, ImageDraw, ImageFont, features


def test_modern_pillow():
    """Test if libraqm is available and working."""

    print("=" * 60)
    print("Testing Modern Pillow Arabic Rendering")
    print("=" * 60)

    # Check libraqm availability
    print("\n1. Checking Pillow features...")
    has_raqm = features.check('raqm')
    has_fribidi = features.check('fribidi')

    print(f"  libraqm support: {'✓ YES' if has_raqm else '✗ NO'}")
    print(f"  fribidi support: {'✓ YES' if has_fribidi else '✗ NO'}")

    if not has_raqm:
        print("\n⚠️  libraqm not available!")
        print("To enable it, run:")
        print("  brew install fribidi harfbuzz")
        print("\nFalling back to arabic_reshaper method...")
        return False

    # Test Arabic rendering
    print("\n2. Testing Arabic text rendering...")

    font_path = './backend/fonts/UthmanicHafs.otf'
    if not os.path.exists(font_path):
        print(f"❌ Font not found: {font_path}")
        return False

    # Create test image
    width, height = 1080, 1920
    img = Image.new('RGB', (width, height), color='black')
    draw = ImageDraw.Draw(img)

    # Load font
    font = ImageFont.truetype(font_path, 80)

    # Arabic text with diacritics
    arabic_text = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"

    # Draw with libraqm - NO RESHAPING NEEDED!
    draw.text(
        (width / 2, height / 2),
        arabic_text,  # Original text, no preprocessing
        font=font,
        fill='white',
        anchor='mm',
        direction='rtl',  # Right-to-left
        language='ar'     # Arabic
    )

    # Save test image
    output_path = './outputs/test_modern_pillow.png'
    os.makedirs('./outputs', exist_ok=True)
    img.save(output_path)

    print(f"✓ Test image saved: {output_path}")
    print("\n" + "=" * 60)
    print("✓ Modern Pillow approach works!")
    print("=" * 60)

    return True


if __name__ == '__main__':
    success = test_modern_pillow()

    if not success:
        print("\n💡 TIP: The current approach with arabic_reshaper works fine.")
        print("   This modern approach is optional but cleaner if you install libraqm.")

    sys.exit(0 if success else 1)
