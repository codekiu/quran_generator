#!/bin/bash
# This script downloads a known-good Arabic font (Noto Naskh Arabic)
# and configures the project to use it, permanently fixing the rendering issue.

set -e

FONT_DIR="./backend/fonts"
NOTO_FONT_URL="https://raw.githubusercontent.com/google/fonts/main/ofl/notonaskharabic/NotoNaskhArabic-VariableFont_wght.ttf"
NOTO_FONT_FILENAME="NotoNaskhArabic-VariableFont_wght.ttf"
NOTO_FONT_PATH="$FONT_DIR/$NOTO_FONT_FILENAME"
ENV_FILE="./backend/.env"

echo "=================================================="
echo "==      Setting Up Final, Working Arabic Font     =="
echo "=================================================="

# --- 1. Download the Noto Font ---
echo "\n[STEP 1/3] Downloading Noto Naskh Arabic font..."
if [ ! -f "$NOTO_FONT_PATH" ]; then
    # Use curl for a more reliable download
    curl -L "$NOTO_FONT_URL" -o "$NOTO_FONT_PATH"
    echo "  ✓ Font downloaded to $NOTO_FONT_PATH"
else
    echo "  - Font already exists."
fi

# --- 2. Update the .env file to use the new font ---
echo "\n[STEP 2/3] Configuring project to use Noto font..."
if grep -q "FONT_PATH" "$ENV_FILE"; then
    # Update existing FONT_PATH
    sed -i.bak "s|FONT_PATH=.*|FONT_PATH=./fonts/$NOTO_FONT_FILENAME|" "$ENV_FILE"
    echo "  - Updated FONT_PATH in $ENV_FILE"
else
    # Add FONT_PATH if it doesn't exist
    echo "FONT_PATH=./fonts/$NOTO_FONT_FILENAME" >> "$ENV_FILE"
    echo "  - Added FONT_PATH to $ENV_FILE"
fi

# --- 3. Run the final test script to verify ---
echo "\n[STEP 3/3] Running final verification test..."

# Activate venv and run the test
cd backend
source venv/bin/activate
cd ..

./backend/venv/bin/python final_test.py

RESULT_FILE="outputs/FINAL_TEST_FRAME.png"

echo "\n=================================================="
if [ -f "$RESULT_FILE" ]; then
    echo "  ✅ SUCCESS! The new font works."
    echo "  Opening the final test frame for you..."
    open "$RESULT_FILE"
else
    echo "  ❌ FAILURE: Something went wrong. Please check errors."
    exit 1
fi
echo "=================================================="
echo "The project is now permanently configured to use a working font."
