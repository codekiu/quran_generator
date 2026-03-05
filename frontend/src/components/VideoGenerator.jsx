import React, { useEffect, useRef, useState } from 'react';
import { Upload, Video, Download, Loader2, Check, AlertCircle, Copy, Play, Pause, Square, Rewind, FastForward } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import QuranSearchTool from './QuranSearchTool';
import { videoAPI } from '@/services/api';
import { formatFileSize, formatTime } from '@/lib/utils';
import usePersistentState from '@/hooks/usePersistentState';

const VIDEO_FORMAT_OPTIONS = [
  {
    key: 'tiktok',
    label: 'TikTok / Reels',
    description: '1080x1920 · Vertical',
  },
  {
    key: 'youtube',
    label: 'YouTube 1080p',
    description: '1920x1080 · Horizontal',
  },
];

const VIDEO_GENERATOR_STORAGE_PREFIX = 'video-generator';

const buildDefaultFormats = () => {
  const initial = {};
  VIDEO_FORMAT_OPTIONS.forEach((option) => {
    initial[option.key] = true;
  });
  return initial;
};

const buildStorageKey = (suffix) => `${VIDEO_GENERATOR_STORAGE_PREFIX}:${suffix}`;

const VideoGenerator = ({
  title = 'Video Generator',
  description = 'Generate Quran recitation videos with Arabic and translated subtitles',
  icon: IconComponent = Video,
  enablePlaybackHelper = false,
  showQuranSearchTool = true,
  showGenerationTools = true,
}) => {
  const [audioFile, setAudioFile] = useState(null);
  const [subtitlesData, setSubtitlesData] = usePersistentState(
    buildStorageKey('subtitlesData'),
    '',
  );
  const [outputName, setOutputName] = usePersistentState(
    buildStorageKey('outputName'),
    'quran_video.mp4',
  );
  const [trimTailSeconds, setTrimTailSeconds] = usePersistentState(
    buildStorageKey('trimTailSeconds'),
    '',
  );
  const [watermarkText, setWatermarkText] = usePersistentState(
    buildStorageKey('watermarkText'),
    '',
  );
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const audioElementRef = useRef(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [copiedTimestamp, setCopiedTimestamp] = useState(false);
  const [audioHelperError, setAudioHelperError] = useState(null);
  const [selectedFormats, setSelectedFormats] = usePersistentState(
    buildStorageKey('selectedFormats'),
    buildDefaultFormats,
  );
  const [activePreviewProfile, setActivePreviewProfile] = useState('tiktok');

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, [audioPreviewUrl]);

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    setAudioFile(file);
    setError(null);

    if (enablePlaybackHelper) {
      setAudioHelperError(null);
      setIsAudioPlaying(false);
      setCopiedTimestamp(false);
      setAudioCurrentTime(0);
      setAudioDuration(0);
      setAudioPreviewUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return URL.createObjectURL(file);
      });
    }
  };

  const handleSubtitlesChange = (e) => {
    setSubtitlesData(e.target.value);
    setError(null);
  };

  const toggleAudioPlayback = () => {
    if (!enablePlaybackHelper || !audioElementRef.current) return;
    if (audioElementRef.current.paused) {
      audioElementRef.current.play();
    } else {
      audioElementRef.current.pause();
    }
  };

  const stopAudioPlayback = () => {
    if (!enablePlaybackHelper || !audioElementRef.current) return;
    audioElementRef.current.pause();
    audioElementRef.current.currentTime = 0;
    setIsAudioPlaying(false);
    setAudioCurrentTime(0);
  };

  const seekAudio = (deltaSeconds) => {
    if (!enablePlaybackHelper || !audioElementRef.current) return;
    const audioNode = audioElementRef.current;
    const durationLimit = Number.isFinite(audioNode.duration) ? audioNode.duration : Infinity;
    const nextTime = Math.min(Math.max(audioNode.currentTime + deltaSeconds, 0), durationLimit);
    audioNode.currentTime = nextTime;
  };

  const handleCopyCurrentTimestamp = async () => {
    if (!enablePlaybackHelper || !audioElementRef.current) return;

    try {
      const seconds = audioElementRef.current.currentTime || 0;
      await navigator.clipboard.writeText(seconds.toFixed(3));
      setCopiedTimestamp(true);
      setAudioHelperError(null);
      setTimeout(() => setCopiedTimestamp(false), 1500);
    } catch (err) {
      setAudioHelperError('Unable to copy the current timestamp.');
    }
  };

  const loadSampleData = () => {
    const sampleData = {
      "surah_reference": "Al-Baqarah · Ayat 1-3",
      "subtitles": [
        {
          "verse": 1,
          "start_time": 0,
          "end_time": 4,
          "arabic_text": "الم",
          "translated_text": "Alif, Lam, Mim"
        },
        {
          "verse": 2,
          "start_time": 4,
          "end_time": 10,
          "arabic_text": "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ",
          "translated_text": "Ese es el Libro sobre el cual no hay duda; es una guía para los piadosos"
        },
        {
          "verse": 3,
          "start_time": 10,
          "end_time": 16,
          "arabic_text": "الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ",
          "translated_text": "Quienes creen en lo oculto, cumplen la oración y dan de lo que les hemos proveído"
        }
      ]
    };
    setSubtitlesData(JSON.stringify(sampleData, null, 2));
  };

  const handleGenerate = async () => {
    setError(null);
    setResult(null);
    setPreviewUrl(null);
    setActivePreviewProfile(null);

    // Validation
    if (!audioFile) {
      setError('Please select an audio file');
      return;
    }

    if (!subtitlesData.trim()) {
      setError('Please provide subtitles data');
      return;
    }

    let payload;
    try {
      payload = JSON.parse(subtitlesData);
    } catch (e) {
      setError(`Invalid JSON format: ${e.message}`);
      return;
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      setError('Subtitles JSON must be an object with surah_reference and subtitles array');
      return;
    }

    const { surah_reference: globalReference, subtitles } = payload;
    if (!Array.isArray(subtitles) || subtitles.length === 0) {
      setError('The "subtitles" field must be a non-empty array');
      return;
    }

    if (!globalReference || !globalReference.trim()) {
      setError('Please provide a "surah_reference" string describing the verses');
      return;
    }

    let parsedTrimSeconds = null;
    if (trimTailSeconds !== '') {
      const numericTrim = Number(trimTailSeconds);
      if (Number.isNaN(numericTrim) || numericTrim < 0) {
        setError('Trim Tail must be a non-negative number.');
        return;
      }
      parsedTrimSeconds = numericTrim;
    }

    const requestedProfiles = VIDEO_FORMAT_OPTIONS.filter((option) => selectedFormats[option.key]).map((option) => option.key);

    if (requestedProfiles.length === 0) {
      setError('Please select at least one video format to generate.');
      return;
    }

    setLoading(true);
    setProgress('Uploading files and generating video...');

    try {
      const response = await videoAPI.generateVideo(audioFile, payload, outputName, {
        trim_end_seconds: parsedTrimSeconds,
        watermark_text: watermarkText,
        'profiles[]': requestedProfiles,
      });
      const normalizedVideos = (Array.isArray(response.videos) && response.videos.length > 0
        ? response.videos
        : [
            {
              profile: response.requested_profiles?.[0] || requestedProfiles[0],
              label: 'Generated Video',
              video_filename: response.video_filename,
              video_size: response.video_size,
              download_url: response.download_url,
            },
          ]
      ).map((video) => ({
        ...video,
        download_url: video.download_url || videoAPI.downloadVideo(video.video_filename),
      }));

      const preferredVideo =
        normalizedVideos.find((video) => video.profile === 'tiktok') || normalizedVideos[0];

      setResult({ ...response, videos: normalizedVideos });
      setProgress(
        normalizedVideos.length > 1
          ? 'Videos generated successfully! You can download each format below.'
          : 'Video generated successfully!'
      );

      setPreviewUrl(preferredVideo.download_url);
      setActivePreviewProfile(preferredVideo.profile);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to generate video');
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (video) => {
    if (!video) return;
    const downloadUrl = video.download_url || videoAPI.downloadVideo(video.video_filename);
    window.open(downloadUrl, '_blank');
  };

  const handleToggleFormat = (formatKey) => {
    setSelectedFormats((prev) => ({
      ...prev,
      [formatKey]: !prev[formatKey],
    }));
  };

  const handleSelectPreview = (video) => {
    if (!video) return;
    setActivePreviewProfile(video.profile);
    setPreviewUrl(video.download_url || videoAPI.downloadVideo(video.video_filename));
  };

  return (
    <div className="space-y-6">
      {showQuranSearchTool && <QuranSearchTool />}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconComponent className="w-6 h-6" />
            {title}
          </CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Audio Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Audio File (MP3/WAV)</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".mp3,.wav,.ogg,.m4a"
                onChange={handleAudioChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
              />
              {audioFile && (
                <Check className="w-5 h-5 text-green-500" />
              )}
            </div>
            {audioFile && (
              <p className="text-xs text-muted-foreground">
                {audioFile.name} ({formatFileSize(audioFile.size)})
              </p>
            )}
          </div>

          {enablePlaybackHelper && (
            <div className="space-y-3 rounded-xl border border-indigo-200/70 bg-indigo-50/80 p-4 dark:border-indigo-500/30 dark:bg-indigo-950/30">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-50">Manual Timestamp Helper</p>
                <p className="text-xs text-indigo-900/70 dark:text-indigo-100/70">
                  Listen to your recitation, scrub through the audio, and copy the precise timestamp where a verse begins.
                </p>
              </div>

              {audioFile && audioPreviewUrl ? (
                <div className="space-y-3">
                  <audio
                    ref={audioElementRef}
                    src={audioPreviewUrl}
                    controls
                    className="w-full rounded-md border border-indigo-100 bg-white/80 p-2 text-sm shadow-sm dark:border-indigo-500/20 dark:bg-indigo-900/40"
                    onPlay={() => setIsAudioPlaying(true)}
                    onPause={() => setIsAudioPlaying(false)}
                    onEnded={() => setIsAudioPlaying(false)}
                    onTimeUpdate={(event) => setAudioCurrentTime(event.target.currentTime)}
                    onLoadedMetadata={(event) => setAudioDuration(event.target.duration || 0)}
                  />
                  <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="text-sm text-indigo-900 dark:text-indigo-50">
                      <p className="font-mono">
                        Current: {formatTime(audioCurrentTime)} ({audioCurrentTime.toFixed(3)}s)
                      </p>
                      {audioDuration > 0 && (
                        <p className="text-xs text-indigo-900/70 dark:text-indigo-100/70">
                          Duration: {formatTime(audioDuration)} ({audioDuration.toFixed(3)}s)
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => seekAudio(-5)}>
                        <Rewind className="mr-2 h-4 w-4" />
                        -5s
                      </Button>
                      <Button variant="outline" size="sm" onClick={toggleAudioPlayback}>
                        {isAudioPlaying ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Play
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm" onClick={stopAudioPlayback}>
                        <Square className="mr-2 h-4 w-4" />
                        Stop
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => seekAudio(5)}>
                        <FastForward className="mr-2 h-4 w-4" />
                        +5s
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="secondary"
                      className="flex-1 sm:flex-none"
                      onClick={handleCopyCurrentTimestamp}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {copiedTimestamp ? 'Copied!' : 'Copy Current Timestamp'}
                    </Button>
                    <p className="text-xs text-indigo-900/80 dark:text-indigo-100/70">
                      Copies the current playback position (in seconds with milliseconds) to your clipboard.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-indigo-900/80 dark:text-indigo-50/80">
                  Upload an audio file to unlock playback controls.
                </p>
              )}
              {audioHelperError && (
                <div className="rounded-md border border-red-200/70 bg-red-50/80 p-2 text-xs text-red-900 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-100">
                  {audioHelperError}
                </div>
              )}
            </div>
          )}

          {showGenerationTools && (
            <>
              {/* Subtitles Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Subtitles (JSON)</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadSampleData}
                  >
                    Load Sample
                  </Button>
                </div>
                <textarea
                  value={subtitlesData}
                  onChange={handleSubtitlesChange}
                  placeholder='{"surah_reference": "Al-Baqarah · Ayat 1-3", "subtitles": [{"verse": 1, "start_time": 0, "end_time": 4, "arabic_text": "...", "translated_text": "..."}]}'
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Provide a JSON object with a global surah_reference string and a subtitles array (each item keeps verse, start_time, end_time, arabic_text, translated_text)
                </p>
              </div>

              {/* Format Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Output Formats</label>
                <div className="grid gap-3 md:grid-cols-2">
                  {VIDEO_FORMAT_OPTIONS.map((option) => {
                    const isSelected = selectedFormats[option.key];
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => handleToggleFormat(option.key)}
                        className={`rounded-xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400/70 dark:bg-indigo-900/40'
                            : 'border-border bg-background hover:border-indigo-200 dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{option.label}</p>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select at least one format. Separate download buttons will be available for each platform.
                </p>
              </div>

              {/* Timestamp Helper */}
              

              {/* Output Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Output Filename</label>
                <input
                  type="text"
                  value={outputName}
                  onChange={(e) => setOutputName(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>



              {/* Channel Name / Watermark */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Channel Name / Watermark</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="e.g. @YourChannel (leave empty for no watermark)"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Displayed as a subtle watermark on the video. Leave empty for no watermark.
                </p>
              </div>

              {/* Optional Tail Trim */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Trim Tail (seconds)</label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={trimTailSeconds}
                  onChange={(e) => setTrimTailSeconds(e.target.value)}
                  placeholder="Leave empty to keep full audio"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Cuts this many seconds from the end of the final video (after generation).
                </p>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={loading || !audioFile || !subtitlesData}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Generate Video
                  </>
                )}
              </Button>

              {/* Progress/Status */}
              {progress && (
                <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100">
                  <p className="text-sm">{progress}</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Result */}
              {result?.videos?.length > 0 && (
                <div className="p-4 rounded-md bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100 space-y-4">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Videos generated successfully!</p>
                      <p className="text-xs text-green-900/80 dark:text-green-100/70">
                        Download the format that best fits each platform.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {result.videos.map((video) => (
                      <div
                        key={`${video.profile}-${video.video_filename}`}
                        className="flex flex-col gap-2 rounded-lg border border-green-200/70 bg-white/80 p-3 text-sm shadow-sm dark:border-green-500/30 dark:bg-green-950/20 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium">{video.label || video.profile}</p>
                          <p className="text-xs text-muted-foreground">
                            {video.profile?.toUpperCase()} · {formatFileSize(video.video_size)}
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => handleDownload(video)} className="w-full sm:w-auto">
                          <Download className="mr-2 h-4 w-4" />
                          Download {video.profile === 'youtube' ? 'YouTube' : 'TikTok'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Video Preview */}
              {previewUrl && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-sm font-medium">Preview</label>
                    {result?.videos?.length > 1 && (
                      <div className="flex flex-wrap gap-2">
                        {result.videos.map((video) => (
                          <Button
                            key={`preview-${video.profile}`}
                            variant={activePreviewProfile === video.profile ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleSelectPreview(video)}
                          >
                            {video.profile === 'youtube' ? 'YouTube' : 'TikTok'}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  <video
                    controls
                    className="w-full rounded-md border"
                    src={previewUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoGenerator;
