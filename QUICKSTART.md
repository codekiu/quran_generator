# Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites Check

```bash
# Check Python version (should be 3.9+)
python3 --version

# Check Node.js version (should be 18+)
node --version

# Check if FFmpeg is installed
ffmpeg -version

# If FFmpeg is not installed:
brew install ffmpeg
```

## Installation

### 1. Backend Setup (2 minutes)

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
```

### 2. Frontend Setup (2 minutes)

```bash
cd ../frontend

# Install dependencies
npm install
```

### 3. Font Setup (IMPORTANT!)

Download the **KFGQPC Uthmanic Script HAFS** font and place it at:
```
backend/fonts/UthmanicHafs.ttf
```

You can find this font by searching online for "KFGQPC Uthmanic Script HAFS download".

Alternatively, you can use any Arabic font that supports tashkil, but update the path in `backend/.env`:
```
FONT_PATH=./fonts/YourFontName.ttf
```

## Running the Application

### Terminal 1: Start Backend

```bash
cd backend
source venv/bin/activate
python app.py
```

You should see:
```
Starting Quran Video Generator API on port 5000
 * Running on http://0.0.0.0:5000
```

### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE ready in XXX ms

  ➜  Local:   http://localhost:3000/
```

## Access the Application

Open your browser and go to: **http://localhost:3000**

## Your First Video

### Step 1: Prepare Audio (Optional)
1. Click on **Audio Editor** tab
2. Upload a Quran recitation MP3
3. Select a region (or click "Select Region")
4. Click **Trim Audio**
5. Download the trimmed audio

### Step 2: Generate Video
1. Click on **Video Generator** tab
2. Upload your audio file
3. Click **Load Sample** to load example subtitles
4. Click **Generate Video**
5. Wait 1-2 minutes for processing
6. Preview and download your video!

## Sample Data

The application includes sample subtitle data. Click "Load Sample" in the Video Generator to see the format.

You can also find `sample_subtitles.json` in the root directory.

## Troubleshooting

### Backend won't start
- Make sure virtual environment is activated: `source venv/bin/activate`
- Check if port 5000 is available: `lsof -i :5000`

### Frontend won't start
- Delete `node_modules` and run `npm install` again
- Check if port 3000 is available

### FFmpeg not found
```bash
brew install ffmpeg
```

### Font issues
- Ensure font is at `backend/fonts/UthmanicHafs.ttf`
- Or update `FONT_PATH` in `backend/.env`

### "No module named 'flask'"
Make sure you're in the virtual environment:
```bash
source backend/venv/bin/activate
```

## Video Format

The generated videos are:
- **Resolution**: 1080x1920 (vertical, perfect for Instagram/TikTok)
- **Format**: MP4 (H.264)
- **Audio**: AAC, 192kbps
- **Frame Rate**: 30 fps

## Next Steps

1. Read the full README.md for detailed documentation
2. Check context.md for technical architecture
3. Review tasks.md for feature roadmap
4. Customize the styling in the frontend
5. Adjust video settings in `backend/video_generator.py`

## Need Help?

- Check the README.md troubleshooting section
- Review the progress.md for implementation details
- Ensure all prerequisites are correctly installed

---

Happy video creating! 🎥📖
