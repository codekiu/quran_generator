#!/bin/bash
# Test FFmpeg with proper RTL text shaping

set -e

echo "=========================================="
echo "Testing FFmpeg RTL Text Shaping"
echo "=========================================="

# Arabic text
ARABIC_TEXT="بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
SPANISH_TEXT="En el nombre de Allah, el Compasivo, el Misericordioso"

# Font path
FONT_PATH="./backend/fonts/UthmanicHafs.otf"

# Output
OUTPUT_DIR="./outputs"
mkdir -p "$OUTPUT_DIR"

echo ""
echo "Creating frame with text_shaping=1 (enables HarfBuzz RTL)..."

# Create frame with proper RTL shaping
ffmpeg -y \
  -f lavfi -i color=c=black:s=1080x1920:d=0.1 \
  -vf "drawtext=fontfile='${FONT_PATH}':text='${ARABIC_TEXT}':fontcolor=white:fontsize=80:x=(w-text_w)/2:y=h/2-150:text_shaping=1,
       drawtext=text='${SPANISH_TEXT}':fontcolor=white:fontsize=50:x=(w-text_w)/2:y=h/2+50" \
  -frames:v 1 -update 1 \
  "${OUTPUT_DIR}/ffmpeg_rtl_test.png"

echo "✓ Frame created: ${OUTPUT_DIR}/ffmpeg_rtl_test.png"

echo ""
echo "=========================================="
echo "✓ Test complete!"
echo "=========================================="
echo ""
echo "The text_shaping=1 parameter enables:"
echo "  - HarfBuzz text shaping"
echo "  - Proper RTL (right-to-left) rendering"
echo "  - Arabic letter joining"
echo "  - Diacritic positioning"
