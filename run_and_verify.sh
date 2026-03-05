#!/bin/bash
# This script handles all setup and runs the definitive test.

set -e # Exit on any error

echo "=================================================="
echo "==   Quran Video Generator Verification Script    =="
echo "=================================================="

# --- 1. Set up Backend Virtual Environment ---
echo "\n[STEP 1/3] Setting up backend environment..."
cd backend

if [ ! -d "venv" ]; then
    echo "  - Virtual environment not found. Creating one..."
    python3 -m venv venv
    echo "  - venv created."
fi

# Activate venv
source venv/bin/activate
echo "  - Virtual environment activated."

# Install dependencies
echo "  - Installing dependencies from requirements.txt..."
pip install -r requirements.txt
echo "  - Dependencies installed."

cd ..
echo "  ✓ Backend setup complete."

# --- 2. Run the Definitive Test Script ---
echo "\n[STEP 2/3] Running the final rendering test..."

# We need to call python from the activated venv path explicitly
BACKEND_PYTHON="$(pwd)/backend/venv/bin/python"

if [ ! -f "$BACKEND_PYTHON" ]; then
    echo "  ❌ ERROR: Could not find python executable in venv!"
    exit 1
fi

"$BACKEND_PYTHON" final_test.py

echo "  ✓ Test script executed."

# --- 3. Display Results ---
echo "\n[STEP 3/3] Displaying results..."

RESULT_FILE="outputs/FINAL_TEST_FRAME.png"

if [ -f "$RESULT_FILE" ]; then
    echo "  ✅ SUCCESS! The test frame was created."
    echo "  Please check the file: $RESULT_FILE"
    # Try to open the file automatically on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  Opening the file for you..."
        open "$RESULT_FILE"
    fi
else
    echo "  ❌ FAILURE: The test frame was not created. Please check the errors above."
    exit 1
fi

echo "\n=================================================="
echo "== If the image looks correct, the logic is now fixed. =="
echo "=================================================="
