#!/bin/bash
# Test FFmpeg's native Arabic text rendering

set -e

echo "=========================================="
echo "Testing FFmpeg Arabic Text Rendering"
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
echo "1. Testing simple Arabic text rendering..."

# Create a 5-second video with Arabic text
ffmpeg -y \
  -f lavfi -i color=c=black:s=1080x1920:d=5 \
  -vf "drawtext=fontfile='${FONT_PATH}':text='${ARABIC_TEXT}':fontcolor=white:fontsize=80:x=(w-text_w)/2:y=(h-text_h)/2" \
  -c:v libx264 -pix_fmt yuv420p \
  "${OUTPUT_DIR}/ffmpeg_test_arabic.mp4"

echo "✓ Video created: ${OUTPUT_DIR}/ffmpeg_test_arabic.mp4"

echo ""
echo "2. Creating test frame image..."

# Create a single frame as PNG
ffmpeg -y \
  -f lavfi -i color=c=black:s=1080x1920:d=0.1 \
  -vf "drawtext=fontfile='${FONT_PATH}':text='${ARABIC_TEXT}':fontcolor=white:fontsize=80:x=(w-text_w)/2:y=h/2-150,
       drawtext=fontfile='Arial':text='${SPANISH_TEXT}':fontcolor=white:fontsize=50:x=(w-text_w)/2:y=h/2+50" \
  -frames:v 1 \
  "${OUTPUT_DIR}/ffmpeg_test_frame.png"

echo "✓ Frame created: ${OUTPUT_DIR}/ffmpeg_test_frame.png"

echo ""
echo "=========================================="
echo "✓ FFmpeg test complete!"
echo "=========================================="
echo ""
echo "Check the files:"
echo "  - ${OUTPUT_DIR}/ffmpeg_test_arabic.mp4"
echo "  - ${OUTPUT_DIR}/ffmpeg_test_frame.png"
