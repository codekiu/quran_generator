# Quran Video Generator - Tasks

## Phase 1: Project Setup ✅
- [x] Create project structure
- [x] Write context.md documentation
- [x] Write tasks.md (this file)
- [x] Write progress.md

## Phase 2: Backend Development 🔄
- [ ] Set up Python virtual environment
- [ ] Install dependencies (Flask, arabic-reshaper, python-bidi, Pillow)
- [ ] Create Flask server (`backend/app.py`)
- [ ] Implement video generation logic (`backend/video_generator.py`)
  - [ ] Parse JSON subtitle input
  - [ ] Generate video frames with Arabic text using Pillow
  - [ ] Apply arabic-reshaper + python-bidi for proper RTL rendering
  - [ ] Use FFmpeg to combine frames, audio, and fade transitions
  - [ ] Test with KFGQPC Uthmanic Script HAFS font
- [ ] Implement audio editing logic (`backend/audio_editor.py`)
  - [ ] Audio loading and metadata extraction
  - [ ] Audio trimming by time range
  - [ ] Export trimmed audio files
- [ ] Create API endpoints
  - [ ] POST `/api/generate-video` - Generate video from JSON + audio
  - [ ] GET `/api/video/:id` - Retrieve generated video
  - [ ] POST `/api/audio/trim` - Trim audio file
  - [ ] GET `/api/audio/waveform` - Get audio waveform data

## Phase 3: Frontend Development 🔄
- [ ] Initialize React project with Vite
- [ ] Set up TailwindCSS and shadcn/ui
- [ ] Create main layout component
- [ ] Implement Video Generator UI
  - [ ] File upload for MP3 recitation
  - [ ] JSON subtitle editor/uploader
  - [ ] Font selector (with KFGQPC Uthmanic Script HAFS default)
  - [ ] Generate button
  - [ ] Loading indicator
  - [ ] Video preview player
  - [ ] Download button
- [ ] Implement Audio Editor UI
  - [ ] File upload for long audio files
  - [ ] Wavesurfer.js integration
  - [ ] Waveform visualization
  - [ ] Play/pause controls
  - [ ] Region selection for trimming
  - [ ] Time display (current / total)
  - [ ] Trim and export button
- [ ] Create API service layer
  - [ ] Axios configuration
  - [ ] API request handlers
  - [ ] Error handling
- [ ] Add responsive design for mobile/tablet

## Phase 4: Testing & Refinement 📋
- [ ] Test Arabic text rendering
  - [ ] Verify RTL direction
  - [ ] Check tashkil display
  - [ ] Validate character reshaping
- [ ] Test with sample Quran recitation
  - [ ] Load sample JSON with 5-10 ayat
  - [ ] Test with actual MP3 recitation
  - [ ] Verify subtitle synchronization
- [ ] Test fade transitions
  - [ ] Smooth fade in/out between verses
  - [ ] Timing accuracy
- [ ] Test audio editor
  - [ ] Load 30-minute recitation
  - [ ] Select and trim segments
  - [ ] Export quality verification
- [ ] Performance optimization
  - [ ] Video generation speed
  - [ ] Large file handling
  - [ ] Memory management

## Phase 5: Documentation & Deployment 📚
- [ ] Write README.md with setup instructions
- [ ] Document API endpoints
- [ ] Create example JSON files
- [ ] Provide sample audio files (if possible)
- [ ] Add troubleshooting guide
- [ ] Create demo video/screenshots

## Known Challenges to Address
1. **Font Availability**: Ensure KFGQPC Uthmanic Script HAFS font is accessible
2. **FFmpeg Arabic Support**: Verify `text_shaping=1` works correctly
3. **File Size**: Large video files may need compression optimization
4. **Processing Time**: Video generation may be slow for long recitations
5. **Cross-browser Audio**: Ensure wavesurfer.js works across all browsers

## Future Enhancements 🚀
- [ ] Batch video generation (multiple videos at once)
- [ ] Custom background colors/images
- [ ] Multiple subtitle styles
- [ ] Export in different resolutions (720p, 1080p, 4K)
- [ ] Add background Islamic patterns
- [ ] Support for other languages (English, French, etc.)
- [ ] Cloud storage integration (S3, Google Drive)
- [ ] User accounts and saved projects
- [ ] Mobile app version
