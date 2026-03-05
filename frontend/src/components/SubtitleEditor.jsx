import React, { useState, useCallback, useMemo } from 'react';
import { Trash2, Plus } from 'lucide-react';
import Button from './ui/Button';
import usePersistentState from '@/hooks/usePersistentState';

const EMPTY_DATA = { surah_reference: '', subtitles: [] };

const EMPTY_SUBTITLE = {
  verse: 1,
  start_time: 0,
  end_time: 0,
  arabic_text: '',
  translated_text: '',
  show_verse_number: false,
};

const SubtitleEditor = ({ value, onChange }) => {
  const [mode, setMode] = usePersistentState('subtitle-editor:mode', 'visual');
  const [parseError, setParseError] = useState(null);

  const parsed = useMemo(() => {
    if (!value || !value.trim()) return EMPTY_DATA;
    try {
      const data = JSON.parse(value);
      if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
      return {
        surah_reference: data.surah_reference || '',
        subtitles: Array.isArray(data.subtitles)
          ? data.subtitles.map((s) => ({
              verse: s.verse ?? 1,
              start_time: s.start_time ?? 0,
              end_time: s.end_time ?? 0,
              arabic_text: s.arabic_text ?? '',
              translated_text: s.translated_text ?? '',
              show_verse_number: s.show_verse_number ?? false,
            }))
          : [],
      };
    } catch {
      return null;
    }
  }, [value]);

  const emitChange = useCallback(
    (data) => {
      onChange(JSON.stringify(data, null, 2));
    },
    [onChange],
  );

  const switchToVisual = () => {
    if (parsed === null) {
      setParseError('Cannot switch to Visual Editor: the current JSON is invalid.');
      return;
    }
    setParseError(null);
    setMode('visual');
  };

  const switchToJson = () => {
    setParseError(null);
    setMode('json');
  };

  const updateField = (index, field, val) => {
    if (!parsed) return;
    const updated = { ...parsed, subtitles: parsed.subtitles.map((s, i) => (i === index ? { ...s, [field]: val } : s)) };
    emitChange(updated);
  };

  const updateReference = (val) => {
    if (!parsed) return;
    emitChange({ ...parsed, surah_reference: val });
  };

  const addRow = () => {
    if (!parsed) return;
    const lastVerse = parsed.subtitles.length > 0 ? parsed.subtitles[parsed.subtitles.length - 1].verse : 0;
    const lastEnd = parsed.subtitles.length > 0 ? parsed.subtitles[parsed.subtitles.length - 1].end_time : 0;
    emitChange({
      ...parsed,
      subtitles: [
        ...parsed.subtitles,
        { ...EMPTY_SUBTITLE, verse: lastVerse + 1, start_time: lastEnd },
      ],
    });
  };

  const removeRow = (index) => {
    if (!parsed) return;
    emitChange({ ...parsed, subtitles: parsed.subtitles.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Subtitles</label>
        <div className="flex rounded-md border border-input overflow-hidden">
          <button
            type="button"
            onClick={switchToVisual}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              mode === 'visual'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-accent'
            }`}
          >
            Visual Editor
          </button>
          <button
            type="button"
            onClick={switchToJson}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              mode === 'json'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-accent'
            }`}
          >
            JSON
          </button>
        </div>
      </div>

      {parseError && (
        <div className="rounded-md border border-red-500/30 bg-red-950/30 p-2 text-xs text-red-100">
          {parseError}
        </div>
      )}

      {mode === 'json' ? (
        <>
          <textarea
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setParseError(null);
            }}
            placeholder='{"surah_reference": "Al-Baqarah · Ayat 1-3", "subtitles": [...]}'
            className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
          />
          <p className="text-xs text-muted-foreground">
            JSON object with surah_reference and subtitles array (verse, start_time, end_time, arabic_text, translated_text)
          </p>
        </>
      ) : (
        <div className="space-y-3 rounded-md border border-input bg-background p-3">
          {/* Surah reference */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Surah Reference</label>
            <input
              type="text"
              value={parsed?.surah_reference ?? ''}
              onChange={(e) => updateReference(e.target.value)}
              placeholder="e.g. Al-Baqarah · Ayat 1-3"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>

          {/* Subtitle rows */}
          {parsed?.subtitles?.length > 0 ? (
            <div className="space-y-3">
              {parsed.subtitles.map((sub, idx) => (
                <div
                  key={idx}
                  className="space-y-2 rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      #{idx + 1} — Verse {sub.verse}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="rounded p-1 text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors"
                      title="Remove row"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Arabic text */}
                  <textarea
                    dir="rtl"
                    lang="ar"
                    value={sub.arabic_text}
                    onChange={(e) => updateField(idx, 'arabic_text', e.target.value)}
                    placeholder="Arabic text"
                    rows={2}
                    className="font-arabic text-lg leading-relaxed w-full rounded-md border border-input bg-background px-3 py-2 text-right"
                  />

                  {/* Translation */}
                  <textarea
                    value={sub.translated_text}
                    onChange={(e) => updateField(idx, 'translated_text', e.target.value)}
                    placeholder="Translation"
                    rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />

                  {/* Time inputs + verse number checkbox */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-muted-foreground">Start:</label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={sub.start_time}
                        onChange={(e) => updateField(idx, 'start_time', parseFloat(e.target.value) || 0)}
                        className="h-8 w-24 rounded-md border border-input bg-background px-2 text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-muted-foreground">End:</label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={sub.end_time}
                        onChange={(e) => updateField(idx, 'end_time', parseFloat(e.target.value) || 0)}
                        className="h-8 w-24 rounded-md border border-input bg-background px-2 text-xs font-mono"
                      />
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sub.show_verse_number}
                        onChange={(e) => updateField(idx, 'show_verse_number', e.target.checked)}
                        className="rounded border-input"
                      />
                      Verse #
                    </label>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-2 text-center">
              No subtitles yet. Add a row to get started.
            </p>
          )}

          {/* Add row */}
          <Button variant="outline" size="sm" onClick={addRow} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Row
          </Button>
        </div>
      )}
    </div>
  );
};

export default SubtitleEditor;
