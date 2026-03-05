#!/bin/bash
# Final test to verify centered layout and verse numbers

set -e

echo "=========================================="
echo "Final Layout Test"
echo "=========================================="

OUTPUT_DIR="./outputs"
mkdir -p "$OUTPUT_DIR"

# Test with multiple verses
cat > "${OUTPUT_DIR}/final_test.ass" << 'EOF'
[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Arabic,KFGQPC Uthmanic Script HAFS,70,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,8,50,50,100,1
Style: Spanish,Arial,45,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,8,50,50,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:05.00,Arabic,,0,0,0,,بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴿١﴾
Dialogue: 0,0:00:00.00,0:00:05.00,Spanish,,0,0,0,,En el nombre de Allah, el Compasivo, el Misericordioso (1)
EOF

echo "✓ Created test ASS file"

echo ""
echo "Generating test frame..."

ffmpeg -y -loglevel error \
  -f lavfi -i color=c=black:s=1080x1920:d=0.1 \
  -vf "ass=${OUTPUT_DIR}/final_test.ass" \
  -frames:v 1 -update 1 \
  "${OUTPUT_DIR}/FINAL_LAYOUT_TEST.png"

echo "✓ Frame created: ${OUTPUT_DIR}/FINAL_LAYOUT_TEST.png"

echo ""
echo "=========================================="
echo "✅ Test Complete!"
echo "=========================================="
echo ""
echo "Verify the following:"
echo "  ✓ Text is centered vertically in the middle"
echo "  ✓ Arabic and Spanish are close together"
echo "  ✓ Verse number ﴿١﴾ appears at end of Arabic"
echo "  ✓ Verse number (1) appears at end of Spanish"
echo ""
echo "Open: ${OUTPUT_DIR}/FINAL_LAYOUT_TEST.png"
