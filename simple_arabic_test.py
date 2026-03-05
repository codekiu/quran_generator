#!/usr/bin/env python3
"""
Stripped-down test to render Arabic text with Pillow.
This uses the native OpenType font capabilities instead of arabic-reshaper.
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Configuration
FONT_PATH = './backend/fonts/UthmanicHafs.otf'
OUTPUT_DIR = './outputs'
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Arabic text
arabic_text = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
spanish_text = "En el nombre de Allah, el Compasivo, el Misericordioso"

# Create black background
img = Image.new("RGB", (1080, 600), (0, 0, 0))
draw = ImageDraw.Draw(img)

# Try font options
try:
    # Try with layout_engine=ImageFont.Layout.RAQM if available
    # RAQM is a text layout library that handles RTL, complex scripts
    print("Trying with RAQM layout engine...")
    try:
        arabic_font = ImageFont.truetype(
            FONT_PATH, 
            size=80, 
            layout_engine=ImageFont.Layout.RAQM
        )
        print("✅ RAQM layout engine available!")
    except (AttributeError, ImportError, ValueError):
        print("❌ RAQM not available, trying without layout engine...")
        arabic_font = ImageFont.truetype(FONT_PATH, size=80)

    # Draw text in 4 different ways to see which works
    
    # Method 1: Direct rendering with text anchor
    print("\nMethod 1: Drawing with text anchor 'mm'")
    draw.text(
        (540, 100), 
        arabic_text, 
        font=arabic_font, 
        fill=(255, 255, 255),
        anchor="mm"  # Middle-middle
    )
    
    # Method 2: Direct rendering (no anchor)
    print("\nMethod 2: Drawing without anchor")
    draw.text(
        (100, 200), 
        arabic_text, 
        font=arabic_font, 
        fill=(255, 255, 255)
    )
    
    # Method 3: Direction parameter
    try:
        print("\nMethod 3: Drawing with direction='rtl'")
        draw.text(
            (100, 300), 
            arabic_text, 
            font=arabic_font, 
            fill=(255, 255, 255),
            direction="rtl"
        )
    except Exception as e:
        print(f"❌ Direction parameter failed: {e}")
    
    # Method 4: Spanish text as reference
    print("\nMethod 4: Drawing Spanish text as reference")
    spanish_font = ImageFont.truetype(FONT_PATH, size=40)
    draw.text(
        (100, 400), 
        spanish_text, 
        font=spanish_font, 
        fill=(255, 255, 255)
    )
    
    # Method 5: With features parameter (enables OpenType features)
    try:
        print("\nMethod 5: Drawing with OpenType features")
        draw.text(
            (100, 500), 
            arabic_text, 
            font=arabic_font, 
            fill=(255, 255, 255),
            features=['+rlig', '+liga', '+init', '+fina', '+medi', '+isol'],
            language="ar"
        )
    except Exception as e:
        print(f"❌ Features parameter failed: {e}")
    
    # Save result
    output_path = os.path.join(OUTPUT_DIR, 'direct_arabic_render.png')
    img.save(output_path)
    print(f"\n✅ Test image saved: {output_path}")
    print("Check this file to see which method works correctly.")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
