#!/bin/bash
# This is the final, corrected script to solve the Arabic rendering issue.
# It forces Pillow to recompile from source against the system's libraqm library.

set -e # Exit on any error

echo "============================================================"
echo "==      FINAL FIX: Rebuilding Pillow From Source      =="
echo "============================================================"

# --- 1. Ensure System Dependencies Are Installed ---
echo "\n[STEP 1/4] Ensuring system dependencies are installed..."
brew install libraqm > /dev/null # Suppress output if already installed
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

export CFLAGS="-I$(brew --prefix)/include"
export LDFLAGS="-L$(brew --prefix)/lib"

# Correctly uninstall and clear cache for Pillow
echo "  - Uninstalling existing Pillow..."
pip uninstall -y Pillow
echo "  - Clearing pip cache..."
pip cache purge

# Reinstall Pillow from source, not from a pre-compiled wheel
echo "  - Re-installing Pillow from source (this may take a minute)..."
pip install --no-cache-dir --force-reinstall --no-binary :all: Pillow

# Install other dependencies
echo "  - Installing other project dependencies..."
pip install -r requirements.txt

echo "  ✓ Pillow has been successfully recompiled."

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
