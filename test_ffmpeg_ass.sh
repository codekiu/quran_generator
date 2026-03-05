#!/bin/bash
# Test FFmpeg with ASS subtitles for proper Arabic RTL rendering

set -e

echo "=========================================="
echo "Testing FFmpeg with ASS Subtitles"
echo "=========================================="

# Output
OUTPUT_DIR="./outputs"
mkdir -p "$OUTPUT_DIR"

# Create ASS subtitle file
cat > "${OUTPUT_DIR}/test.ass" << 'EOF'
[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Arabic,KFGQPC Uthmanic Script HAFS,80,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,10,10,400,1
Style: Spanish,Arial,50,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,2,10,10,100,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:05.00,Arabic,,0,0,0,,بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
Dialogue: 0,0:00:00.00,0:00:05.00,Spanish,,0,0,0,,En el nombre de Allah, el Compasivo, el Misericordioso
EOF

echo "✓ Created ASS subtitle file"

echo ""
echo "Creating video with ASS subtitles..."

# Create video with ASS subtitles
ffmpeg -y \
  -f lavfi -i color=c=black:s=1080x1920:d=5 \
  -vf "ass=${OUTPUT_DIR}/test.ass" \
  -c:v libx264 -pix_fmt yuv420p \
  "${OUTPUT_DIR}/ffmpeg_ass_test.mp4"

echo "✓ Video created: ${OUTPUT_DIR}/ffmpeg_ass_test.mp4"

echo ""
echo "Creating single frame..."

ffmpeg -y \
  -f lavfi -i color=c=black:s=1080x1920:d=0.1 \
  -vf "ass=${OUTPUT_DIR}/test.ass" \
  -frames:v 1 -update 1 \
  "${OUTPUT_DIR}/ffmpeg_ass_frame.png"

echo "✓ Frame created: ${OUTPUT_DIR}/ffmpeg_ass_frame.png"

echo ""
echo "=========================================="
echo "✓ Test complete!"
echo "=========================================="
echo ""
echo "ASS subtitles provide:"
echo "  - Full RTL (right-to-left) support"
echo "  - Proper Arabic text shaping"
echo "  - Diacritic positioning"
echo "  - Professional subtitle styling"
