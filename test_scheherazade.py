#!/usr/bin/env python3
"""Test with Scheherazade font - a well-known working Arabic font."""

import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from PIL import Image, ImageDraw, ImageFont
from arabic_reshaper import ArabicReshaper
from bidi.algorithm import get_display

def test_scheherazade():
    """Test with Scheherazade font."""
    
    print("=" * 60)
    print("Testing with Scheherazade Font")
    print("=" * 60)
    
    arabic_text = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
    font_path = './backend/fonts/ScheherazadeNew-Regular.ttf'
    
    if not os.path.exists(font_path):
        print(f"❌ Font not found: {font_path}")
        return False
    
    # Load font
    font = ImageFont.truetype(font_path, 80)
    print(f"✓ Font loaded: {font.getname()}")
    
    # Configure reshaper
    reshaper = ArabicReshaper(configuration={
        'delete_harakat': False,
    })
    
    # Test 1: Without reshaping
    print("\n1. Without reshaping...")
    img1 = Image.new('RGB', (1080, 400), color='black')
    draw1 = ImageDraw.Draw(img1)
    draw1.text((540, 200), arabic_text, font=font, fill='white', anchor='mm')
    img1.save('./outputs/scheherazade_raw.png')
    print("   Saved: outputs/scheherazade_raw.png")
    
    # Test 2: With reshaping
    print("\n2. With reshaping...")
    reshaped = reshaper.reshape(arabic_text)
    bidi_text = get_display(reshaped)
    
    img2 = Image.new('RGB', (1080, 400), color='black')
    draw2 = ImageDraw.Draw(img2)
    draw2.text((540, 200), bidi_text, font=font, fill='white', anchor='mm')
    img2.save('./outputs/scheherazade_reshaped.png')
    print("   Saved: outputs/scheherazade_reshaped.png")
    
    print("\n" + "=" * 60)
    print("✓ Test complete - check the images!")
    print("=" * 60)
    
    return True

if __name__ == '__main__':
    test_scheherazade()
