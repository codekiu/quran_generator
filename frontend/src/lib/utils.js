import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds = 0) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = Math.floor(safeSeconds % 60);

  const formattedMinutes = hours > 0 ? mins.toString().padStart(2, '0') : mins.toString();
  const formattedSeconds = secs.toString().padStart(2, '0');

  return hours > 0
    ? `${hours}:${formattedMinutes}:${formattedSeconds}`
    : `${mins}:${formattedSeconds}`;
}

export function parseTime(value) {
  if (typeof value === 'number') {
    return value >= 0 && Number.isFinite(value) ? value : null;
  }

  if (value == null) return null;

  const sanitized = String(value).trim();
  if (!sanitized) return null;

  const segments = sanitized.split(':');
  if (segments.length > 3) return null;

  const lastIndex = segments.length - 1;
  let totalSeconds = 0;

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i].trim();
    if (!segment) return null;

    const isLast = i === lastIndex;
    const numericValue = isLast ? parseFloat(segment) : parseInt(segment, 10);

    if (!Number.isFinite(numericValue) || Number.isNaN(numericValue)) {
      return null;
    }

    const multiplier = Math.pow(60, lastIndex - i);
    totalSeconds += numericValue * multiplier;
  }

  return totalSeconds >= 0 && Number.isFinite(totalSeconds) ? totalSeconds : null;
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
