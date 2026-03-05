#!/usr/bin/env python3
"""Debug script to test different Arabic rendering approaches."""

import os
from PIL import Image, ImageDraw, ImageFont

def test_rendering_approaches():
    """Test multiple rendering approaches to diagnose the issue."""
    
    print("=" * 60)
    print("Debug: Arabic Font Rendering")
    print("=" * 60)
    
    # Test text
    arabic_text = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
    
    # Font path
    font_path = './backend/fonts/UthmanicHafs.otf'
    
    # Create output directory
    os.makedirs('./outputs', exist_ok=True)
    
    # Load font
    try:
        font = ImageFont.truetype(font_path, 80)
        print(f"✓ Font loaded: {font.getname()}")
    except Exception as e:
        print(f"❌ Failed to load font: {e}")
        return
    
    # Test 1: Raw text (no reshaping)
    print("\n1. Testing RAW text (no reshaping)...")
    img1 = Image.new('RGB', (1080, 400), color='black')
    draw1 = ImageDraw.Draw(img1)
    draw1.text((540, 200), arabic_text, font=font, fill='white', anchor='mm')
    img1.save('./outputs/debug_1_raw.png')
    print("   Saved: outputs/debug_1_raw.png")
    
    # Test 2: With arabic_reshaper
    print("\n2. Testing with arabic_reshaper...")
    try:
        from arabic_reshaper import ArabicReshaper
        from bidi.algorithm import get_display
        
        reshaper = ArabicReshaper(configuration={
            'delete_harakat': False,
        })
        reshaped = reshaper.reshape(arabic_text)
        bidi_text = get_display(reshaped)
        
        img2 = Image.new('RGB', (1080, 400), color='black')
        draw2 = ImageDraw.Draw(img2)
        draw2.text((540, 200), bidi_text, font=font, fill='white', anchor='mm')
        img2.save('./outputs/debug_2_reshaped.png')
        print("   Saved: outputs/debug_2_reshaped.png")
        print(f"   Original: {arabic_text}")
        print(f"   Reshaped: {bidi_text}")
    except Exception as e:
        print(f"   ❌ Failed: {e}")
    
    # Test 3: Simple ASCII test
    print("\n3. Testing ASCII text (control)...")
    img3 = Image.new('RGB', (1080, 400), color='black')
    draw3 = ImageDraw.Draw(img3)
    draw3.text((540, 200), "Hello World", font=font, fill='white', anchor='mm')
    img3.save('./outputs/debug_3_ascii.png')
    print("   Saved: outputs/debug_3_ascii.png")
    
    # Test 4: Try different font
    print("\n4. Testing with NotoNaskhArabic font...")
    try:
        noto_font = ImageFont.truetype('./backend/fonts/NotoNaskhArabic-VariableFont_wght.ttf', 80)
        img4 = Image.new('RGB', (1080, 400), color='black')
        draw4 = ImageDraw.Draw(img4)
        draw4.text((540, 200), arabic_text, font=noto_font, fill='white', anchor='mm')
        img4.save('./outputs/debug_4_noto.png')
        print("   Saved: outputs/debug_4_noto.png")
    except Exception as e:
        print(f"   ⚠️  Noto font not available: {e}")
    
    print("\n" + "=" * 60)
    print("✓ Debug images created in outputs/ folder")
    print("=" * 60)
    print("\nPlease check these files:")
    print("  - debug_1_raw.png (no reshaping)")
    print("  - debug_2_reshaped.png (with arabic_reshaper)")
    print("  - debug_3_ascii.png (control test)")
    print("  - debug_4_noto.png (alternative font)")

if __name__ == '__main__':
    test_rendering_approaches()
