#!/bin/bash

# Quran Video Generator - Installation Script
# This script automates the setup process

set -e  # Exit on error

echo "🕌 Quran Video Generator - Installation Script"
echo "=============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo -e "${GREEN}✓${NC} Python 3 found: $PYTHON_VERSION"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✓${NC} Node.js found: $NODE_VERSION"

# Check FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${YELLOW}⚠${NC}  FFmpeg is not installed"
    echo "   Installing FFmpeg via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install ffmpeg
        echo -e "${GREEN}✓${NC} FFmpeg installed"
    else
        echo -e "${RED}❌ Homebrew not found. Please install FFmpeg manually:${NC}"
        echo "   brew install ffmpeg"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} FFmpeg found"
fi

echo ""
echo "🐍 Setting up Python backend..."

# Create directories
mkdir -p uploads outputs temp backend/fonts

# Backend setup
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

echo -e "${GREEN}✓${NC} Backend setup complete"

cd ..

echo ""
echo "⚛️  Setting up React frontend..."

# Frontend setup
cd frontend

# Install dependencies
echo "Installing npm dependencies..."
npm install

echo -e "${GREEN}✓${NC} Frontend setup complete"

cd ..

echo ""
echo "=============================================="
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo "⚠️  IMPORTANT: Font Setup Required"
echo "   Download KFGQPC Uthmanic Script HAFS font"
echo "   Place it at: backend/fonts/UthmanicHafs.ttf"
echo "   See: backend/fonts/README.md for details"
echo ""
echo "🚀 To start the application:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   $ cd backend"
echo "   $ source venv/bin/activate"
echo "   $ python app.py"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   $ cd frontend"
echo "   $ npm run dev"
echo ""
echo "   Then open: http://localhost:3000"
echo ""
echo "📖 For more information:"
echo "   - Quick start: QUICKSTART.md"
echo "   - Full docs: README.md"
echo "   - Technical: context.md"
echo ""
echo "Happy video creating! 🎥📖"
