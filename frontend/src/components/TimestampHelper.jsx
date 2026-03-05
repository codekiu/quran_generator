import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Copy, Play, Pause, Square, Rewind, FastForward, Upload, Check } from 'lucide-react';
import { formatTime } from '@/lib/utils';

const TimestampHelper = ({ audioFile, onAudioFileChange }) => {
  const audioElementRef = useRef(null);
  const progressBarRef = useRef(null);
  const fileInputRef = useRef(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [copiedTimestamp, setCopiedTimestamp] = useState(false);
  const [audioHelperError, setAudioHelperError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!audioFile) {
      setAudioPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(audioFile);
    setAudioPreviewUrl(url);
    setAudioHelperError(null);
    setIsAudioPlaying(false);
    setCopiedTimestamp(false);
    setAudioCurrentTime(0);
    setAudioDuration(0);
    return () => URL.revokeObjectURL(url);
  }, [audioFile]);

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) onAudioFileChange(file);
  };

  const toggleAudioPlayback = () => {
    if (!audioElementRef.current) return;
    if (audioElementRef.current.paused) {
      audioElementRef.current.play();
    } else {
      audioElementRef.current.pause();
    }
  };

  const stopAudioPlayback = () => {
    if (!audioElementRef.current) return;
    audioElementRef.current.pause();
    audioElementRef.current.currentTime = 0;
    setIsAudioPlaying(false);
    setAudioCurrentTime(0);
  };

  const seekAudio = (deltaSeconds) => {
    if (!audioElementRef.current) return;
    const audioNode = audioElementRef.current;
    const durationLimit = Number.isFinite(audioNode.duration) ? audioNode.duration : Infinity;
    const nextTime = Math.min(Math.max(audioNode.currentTime + deltaSeconds, 0), durationLimit);
    audioNode.currentTime = nextTime;
  };

  const seekToPosition = useCallback((clientX) => {
    if (!progressBarRef.current || !audioElementRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const duration = audioElementRef.current.duration;
    if (Number.isFinite(duration)) {
      audioElementRef.current.currentTime = ratio * duration;
    }
  }, []);

  const handleProgressMouseDown = (e) => {
    setIsDragging(true);
    seekToPosition(e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => seekToPosition(e.clientX);
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, seekToPosition]);

  const handleCopyCurrentTimestamp = async () => {
    if (!audioElementRef.current) return;
    try {
      const seconds = audioElementRef.current.currentTime || 0;
      await navigator.clipboard.writeText(seconds.toFixed(3));
      setCopiedTimestamp(true);
      setAudioHelperError(null);
      setTimeout(() => setCopiedTimestamp(false), 1500);
    } catch {
      setAudioHelperError('Unable to copy timestamp.');
    }
  };

  const progress = audioDuration > 0 ? (audioCurrentTime / audioDuration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Hidden audio element */}
      {audioPreviewUrl && (
        <audio
          ref={audioElementRef}
          src={audioPreviewUrl}
          onPlay={() => setIsAudioPlaying(true)}
          onPause={() => setIsAudioPlaying(false)}
          onEnded={() => setIsAudioPlaying(false)}
          onTimeUpdate={(e) => setAudioCurrentTime(e.target.currentTime)}
          onLoadedMetadata={(e) => setAudioDuration(e.target.duration || 0)}
        />
      )}

      {/* Progress bar — sits on top edge of the bar */}
      {audioFile && (
        <div
          ref={progressBarRef}
          className="group h-1.5 cursor-pointer bg-white/5 transition-all hover:h-2.5"
          onMouseDown={handleProgressMouseDown}
        >
          <div
            className="relative h-full bg-amber-500 transition-[width] ease-linear"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 translate-x-1/2 rounded-full bg-amber-400 opacity-0 shadow-lg shadow-amber-500/50 transition-opacity group-hover:opacity-100" />
          </div>
        </div>
      )}

      {/* Transport bar */}
      <div className="border-t border-white/[0.08] bg-card/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-8xl items-center gap-3 px-4 sm:px-6">

          {/* File upload trigger */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.ogg,.m4a"
            onChange={handleAudioChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 text-xs text-white/60 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white/80"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{audioFile ? audioFile.name : 'Audio'}</span>
          </button>

          {/* Transport controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => seekAudio(-5)}
              disabled={!audioFile}
              className="flex h-8 w-8 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
              title="-5s"
            >
              <Rewind className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={toggleAudioPlayback}
              disabled={!audioFile}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/90 text-white transition-all hover:bg-amber-400 hover:scale-105 disabled:opacity-30 disabled:hover:bg-amber-500/90 disabled:hover:scale-100"
            >
              {isAudioPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 translate-x-[1px]" />
              )}
            </button>
            <button
              type="button"
              onClick={stopAudioPlayback}
              disabled={!audioFile}
              className="flex h-8 w-8 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
              title="Stop"
            >
              <Square className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => seekAudio(5)}
              disabled={!audioFile}
              className="flex h-8 w-8 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
              title="+5s"
            >
              <FastForward className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Time display */}
          <div className="hidden min-w-0 items-center gap-1.5 font-mono text-xs sm:flex">
            <span className="text-white/90 tabular-nums">{formatTime(audioCurrentTime)}</span>
            <span className="text-white/30">/</span>
            <span className="text-white/40 tabular-nums">{audioDuration > 0 ? formatTime(audioDuration) : '--:--'}</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Seconds display (compact) */}
          <span className="hidden font-mono text-xs tabular-nums text-white/50 lg:inline">
            {audioCurrentTime.toFixed(3)}s
          </span>

          {/* Copy timestamp */}
          <button
            type="button"
            onClick={handleCopyCurrentTimestamp}
            disabled={!audioFile}
            className={`flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-all disabled:opacity-30 ${
              copiedTimestamp
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200'
            }`}
          >
            {copiedTimestamp ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Copy Time</span>
              </>
            )}
          </button>

          {/* Error indicator */}
          {audioHelperError && (
            <span className="text-xs text-red-400">{audioHelperError}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimestampHelper;
