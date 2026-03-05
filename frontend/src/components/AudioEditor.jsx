import React, { useState, useEffect, useRef } from 'react';
import { Upload, Play, Pause, Square, Scissors, Download, Loader2, Info, Sparkles, Settings } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import Button from './ui/Button';
import { audioAPI } from '@/services/api';
import { formatTime, formatFileSize, parseTime } from '@/lib/utils';

const AudioEditor = () => {
  const [audioFile, setAudioFile] = useState(null);
  const [audioInfo, setAudioInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [trimming, setTrimming] = useState(false);
  const [trimResult, setTrimResult] = useState(null);
  const [error, setError] = useState(null);
  const [timeInputs, setTimeInputs] = useState({ start: '', end: '' });
  const [timeInputError, setTimeInputError] = useState(null);

  // Audio cleaning states
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState(null);
  const [showCleanOptions, setShowCleanOptions] = useState(false);
  const [cleanOptions, setCleanOptions] = useState({
    noiseReduction: true,
    equalize: true,
    normalize: true,
    noiseReductionLevel: 0.5,
    highpassFreq: 80,
    lowpassFreq: 8000,
    outputName: ''
  });

  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const regionsRef = useRef(null);

  useEffect(() => {
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, []);

  const handleAudioChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAudioFile(file);
    setError(null);
    setLoading(true);
    setTrimResult(null);
    setSelectedRegion(null);
    setTimeInputs({ start: '', end: '' });
    setTimeInputError(null);
    try {
      const infoResponse = await audioAPI.getAudioInfo(file);
      setAudioInfo(infoResponse.info);

      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }

      const wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#78716c',
        progressColor: '#d97706',
        cursorColor: '#f59e0b',
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 2,
        height: 128,
        barGap: 2,
      });

      const regions = wavesurfer.registerPlugin(RegionsPlugin.create());
      regionsRef.current = regions;

      wavesurfer.on('ready', () => {
        setDuration(wavesurfer.getDuration());
        setLoading(false);
      });

      wavesurfer.on('error', (event) => {
        setError(`Failed to load audio: ${event || 'Unknown error'}`);
        setLoading(false);
      });

      wavesurfer.on('audioprocess', () => {
        setCurrentTime(wavesurfer.getCurrentTime());
      });

      wavesurfer.on('play', () => setPlaying(true));
      wavesurfer.on('pause', () => setPlaying(false));

      const syncRegionState = (region) => {
        const regionData = { start: region.start, end: region.end };
        setSelectedRegion(regionData);
        setTimeInputs({
          start: formatTime(regionData.start),
          end: formatTime(regionData.end),
        });
      };

      regions.on('region-updated', (region) => {
        syncRegionState(region);
      });

      regions.on('region-created', (region) => {
        const allRegions = regions.getRegions();
        allRegions.forEach((r) => {
          if (r !== region) {
            r.remove();
          }
        });
        syncRegionState(region);
      });

      const fileUrl = URL.createObjectURL(file);
      wavesurfer.load(fileUrl);

      wavesurferRef.current = wavesurfer;
    } catch (err) {
      setError(`Failed to load audio: ${err.message}`);
      setLoading(false);
    }
  };

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const stopPlayback = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.stop();
      setPlaying(false);
      setCurrentTime(0);
    }
  };

  const createRegion = () => {
    if (!wavesurferRef.current || !regionsRef.current) return;

    const duration = wavesurferRef.current.getDuration();
    const start = duration * 0.25;
    const end = duration * 0.75;

    const region = regionsRef.current.addRegion({
      start,
      end,
      color: 'rgba(217, 119, 6, 0.2)',
      drag: true,
      resize: true,
    });

    setSelectedRegion({ start, end });
    setTimeInputs({ start: formatTime(start), end: formatTime(end) });
    return region;
  };

  const handleTimeInputChange = (field, value) => {
    setTimeInputs((prev) => ({ ...prev, [field]: value }));
    setTimeInputError(null);
  };

  const applyManualTimes = () => {
    if (!wavesurferRef.current || !regionsRef.current) return;

    const parsedStart = parseTime(timeInputs.start);
    const parsedEnd = parseTime(timeInputs.end);
    const trackDuration = wavesurferRef.current.getDuration();

    if (parsedStart == null || parsedEnd == null) {
      setTimeInputError('Use mm:ss or hh:mm:ss formats (e.g., 1:32 or 00:45).');
      return;
    }

    if (parsedEnd <= parsedStart) {
      setTimeInputError('End time must be greater than start time.');
      return;
    }

    if (parsedStart >= trackDuration) {
      setTimeInputError('Start time must be within the audio duration.');
      return;
    }

    const safeStart = Math.max(0, parsedStart);
    const safeEnd = Math.min(trackDuration, parsedEnd);

    if (safeEnd - safeStart < 0.2) {
      setTimeInputError('Please select at least 0.2 seconds of audio.');
      return;
    }

    regionsRef.current.getRegions().forEach((region) => region.remove());
    const region = regionsRef.current.addRegion({
      start: safeStart,
      end: safeEnd,
      color: 'rgba(217, 119, 6, 0.2)',
      drag: true,
      resize: true,
    });

    setSelectedRegion({ start: safeStart, end: safeEnd });
    setTimeInputs({ start: formatTime(safeStart), end: formatTime(safeEnd) });
    setTimeInputError(null);
    return region;
  };

  const handleTrim = async () => {
    if (!audioFile || !selectedRegion) {
      setError('Please select a region to trim');
      return;
    }

    setTrimming(true);
    setError(null);
    setTrimResult(null);

    try {
      const outputName = `trimmed_${audioFile.name}`;
      const response = await audioAPI.trimAudio(
        audioFile,
        selectedRegion.start,
        selectedRegion.end,
        outputName
      );
      setTrimResult(response);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to trim audio');
    } finally {
      setTrimming(false);
    }
  };

  const handleDownloadTrimmed = () => {
    if (trimResult) {
      const downloadUrl = audioAPI.downloadAudio(trimResult.audio_filename);
      window.open(downloadUrl, '_blank');
    }
  };

  const handleCleanAudio = async () => {
    if (!audioFile) {
      setError('Please select an audio file to clean');
      return;
    }

    setCleaning(true);
    setError(null);
    setCleanResult(null);

    try {
      const options = {
        ...cleanOptions,
        outputName: cleanOptions.outputName || `cleaned_${audioFile.name}`
      };

      const response = await audioAPI.cleanAudio(audioFile, options);
      setCleanResult(response);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to clean audio');
    } finally {
      setCleaning(false);
    }
  };

  const handleDownloadCleaned = () => {
    if (cleanResult) {
      const downloadUrl = audioAPI.downloadAudio(cleanResult.output_filename);
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Scissors className="w-5 h-5 text-amber-500" />
          Audio Editor
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Trim audio files for use in video generation
        </p>
      </div>

      <div className="space-y-6">
        {/* Audio Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Audio File</label>
          <input
            type="file"
            accept=".mp3,.wav,.ogg,.m4a"
            onChange={handleAudioChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
          />
        </div>

        {/* Audio Info */}
        {audioInfo && (
          <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-900/10 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="w-4 h-4 text-amber-500" />
              Audio Information
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Duration:</span>{' '}
                {formatTime(audioInfo.duration)}
              </div>
              <div>
                <span className="text-muted-foreground">Format:</span>{' '}
                {audioInfo.format}
              </div>
              <div>
                <span className="text-muted-foreground">Sample Rate:</span>{' '}
                {audioInfo.sample_rate} Hz
              </div>
              <div>
                <span className="text-muted-foreground">Channels:</span>{' '}
                {audioInfo.channels}
              </div>
            </div>
          </div>
        )}

        {/* Waveform Display */}
        {audioFile && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Waveform</label>
              <div
                ref={waveformRef}
                className="relative overflow-hidden rounded-2xl border border-border bg-secondary/50"
              />
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
              <Button
                onClick={togglePlayPause}
                disabled={loading}
                variant="outline"
                size="icon"
              >
                {playing ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <Button
                onClick={stopPlayback}
                disabled={loading}
                variant="outline"
                size="icon"
              >
                <Square className="w-4 h-4" />
              </Button>
              <div className="flex-1 text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              <Button
                onClick={createRegion}
                disabled={loading}
                variant="secondary"
                size="sm"
              >
                Select Region
              </Button>
            </div>

            {/* Region Info */}
            {selectedRegion && (
              <div className="space-y-4 rounded-2xl border border-amber-500/20 bg-amber-900/10 p-4">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-amber-200">Selected Region</p>
                  <p className="text-xs text-amber-200/70">
                    Drag handles on the waveform or type exact times below.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-amber-200/70">
                      Start
                    </label>
                    <input
                      value={timeInputs.start}
                      onChange={(e) => handleTimeInputChange('start', e.target.value)}
                      placeholder="0:00"
                      className="w-full rounded-lg border border-amber-500/20 bg-amber-900/20 px-3 py-2 text-sm font-mono focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                    <p className="text-xs text-amber-200/60">{formatTime(selectedRegion.start)}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-amber-200/70">
                      End
                    </label>
                    <input
                      value={timeInputs.end}
                      onChange={(e) => handleTimeInputChange('end', e.target.value)}
                      placeholder="0:15"
                      className="w-full rounded-lg border border-amber-500/20 bg-amber-900/20 px-3 py-2 text-sm font-mono focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                    <p className="text-xs text-amber-200/60">{formatTime(selectedRegion.end)}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-amber-200/70">
                      Duration
                    </label>
                    <div className="rounded-lg border border-amber-500/20 bg-amber-900/20 px-3 py-2 text-sm font-mono">
                      {formatTime(selectedRegion.end - selectedRegion.start)}
                    </div>
                    <Button
                      onClick={applyManualTimes}
                      size="sm"
                      variant="outline"
                      className="w-full border-amber-500/30 text-amber-200 hover:bg-amber-900/30"
                    >
                      Apply Times
                    </Button>
                  </div>
                </div>
                {timeInputError && (
                  <p className="text-xs font-medium text-red-400">{timeInputError}</p>
                )}
              </div>
            )}

            {/* Trim Button */}
            <Button
              onClick={handleTrim}
              disabled={!selectedRegion || trimming}
              className="w-full"
              size="lg"
            >
              {trimming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Trimming...
                </>
              ) : (
                <>
                  <Scissors className="mr-2 h-4 w-4" />
                  Trim Audio
                </>
              )}
            </Button>

            {/* Audio Cleaning Section */}
            <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold">Audio Cleaning</p>
                  <p className="text-xs text-muted-foreground">
                    Remove background noise and enhance voice quality for mosque recordings
                  </p>
                </div>
                <Button
                  onClick={() => setShowCleanOptions(!showCleanOptions)}
                  variant="ghost"
                  size="sm"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>

              {showCleanOptions && (
                <div className="space-y-3 border-t border-primary/10 pt-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={cleanOptions.noiseReduction}
                        onChange={(e) => setCleanOptions(prev => ({ ...prev, noiseReduction: e.target.checked }))}
                        className="rounded"
                      />
                      Noise Reduction
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={cleanOptions.equalize}
                        onChange={(e) => setCleanOptions(prev => ({ ...prev, equalize: e.target.checked }))}
                        className="rounded"
                      />
                      Voice Equalization
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={cleanOptions.normalize}
                        onChange={(e) => setCleanOptions(prev => ({ ...prev, normalize: e.target.checked }))}
                        className="rounded"
                      />
                      Normalize Audio
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Noise Reduction Level</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={cleanOptions.noiseReductionLevel}
                          onChange={(e) => setCleanOptions(prev => ({ ...prev, noiseReductionLevel: parseFloat(e.target.value) }))}
                          className="flex-1"
                        />
                        <span className="text-xs font-mono w-10">{cleanOptions.noiseReductionLevel}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Output Filename</label>
                      <input
                        type="text"
                        value={cleanOptions.outputName}
                        onChange={(e) => setCleanOptions(prev => ({ ...prev, outputName: e.target.value }))}
                        placeholder="cleaned_audio.mp3"
                        className="w-full rounded border border-input bg-background px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleCleanAudio}
                disabled={!audioFile || cleaning}
                variant="golden"
                className="w-full"
                size="sm"
              >
                {cleaning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Clean Audio
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 rounded-md bg-red-900/20 text-red-100">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Trim Result */}
        {trimResult && (
          <div className="p-4 rounded-md bg-green-900/20 text-green-100 space-y-3">
            <div>
              <p className="text-sm font-medium">Audio Trimmed Successfully!</p>
              <p className="text-sm">
                {trimResult.audio_filename} ({formatFileSize(trimResult.audio_size)})
              </p>
            </div>
            <Button
              onClick={handleDownloadTrimmed}
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Trimmed Audio
            </Button>
          </div>
        )}

        {/* Clean Result */}
        {cleanResult && (
          <div className="p-4 rounded-md bg-amber-900/20 text-amber-100 space-y-3">
            <div>
              <p className="text-sm font-medium">Audio Cleaned Successfully!</p>
              <p className="text-sm">
                {cleanResult.output_filename} ({formatTime(cleanResult.audio_info.duration)})
              </p>
              <div className="text-xs text-amber-300/80 mt-2 space-y-0.5">
                <p>Noise Reduction: {cleanResult.processing_details.noise_reduction ? 'Applied' : 'Disabled'}</p>
                <p>Voice Equalization: {cleanResult.processing_details.equalize ? 'Applied' : 'Disabled'}</p>
                <p>Audio Normalization: {cleanResult.processing_details.normalize ? 'Applied' : 'Disabled'}</p>
              </div>
            </div>
            <Button
              onClick={handleDownloadCleaned}
              variant="outline"
              className="w-full border-amber-500/30 text-amber-200 hover:bg-amber-900/30"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Cleaned Audio
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default AudioEditor;
