#!/bin/bash
# This is the definitive script to solve the Arabic rendering issue by forcing
# Pillow to be recompiled from source against the system's libraqm library.

set -e # Exit on any error

echo "============================================================"
echo "==   Pillow Force Rebuild & Final Verification Script   =="
echo "============================================================"

# --- 1. Ensure System Dependencies Are Installed ---
echo "\n[STEP 1/4] Ensuring system dependencies are installed..."
if ! command -v brew &> /dev/null; then
    echo "  ❌ ERROR: Homebrew not found." && exit 1
fi
brew install libraqm
echo "  ✓ libraqm is installed."

# --- 2. Set Up and Activate Virtual Environment ---
echo "\n[STEP 2/4] Setting up Python virtual environment..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
echo "  ✓ Virtual environment activated."

# --- 3. Force Rebuild of Pillow ---
echo "\n[STEP 3/4] Forcing Pillow to rebuild from source..."

# Set flags to help compiler find Homebrew libraries
export CFLAGS="-I$(brew --prefix)/include"
export LDFLAGS="-L$(brew --prefix)/lib"

# Uninstall Pillow and clear pip cache for it
echo "  - Uninstalling existing Pillow version..."
pip uninstall -y Pillow
echo "  - Clearing pip cache for Pillow..."
pip cache purge Pillow

# Reinstall Pillow from source, not from a pre-compiled wheel
echo "  - Re-installing Pillow from source (this may take a minute)..."
pip install --no-binary :all: Pillow

# Install other dependencies
echo "  - Installing other dependencies..."
pip install -r requirements.txt

echo "  ✓ Pillow has been recompiled."

cd ..

# --- 4. Run the Ultimate Diagnostic Test ---
echo "\n[STEP 4/4] Running the ultimate diagnostic test..."

BACKEND_PYTHON="$(pwd)/backend/venv/bin/python"
"$BACKEND_PYTHON" ultimate_font_test.py

RESULT_FILE="outputs/ULTIMATE_FONT_TEST.png"

echo "\n============================================================"
if [ -f "$RESULT_FILE" ]; then
    echo "  ✅ SUCCESS! The final diagnostic frame was created."
    echo "  Opening the file for you: $RESULT_FILE"
    open "$RESULT_FILE"
else
    echo "  ❌ FAILURE: The test frame was not created. Please check errors."
    exit 1
fi
echo "============================================================"
