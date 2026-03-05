#!/bin/bash

echo "=========================================="
echo "Running Arabic Text Rendering Debug Test"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "debug_arabic_text.py" ]; then
    echo "Error: Must run from quran_generator/ directory"
    exit 1
fi

# Check if venv exists
if [ ! -d "backend/venv" ]; then
    echo "Error: Virtual environment not found!"
    echo "Run: cd backend && python3 -m venv venv && pip install -r requirements.txt"
    exit 1
fi

# Activate venv and run
cd backend
source venv/bin/activate
cd ..

echo "Virtual environment activated"
echo "Running debug tests..."
echo ""

python debug_arabic_text.py

echo ""
echo "=========================================="
echo "Check the outputs/ folder for test images"
echo "=========================================="
