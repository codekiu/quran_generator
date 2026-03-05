# Quran Video Generator - Context

## Project Overview
A comprehensive tool for generating Instagram/TikTok videos featuring Quran recitations with synchronized Arabic and Spanish subtitles. The project includes an audio editing tool for preparing recitation clips.

## Technical Stack

### Backend
- **Python 3.9+**: Core backend language
- **FFmpeg**: Video generation engine with Arabic RTL support
- **Flask**: Web server for API endpoints
- **arabic-reshaper**: Handles Arabic character reshaping for proper display
- **python-bidi**: Unicode bidirectional algorithm for RTL text
- **Pillow**: Image processing for text rendering

### Frontend
- **React 18**: Modern UI framework
- **TailwindCSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality UI components
- **Lucide React**: Icon library
- **wavesurfer.js**: Audio waveform visualization and editing
- **Axios**: HTTP client for API calls

## Key Features

### Video Generation
- Black background videos with centered subtitles
- Arabic text in **KFGQPC Uthmanic Script HAFS** font
- Spanish translations below Arabic text
- Fade in/out transitions between ayat
- Synchronized with Quran recitation audio
- Support for tashkil (diacritical marks)
- Proper RTL (right-to-left) text rendering

### Audio Editing
- Visual waveform display
- Precise audio trimming by time selection
- Play/pause controls with seek functionality
- Export trimmed audio segments
- Support for long recitations (30+ minutes)

## Arabic Text Rendering Challenges & Solutions

### Challenge 1: RTL Text Direction
Arabic reads right-to-left, but most rendering engines default to LTR.
**Solution**: Use `python-bidi` library to apply Unicode bidirectional algorithm.

### Challenge 2: Character Reshaping
Arabic letters change shape based on position (isolated, initial, medial, final).
**Solution**: Use `arabic-reshaper` to connect letters correctly.

### Challenge 3: Tashkil Support
Diacritical marks must display properly above/below letters.
**Solution**: Use fonts with full tashkil support + FFmpeg's `text_shaping=1` parameter.

### Challenge 4: Font Embedding
FFmpeg needs access to the specific Arabic font.
**Solution**: Embed font path in FFmpeg command or use system fonts.

## Input Format
JSON array with verse data:
```json
[
  {
    "verse": 1,
    "start_time": 0,
    "end_time": 5,
    "arabic_text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    "spanish_text": "En el nombre de Allah, el Compasivo, el Misericordioso"
  }
]
```

## Output Format
- **Video**: MP4 (H.264 codec)
- **Resolution**: 1080x1920 (vertical/portrait for social media)
- **Frame Rate**: 30 fps
- **Audio**: AAC codec, 44.1kHz

## File Structure
```
quran_generator/
├── backend/
│   ├── app.py              # Flask server
│   ├── video_generator.py  # Video generation logic
│   ├── audio_editor.py     # Audio processing
│   ├── requirements.txt    # Python dependencies
│   └── fonts/             # Arabic fonts directory
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   └── App.jsx        # Main app
│   ├── package.json
│   └── tailwind.config.js
├── uploads/               # Temporary file storage
├── outputs/               # Generated videos
├── context.md            # This file
├── tasks.md              # Task tracking
└── progress.md           # Development progress
```

## System Requirements
- macOS (development environment)
- Python 3.9+
- Node.js 18+
- FFmpeg (installed via Homebrew)
- Homebrew package manager

## FFmpeg Installation
```bash
brew install ffmpeg
```

## Font Installation
The **KFGQPC Uthmanic Script HAFS** font must be installed in the system or provided in the `fonts/` directory.
