# Quran Video Generator

A comprehensive tool for generating Instagram/TikTok videos featuring Quran recitations with synchronized Arabic and Spanish subtitles. Includes an audio editing tool for preparing recitation clips.

## Features

### Video Generator
- ✅ Black background videos with centered subtitles
- ✅ Arabic text in **KFGQPC Uthmanic Script HAFS** font
- ✅ Spanish translations below Arabic text
- ✅ Fade in/out transitions between verses
- ✅ Synchronized with Quran recitation audio
- ✅ Support for tashkil (diacritical marks)
- ✅ Proper RTL (right-to-left) text rendering
- ✅ Video preview before download
- ✅ Vertical format (1080x1920) for social media

### Audio Editor
- ✅ Visual waveform display
- ✅ Precise audio trimming by time selection
- ✅ Play/pause controls with seek functionality
- ✅ Export trimmed audio segments
- ✅ Support for long recitations (30+ minutes)
- ✅ Region selection with drag and resize

## Tech Stack

### Backend
- **Python 3.9+**: Core backend language
- **FFmpeg**: Video generation engine
- **Flask**: Web server for API endpoints
- **arabic-reshaper**: Arabic character reshaping
- **python-bidi**: Unicode bidirectional algorithm for RTL
- **Pillow**: Image processing for text rendering
- **pydub**: Audio processing

### Frontend
- **React 18**: Modern UI framework
- **Vite**: Fast build tool
- **TailwindCSS**: Utility-first CSS framework
- **wavesurfer.js**: Audio waveform visualization
- **Lucide React**: Icon library
- **Axios**: HTTP client

## Prerequisites

### System Requirements
- macOS (or Linux/Windows with adjustments)
- Python 3.9 or higher
- Node.js 18 or higher
- FFmpeg installed via Homebrew
- Homebrew package manager (macOS)

### Install FFmpeg
```bash
brew install ffmpeg
```

### Font Installation
You need the **KFGQPC Uthmanic Script HAFS** font. Place it in:
```
backend/fonts/UthmanicHafs.ttf
```

Or install it system-wide on macOS.

## Installation

### 1. Clone the Repository
```bash
cd /Users/lynx/codekiu/quran_generator
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env and configure paths if needed
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
```

## Running the Application

### Start Backend Server (Terminal 1)
```bash
cd backend
source venv/bin/activate
python app.py
```

The backend API will run on `http://localhost:5000`

### Start Frontend Development Server (Terminal 2)
```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

### 1. Audio Editing
1. Click on the **Audio Editor** tab
2. Upload your Quran recitation audio file (MP3, WAV, etc.)
3. Use the waveform to select the region you want to keep
   - Click "Select Region" to create a selection
   - Drag the edges to adjust the selection
4. Click **Trim Audio** to process
5. Download the trimmed audio file

### 2. Video Generation
1. Click on the **Video Generator** tab
2. Upload your audio file (use the trimmed file from step 1)
3. Provide subtitles in JSON format:

```json
[
  {
    "verse": 1,
    "start_time": 0,
    "end_time": 5,
    "arabic_text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    "spanish_text": "En el nombre de Allah, el Compasivo, el Misericordioso"
  },
  {
    "verse": 2,
    "start_time": 5,
    "end_time": 10,
    "arabic_text": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    "spanish_text": "Alabado sea Allah, Señor de los mundos"
  }
]
```

4. Click **Load Sample** to see an example
5. Customize the output filename if desired
6. Click **Generate Video**
7. Wait for processing (may take a few minutes)
8. Preview the video in the browser
9. Download the final video

## JSON Subtitle Format

Each subtitle object requires:
- `verse` (number): Verse number
- `start_time` (number): Start time in seconds
- `end_time` (number): End time in seconds
- `arabic_text` (string): Arabic text with tashkil
- `spanish_text` (string): Spanish translation

## API Endpoints

### Video Generation
- `POST /api/generate-video` - Generate video
- `GET /api/video/:filename` - Download video
- `POST /api/test-arabic` - Test Arabic rendering

### Audio Processing
- `POST /api/audio/info` - Get audio metadata
- `POST /api/audio/trim` - Trim audio file
- `GET /api/audio/:filename` - Download audio
- `POST /api/audio/waveform` - Get waveform data

### Health Check
- `GET /api/health` - API health status

## Project Structure

```
quran_generator/
├── backend/
│   ├── app.py              # Flask server
│   ├── video_generator.py  # Video generation logic
│   ├── audio_editor.py     # Audio processing
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Environment template
│   └── fonts/             # Arabic fonts directory
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── VideoGenerator.jsx
│   │   │   ├── AudioEditor.jsx
│   │   │   └── ui/       # UI components
│   │   ├── services/      # API services
│   │   ├── lib/          # Utilities
│   │   ├── App.jsx       # Main app
│   │   └── main.jsx      # Entry point
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── uploads/               # Temporary file storage
├── outputs/               # Generated videos
├── temp/                 # Temporary processing files
├── context.md            # Project context
├── tasks.md              # Task tracking
├── progress.md           # Development progress
└── README.md            # This file
```

## Troubleshooting

### FFmpeg Not Found
```bash
# Install FFmpeg
brew install ffmpeg

# Verify installation
ffmpeg -version
```

### Font Issues
If Arabic text doesn't render correctly:
1. Ensure the font file is in `backend/fonts/UthmanicHafs.ttf`
2. Update `FONT_PATH` in `.env`
3. Verify the font supports Arabic script and tashkil

### Audio Loading Errors
- Ensure audio file is in a supported format (MP3, WAV, OGG, M4A)
- Check file size (max 500MB)
- Verify pydub is installed correctly

### Video Generation Slow
- Video generation can take 1-2 minutes for a 30-second clip
- Processing time depends on the number of verses and system performance
- Consider using shorter audio clips for testing

### CORS Issues
If frontend can't connect to backend:
1. Ensure backend is running on port 5000
2. Check Vite proxy configuration in `vite.config.js`
3. Verify Flask-CORS is installed

## Building for Production

### Frontend Build
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

### Backend Production
Consider using:
- **Gunicorn** for Python WSGI server
- **Nginx** for reverse proxy
- **Docker** for containerization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and personal use.

## Acknowledgments

- FFmpeg for powerful video processing
- arabic-reshaper for Arabic text rendering
- WaveSurfer.js for audio visualization
- React and TailwindCSS communities

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review `context.md` for technical details
3. Check `tasks.md` for known issues

---

**Made with ❤️ for the Muslim community**
