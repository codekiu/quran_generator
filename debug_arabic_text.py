#!/usr/bin/env python3
"""
Debug script to test Arabic text rendering step by step.
Run from venv: cd backend && source venv/bin/activate && cd .. && python debug_arabic_text.py
"""

import os
import sys
sys.path.insert(0, 'backend')

from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

print("=" * 70)
print("DEBUGGING ARABIC TEXT RENDERING")
print("=" * 70)

# Configuration
FONT_PATH = './backend/fonts/UthmanicHafs.otf'
OUTPUT_DIR = './outputs'
WIDTH = 1080
HEIGHT = 1920

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Test 1: Check font exists and loads
print("\n[TEST 1] Checking font...")
if not os.path.exists(FONT_PATH):
    print(f"❌ Font not found at {FONT_PATH}")
    sys.exit(1)
print(f"✓ Font file exists: {FONT_PATH}")

try:
    test_font = ImageFont.truetype(FONT_PATH, 80)
    print(f"✓ Font loaded successfully")
except Exception as e:
    print(f"❌ Font failed to load: {e}")
    sys.exit(1)

# Test 2: Test Arabic reshaping
print("\n[TEST 2] Testing Arabic text reshaping...")
original_arabic = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
print(f"Original: {original_arabic}")
print(f"Original length: {len(original_arabic)} chars")
print(f"Original repr: {repr(original_arabic)}")

try:
    reshaped = arabic_reshaper.reshape(original_arabic)
    print(f"\nReshaped: {reshaped}")
    print(f"Reshaped length: {len(reshaped)} chars")
    print(f"Reshaped repr: {repr(reshaped)}")
    
    bidi_text = get_display(reshaped)
    print(f"\nBiDi:     {bidi_text}")
    print(f"BiDi length: {len(bidi_text)} chars")
    print(f"BiDi repr: {repr(bidi_text)}")
    
    if len(bidi_text) == 0:
        print("⚠️  WARNING: BiDi text is EMPTY!")
    
    print(f"✓ Text reshaping completed")
except Exception as e:
    print(f"❌ Reshaping failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 3: Draw English text (baseline test)
print("\n[TEST 3] Drawing English text (baseline)...")
try:
    img = Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT_PATH, 80)
    
    draw.text((100, 100), "Hello World", font=font, fill=(255, 255, 255))
    
    test_path = os.path.join(OUTPUT_DIR, 'test_english.png')
    img.save(test_path)
    print(f"✓ English text saved: {test_path}")
except Exception as e:
    print(f"❌ English text failed: {e}")
    import traceback
    traceback.print_exc()

# Test 4: Draw raw Arabic (without reshaping)
print("\n[TEST 4] Drawing raw Arabic (no reshaping)...")
try:
    img = Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT_PATH, 80)
    
    draw.text((100, 400), original_arabic, font=font, fill=(255, 255, 255))
    
    test_path = os.path.join(OUTPUT_DIR, 'test_arabic_raw.png')
    img.save(test_path)
    print(f"✓ Raw Arabic saved: {test_path}")
except Exception as e:
    print(f"❌ Raw Arabic failed: {e}")
    import traceback
    traceback.print_exc()

# Test 5: Draw reshaped Arabic
print("\n[TEST 5] Drawing reshaped Arabic...")
try:
    img = Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT_PATH, 80)
    
    print(f"  Drawing text at (100, 700): '{bidi_text[:50]}...'")
    print(f"  Text has {len(bidi_text)} characters")
    
    # Try to get text bbox
    try:
        bbox = draw.textbbox((100, 700), bidi_text, font=font)
        print(f"  Text bbox: {bbox}")
        print(f"  Text width: {bbox[2] - bbox[0]}, height: {bbox[3] - bbox[1]}")
    except Exception as e:
        print(f"  Could not get bbox: {e}")
    
    draw.text((100, 700), bidi_text, font=font, fill=(255, 255, 255))
    
    test_path = os.path.join(OUTPUT_DIR, 'test_arabic_reshaped.png')
    img.save(test_path)
    print(f"✓ Reshaped Arabic saved: {test_path}")
except Exception as e:
    print(f"❌ Reshaped Arabic failed: {e}")
    import traceback
    traceback.print_exc()

# Test 6: Test with Spanish text too
print("\n[TEST 6] Drawing Arabic + Spanish (like actual use case)...")
try:
    img = Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    arabic_font = ImageFont.truetype(FONT_PATH, 80)
    spanish_font = ImageFont.truetype(FONT_PATH, 50)
    
    spanish_text = "En el nombre de Allah, el Compasivo, el Misericordioso"
    
    # Calculate positions (centered)
    arabic_bbox = draw.textbbox((0, 0), bidi_text, font=arabic_font)
    spanish_bbox = draw.textbbox((0, 0), spanish_text, font=spanish_font)
    
    arabic_width = arabic_bbox[2] - arabic_bbox[0]
    spanish_width = spanish_bbox[2] - spanish_bbox[0]
    
    arabic_x = (WIDTH - arabic_width) // 2
    spanish_x = (WIDTH - spanish_width) // 2
    
    arabic_y = HEIGHT // 2 - 150
    spanish_y = HEIGHT // 2 + 50
    
    print(f"  Arabic position: ({arabic_x}, {arabic_y})")
    print(f"  Spanish position: ({spanish_x}, {spanish_y})")
    print(f"  Arabic width: {arabic_width}px")
    print(f"  Spanish width: {spanish_width}px")
    
    draw.text((arabic_x, arabic_y), bidi_text, font=arabic_font, fill=(255, 255, 255))
    draw.text((spanish_x, spanish_y), spanish_text, font=spanish_font, fill=(255, 255, 255))
    
    test_path = os.path.join(OUTPUT_DIR, 'test_complete.png')
    img.save(test_path)
    print(f"✓ Complete test saved: {test_path}")
    print(f"\n  👉 CHECK THIS FILE - it should look correct!")
except Exception as e:
    print(f"❌ Complete test failed: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
print("TESTS COMPLETE!")
print("=" * 70)
print("\nGenerated test images in outputs/:")
print("  1. test_english.png       - Baseline (should show 'Hello World')")
print("  2. test_arabic_raw.png    - Arabic without reshaping (will look broken)")
print("  3. test_arabic_reshaped.png - Arabic with reshaping (should look correct)")
print("  4. test_complete.png      - Full subtitle (Arabic + Spanish)")
print("\nOpen these files to diagnose the issue!")
print("=" * 70)
