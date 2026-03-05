import React, { useState, useMemo } from 'react';
import { Upload, Video, Download, Loader2, Check, AlertCircle, FileText, Music } from 'lucide-react';
import Button from './ui/Button';
import { videoAPI } from '@/services/api';
import { formatFileSize } from '@/lib/utils';
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
  audioFile: externalAudioFile,
  onAudioFileChange,
  subtitlesData,
  onSubtitlesChange,
  onNavigateToStep,
}) => {
  const [internalAudioFile, setInternalAudioFile] = useState(null);
  const audioFile = externalAudioFile ?? internalAudioFile;
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
  const [selectedFormats, setSelectedFormats] = usePersistentState(
    buildStorageKey('selectedFormats'),
    buildDefaultFormats,
  );
  const [activePreviewProfile, setActivePreviewProfile] = useState('tiktok');

  // Parse subtitles for summary
  const subtitlesSummary = useMemo(() => {
    if (!subtitlesData || !subtitlesData.trim()) return null;
    try {
      const data = JSON.parse(subtitlesData);
      if (!data || !Array.isArray(data.subtitles)) return null;
      return {
        count: data.subtitles.length,
        reference: data.surah_reference || '',
        hasTimes: data.subtitles.some((s) => s.start_time > 0),
      };
    } catch {
      return null;
    }
  }, [subtitlesData]);

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setInternalAudioFile(file);
    if (onAudioFileChange) onAudioFileChange(file);
    setError(null);
  };

  const loadSampleData = () => {
    const sampleData = {
      "surah_reference": "Al-Baqarah · Ayat 1-3",
      "subtitles": [
        {
          "verse": 1,
          "start_time": 0,
          "end_time": 4,
          "arabic_text": "\u0627\u0644\u0645",
          "translated_text": "Alif, Lam, Mim"
        },
        {
          "verse": 2,
          "start_time": 4,
          "end_time": 10,
          "arabic_text": "\u0630\u064e\u0670\u0644\u0650\u0643\u064e \u0627\u0644\u0652\u0643\u0650\u062a\u064e\u0627\u0628\u064f \u0644\u0627 \u0631\u064e\u064a\u0652\u0628\u064e \u06db \u0641\u0650\u064a\u0647\u0650 \u06db \u0647\u064f\u062f\u064b\u0649 \u0644\u0650\u0651\u0644\u0652\u0645\u064f\u062a\u064e\u0651\u0642\u0650\u064a\u0646\u064e",
          "translated_text": "Ese es el Libro sobre el cual no hay duda; es una gu\u00eda para los piadosos"
        },
        {
          "verse": 3,
          "start_time": 10,
          "end_time": 16,
          "arabic_text": "\u0627\u0644\u064e\u0651\u0630\u0650\u064a\u0646\u064e \u064a\u064f\u0624\u0652\u0645\u0650\u0646\u064f\u0648\u0646\u064e \u0628\u0650\u0627\u0644\u0652\u063a\u064e\u064a\u0652\u0628\u0650 \u0648\u064e\u064a\u064f\u0642\u0650\u064a\u0645\u064f\u0648\u0646\u064e \u0627\u0644\u0635\u064e\u0651\u0644\u064e\u0627\u0629\u064e \u0648\u064e\u0645\u0650\u0645\u064e\u0651\u0627 \u0631\u064e\u0632\u064e\u0642\u0652\u0646\u064e\u0627\u0647\u064f\u0645\u0652 \u064a\u064f\u0646\u0641\u0650\u0642\u064f\u0648\u0646\u064e",
          "translated_text": "Quienes creen en lo oculto, cumplen la oraci\u00f3n y dan de lo que les hemos prove\u00eddo"
        }
      ]
    };
    if (onSubtitlesChange) {
      onSubtitlesChange(JSON.stringify(sampleData, null, 2));
    }
  };

  const handleGenerate = async () => {
    setError(null);
    setResult(null);
    setPreviewUrl(null);
    setActivePreviewProfile(null);

    if (!audioFile) {
      setError('Please select an audio file');
      return;
    }

    if (!subtitlesData || !subtitlesData.trim()) {
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
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Video className="w-5 h-5 text-amber-500" />
          Generate Video
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Generate Quran recitation videos with Arabic and translated subtitles
        </p>
      </div>

      <div className="space-y-4">
        {/* Readiness Summary */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Readiness</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <Music className={`h-4 w-4 ${audioFile ? 'text-emerald-400' : 'text-muted-foreground'}`} />
              {audioFile ? (
                <span>{audioFile.name} ({formatFileSize(audioFile.size)})</span>
              ) : (
                <span className="text-muted-foreground">No audio — upload below</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className={`h-4 w-4 ${subtitlesSummary ? 'text-emerald-400' : 'text-muted-foreground'}`} />
              {subtitlesSummary ? (
                <span>
                  {subtitlesSummary.count} verse{subtitlesSummary.count !== 1 ? 's' : ''}
                  {subtitlesSummary.reference ? ` · ${subtitlesSummary.reference}` : ''}
                  {subtitlesSummary.hasTimes ? '' : ' (no timings)'}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigateToStep?.(1)}
                  className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
                >
                  No subtitles — go to Subtitles step
                </button>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSampleData}
          >
            Load Sample
          </Button>
        </div>

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
              <Check className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          {audioFile && (
            <p className="text-xs text-muted-foreground">
              {audioFile.name} ({formatFileSize(audioFile.size)})
            </p>
          )}
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
                      ? 'border-amber-500 bg-amber-900/40 dark:border-amber-400/70'
                      : 'border-border bg-background hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-amber-500" />}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Select at least one format. Separate download buttons will be available for each platform.
          </p>
        </div>

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
          variant="golden"
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
          <div className="p-4 rounded-md bg-amber-900/20 text-amber-100">
            <p className="text-sm">{progress}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 rounded-md bg-red-900/20 text-red-100 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Success Result */}
        {result?.videos?.length > 0 && (
          <div className="p-4 rounded-md bg-green-900/20 text-green-100 space-y-4">
            <div className="flex items-start gap-2">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Videos generated successfully!</p>
                <p className="text-xs text-green-100/70">
                  Download the format that best fits each platform.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {result.videos.map((video) => (
                <div
                  key={`${video.profile}-${video.video_filename}`}
                  className="flex flex-col gap-2 rounded-lg border border-green-500/30 bg-green-950/20 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
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
      </div>
    </section>
  );
};

export default VideoGenerator;
