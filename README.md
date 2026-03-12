# Quran Video Generator

Generate social media videos with Quran recitations featuring synchronized Arabic and Spanish subtitles. Supports TikTok/Reels (1080x1920) and YouTube (1920x1080) video profiles.

## Example Output

[![Example Video](https://img.youtube.com/vi/E3nEKkBIy8k/0.jpg)](https://www.youtube.com/shorts/E3nEKkBIy8k)

## Features

- **Video generation** with multiple profiles (TikTok 1080x1920, YouTube 1920x1080)
- **Quran verse search** with Arabic text from QPC HAFS dataset and Spanish translations via alquran.cloud API
- **Subtitle editor** with JSON preview and per-verse timing controls
- **Audio editor** with waveform visualization, trimming, noise cleaning, and automatic timestamp detection
- **Arabic text rendering** using KFGQPC Uthmanic Script HAFS font with proper RTL support and tashkil
- Fade in/out transitions between verses
- Watermark / channel name overlay support
- Surah reference display on generated videos

## Tech Stack

### Backend
- Python 3.9+, Flask, FFmpeg
- arabic-reshaper, python-bidi, Pillow, pydub

### Frontend
- React 18, Vite, TailwindCSS
- wavesurfer.js, Axios, Lucide React

## Quick Start (Docker)

The fastest way to run the project — just needs [Docker](https://docs.docker.com/get-docker/):

```bash
docker compose up --build
```

Open http://localhost — that's it. The frontend (nginx) serves the app and proxies API requests to the backend.

### Dev Mode (Hot-Reloading)

For contributors — edits to source files reload automatically:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Open http://localhost:3000 (Vite dev server). Backend auto-reloads on Python file changes.

### Makefile Shortcuts

| Command | Description |
|---------|-------------|
| `make up` | Start production containers (detached) |
| `make down` | Stop all containers |
| `make dev` | Start dev containers with hot-reloading |
| `make build` | Build containers without starting |
| `make clean` | Stop containers, remove volumes and orphans |
| `make logs` | Tail container logs |
| `make local-backend` | Run backend locally (requires venv) |
| `make local-frontend` | Run frontend locally |

---

## Manual Setup

<details>
<summary>Set up without Docker (click to expand)</summary>

### Prerequisites

- Python 3.9+
- Node.js 18+
- FFmpeg (`brew install ffmpeg`)

### Automated

```bash
bash INSTALL.sh
```

### Manual

```bash
# Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# Frontend
cd ../frontend
npm install
```

### Running

```bash
# Terminal 1 — Backend (port 5001)
cd backend
source .venv/bin/activate
python app.py

# Terminal 2 — Frontend (port 3000)
cd frontend
npm run dev
```

Open http://localhost:3000

</details>

## Usage

The app uses a 3-step workflow:

1. **Verses** — Search and select Quran verses by surah. Arabic text is loaded from the local QPC HAFS dataset; translations are fetched from alquran.cloud.
2. **Subtitles** — Review and edit subtitle timing, Arabic text, and translations. Adjust start/end times per verse.
3. **Generate** — Upload audio, select video profiles (TikTok, YouTube, or both), optionally add a watermark, and generate the video.

## Subtitle JSON Format

```json
{
  "surah_reference": "Al-Baqarah - Ayat 1-5",
  "subtitles": [
    {
      "verse": 1,
      "start_time": 0,
      "end_time": 4,
      "arabic_text": "الم",
      "translated_text": "Alif, Lam, Mim",
      "show_verse_number": true
    },
    {
      "verse": 2,
      "start_time": 4,
      "end_time": 10,
      "arabic_text": "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ",
      "translated_text": "Ese es el Libro sobre el cual no hay duda; es una guia para los piadosos",
      "show_verse_number": false
    }
  ]
}
```

Each subtitle requires: `verse`, `start_time`, `end_time`, `arabic_text`, `translated_text`. Optional: `show_verse_number` (boolean, defaults to `true`) — when enabled, appends the verse number in Arabic-Indic numerals to the Arabic text and in parentheses to the translation in the generated video.

## API Endpoints

### Quran
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quran/surah/:chapter_number` | Get surah Arabic text + translation |

### Video
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate-video` | Generate video with subtitles and audio |
| GET | `/api/video/:filename` | Download generated video |

### Audio
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/audio/info` | Get audio file metadata |
| POST | `/api/audio/trim` | Trim audio by time range |
| GET | `/api/audio/:filename` | Download processed audio |
| POST | `/api/audio/timestamps` | Detect voice segments via silence detection |
| POST | `/api/audio/waveform` | Get waveform data for visualization |
| POST | `/api/audio/clean` | Clean audio (noise reduction, EQ, normalization) |

### Utility
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/test-arabic` | Test Arabic text rendering (returns image) |
| GET | `/api/image/:filename` | Download generated image |

## Project Structure

```
quran_generator/
├── backend/
│   ├── app.py                    # Flask server and API routes
│   ├── ffmpeg_video_generator.py # Video generation with FFmpeg
│   ├── audio_editor.py           # Audio processing (trim, clean, waveform, timestamps)
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Environment variable template
│   ├── Dockerfile                # Backend production container
│   └── fonts/
│       ├── UthmanicHafs.otf      # Primary Arabic font
│       └── ScheherazadeNew-Regular.ttf
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Main app with 3-step workflow
│   │   ├── main.jsx              # Entry point
│   │   ├── components/
│   │   │   ├── QuranSearchTool.jsx  # Surah search and verse selection
│   │   │   ├── SubtitleEditor.jsx   # Subtitle timing and text editor
│   │   │   ├── VideoGenerator.jsx   # Video generation controls
│   │   │   ├── AudioEditor.jsx      # Audio waveform editor
│   │   │   ├── TimestampHelper.jsx  # Automatic timestamp detection
│   │   │   └── ui/                  # Reusable UI components
│   │   ├── data/
│   │   │   └── quranChapters.js     # Surah metadata (names, verse counts)
│   │   ├── hooks/
│   │   │   └── usePersistentState.js # localStorage-backed state hook
│   │   ├── services/
│   │   │   ├── api.js               # Backend API client
│   │   │   └── quran.js             # Quran API service
│   │   └── lib/
│   │       └── utils.js             # Utility functions
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   ├── Dockerfile                # Frontend production container (nginx)
│   ├── Dockerfile.dev            # Frontend dev container (Vite hot-reload)
│   └── nginx.conf                # Production nginx config
├── docker-compose.yml            # Production Docker setup
├── docker-compose.dev.yml        # Dev overrides (hot-reloading)
├── Makefile                      # Convenience commands
├── qpc-hafs.json                 # QPC HAFS Arabic text dataset
├── sample_subtitles.json         # Example subtitle file
├── INSTALL.sh                    # Automated installation script
├── uploads/                      # Uploaded files (gitignored)
├── outputs/                      # Generated videos (gitignored)
└── temp/                         # Temporary processing files (gitignored)
```

## Configuration

Backend environment variables (`backend/.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `FLASK_ENV` | `development` | Flask environment |
| `FLASK_PORT` | `5001` | Backend server port |
| `UPLOAD_FOLDER` | `../uploads` | Upload directory |
| `OUTPUT_FOLDER` | `../outputs` | Output directory |
| `TEMP_FOLDER` | `../temp` | Temporary processing directory |
| `FONT_PATH` | `./fonts/UthmanicHafs.otf` | Path to Arabic font |
| `QPC_HAFS_PATH` | `../qpc-hafs.json` | Path to QPC HAFS dataset |

## Troubleshooting

**FFmpeg not found** — Install with `brew install ffmpeg` and verify with `ffmpeg -version`.

**Arabic text not rendering** — Ensure `backend/fonts/UthmanicHafs.otf` exists (note: `.otf`, not `.ttf`). Update `FONT_PATH` in `.env` if using a different font.

**Port conflicts** — Backend defaults to port 5001 (`FLASK_PORT` in `.env`). Frontend runs on port 3000 and proxies `/api` requests to the backend.

**CORS issues** — The Vite dev server proxies API requests to the backend. Ensure both servers are running and the proxy target in `vite.config.js` matches `FLASK_PORT`.

**Docker: backend unhealthy** — Run `docker compose logs backend` to check for startup errors. The health check hits `/api/health` — if it fails, the frontend container won't start (`depends_on: condition: service_healthy`).

**Docker: old code running** — Rebuild with `docker compose up --build` or `make clean && make up` to clear cached layers.

## License

MIT License — free to use, modify, and distribute. Spread the Quran everywhere.

## Acknowledgments

- FFmpeg for video processing
- arabic-reshaper for Arabic text rendering
- WaveSurfer.js for audio visualization
- alquran.cloud for Quran translation API
- KFGQPC for the Uthmanic Script HAFS font
