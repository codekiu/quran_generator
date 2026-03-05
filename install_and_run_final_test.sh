#!/bin/bash
# This script provides the definitive solution by installing libraqm and all
# required system dependencies for complex Arabic text rendering in Pillow.

set -e # Exit on any error

echo "======================================================"
echo "==   FINAL - Installing Arabic Text Dependencies    =="
echo "======================================================"

# --- 1. Install System Dependencies with Homebrew ---
echo "\n[STEP 1/4] Installing system dependencies for complex text (libraqm)..."

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo "  ❌ ERROR: Homebrew not found. Please install it first." 
    exit 1
fi

echo "  - Updating Homebrew..."
brew update

echo "  - Installing libraqm and its dependencies (freetype, fribidi, harfbuzz)..."
brew install freetype fribidi harfbuzz libraqm

echo "  ✓ System dependencies installed."

# --- 2. Set up Backend Virtual Environment ---
echo "\n[STEP 2/4] Setting up backend environment..."
cd backend

if [ ! -d "venv" ]; then
    echo "  - Virtual environment not found. Creating one..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate
echo "  - Virtual environment activated."

# --- 3. Re-install Pillow to Link Against libraqm ---
echo "\n[STEP 3/4] Re-installing Pillow to link with new libraries..."

# Uninstall first to ensure a clean build
pip uninstall -y Pillow

# Re-install requirements. This will build Pillow against the new libraries.
# The CFLAGS and LDFLAGS might be needed on some systems to find the headers.
export CFLAGS="-I$(brew --prefix)/include"
export LDFLAGS="-L$(brew --prefix)/lib"

echo "  - Installing dependencies from requirements.txt..."
pip install -r requirements.txt

echo "  ✓ Python environment is ready."

cd ..

# --- 4. Run the Definitive Test Script ---
echo "\n[STEP 4/4] Running the final rendering test..."

BACKEND_PYTHON="$(pwd)/backend/venv/bin/python"

"$BACKEND_PYTHON" final_test.py

RESULT_FILE="outputs/FINAL_TEST_FRAME.png"

echo "\n======================================================"
if [ -f "$RESULT_FILE" ]; then
    echo "  ✅ SUCCESS! The definitive test frame was created."
    echo "  Opening the file for you: $RESULT_FILE"
    open "$RESULT_FILE"
else
    echo "  ❌ FAILURE: The test frame was not created. Please check errors."
    exit 1
fi
echo "======================================================"
