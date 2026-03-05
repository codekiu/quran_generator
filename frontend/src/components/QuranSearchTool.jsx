import React, { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, Copy, Info, Loader2, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/Card";
import Button from "./ui/Button";
import quranChapters from "@/data/quranChapters";
import { getChapterVerses } from "@/services/quran";
import usePersistentState from "@/hooks/usePersistentState";

const clampNumber = (value, min, max) => {
  const numeric = Number(value) || min;
  if (Number.isNaN(numeric)) {
    return min;
  }
  return Math.max(min, Math.min(numeric, max));
};

const STORAGE_PREFIX = "quran-search";
const buildStorageKey = (suffix) => `${STORAGE_PREFIX}:${suffix}`;

const QuranSearchTool = () => {
  const [selectedChapter, setSelectedChapter] = usePersistentState(
    buildStorageKey("selectedChapter"),
    1,
  );
  const [startVerse, setStartVerse] = usePersistentState(
    buildStorageKey("startVerse"),
    1,
  );
  const [endVerse, setEndVerse] = usePersistentState(
    buildStorageKey("endVerse"),
    3,
  );
  const [results, setResults] = usePersistentState(
    buildStorageKey("results"),
    () => [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [jsonPayload, setJsonPayload] = usePersistentState(
    buildStorageKey("jsonPayload"),
    "",
  );
  const [jsonCopied, setJsonCopied] = useState(false);

  const selectedChapterMeta = useMemo(
    () =>
      quranChapters.find(
        (chapter) => chapter.number === Number(selectedChapter),
      ),
    [selectedChapter],
  );

  useEffect(() => {
    if (!selectedChapterMeta) {
      return;
    }
    setStartVerse((prev) =>
      clampNumber(prev, 1, selectedChapterMeta.totalVerses),
    );
    setEndVerse((prev) =>
      clampNumber(prev, 1, selectedChapterMeta.totalVerses),
    );
  }, [selectedChapterMeta]);

  const handleFetchVerses = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    setJsonPayload("");

    try {
      const allVerses = await getChapterVerses(selectedChapter);
      if (!allVerses?.length) {
        setError("No verses found for this chapter.");
        return;
      }

      const normalizedStart = clampNumber(startVerse, 1, allVerses.length);
      const normalizedEnd = clampNumber(
        endVerse,
        normalizedStart,
        allVerses.length,
      );
      const startIndex = normalizedStart - 1;
      const endIndex = normalizedEnd - 1;
      const limited = allVerses.slice(startIndex, endIndex + 1);

      if (!limited.length) {
        setError("Unable to find verses with the current range.");
        return;
      }

      setResults(limited);
    } catch (err) {
      setError(err.message || "Failed to fetch Quran verses.");
    } finally {
      setLoading(false);
    }
  };

  const buildSurahReference = () => {
    if (!selectedChapterMeta || !results.length) {
      return "";
    }

    const start = results[0].verse;
    const end = results[results.length - 1].verse;
    const versesLabel =
      start === end ? `Ayah ${start}` : `Ayat ${start}-${end}`;
    return `${selectedChapterMeta.englishName} · ${versesLabel}`;
  };

  const generateJsonTemplate = () => {
    if (!results.length) {
      setError("Fetch verses before generating the JSON template.");
      return;
    }

    const payload = {
      surah_reference: buildSurahReference(),
      subtitles: results.map((verse) => ({
        verse: verse.verse,
        arabic_text: verse.text,
        start_time: "",
        end_time: "",
        spanish_text: verse.spanishText || "",
      })),
    };

    setJsonPayload(JSON.stringify(payload, null, 2));
    setJsonCopied(false);
  };

  const handleCopyJson = async () => {
    if (!jsonPayload) {
      generateJsonTemplate();
    }

    try {
      await navigator.clipboard.writeText(jsonPayload || "");
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2000);
    } catch (err) {
      setError("Unable to copy the JSON template. Please copy manually.");
      console.error("[QuranSearchTool] JSON copy failed:", err);
    }
  };

  const handleCopyVerses = async () => {
    if (!results.length) {
      return;
    }
    const textBlob = results
      .map((verse) => `${selectedChapter}:${verse.verse} — ${verse.text}`)
      .join("\n");

    try {
      await navigator.clipboard.writeText(textBlob);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError("Unable to copy to clipboard. Please copy manually.");
      console.error("[QuranSearchTool] Copy failed:", err);
    }
  };

  const handleChapterChange = (event) => {
    setSelectedChapter(Number(event.target.value));
  };

  const handleStartVerseChange = (event) => {
    const value = clampNumber(
      event.target.value,
      1,
      selectedChapterMeta?.totalVerses || Number(event.target.value) || 1,
    );
    setStartVerse(value);
  };

  const handleEndVerseChange = (event) => {
    const maxVerses =
      selectedChapterMeta?.totalVerses || Number(event.target.value) || 1;
    const value = clampNumber(event.target.value, startVerse, maxVerses);
    setEndVerse(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpenCheck className="w-6 h-6" />
          Quran Verse Finder
        </CardTitle>
        <CardDescription>
          Select any chapter (surah), choose a starting verse and how many
          verses you want to preview.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Chapter</label>
            <select
              value={selectedChapter}
              onChange={handleChapterChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {quranChapters.map((chapter) => (
                <option key={chapter.number} value={chapter.number}>
                  {chapter.number}. {chapter.englishName} ({chapter.arabicName})
                </option>
              ))}
            </select>
            {selectedChapterMeta && (
              <p className="text-xs text-muted-foreground">
                Contains {selectedChapterMeta.totalVerses} verses
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Starting Verse</label>
            <input
              type="number"
              min={1}
              max={selectedChapterMeta?.totalVerses}
              value={startVerse}
              onChange={handleStartVerseChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Ending Verse</label>
            <input
              type="number"
              min={startVerse}
              max={selectedChapterMeta?.totalVerses}
              value={endVerse}
              onChange={handleEndVerseChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <Button
          onClick={handleFetchVerses}
          disabled={loading}
          className="w-full md:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading verses...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Fetch Arabic Verses
            </>
          )}
        </Button>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing verses {results[0].verse}–
                {results[results.length - 1].verse} from Surah{" "}
                {selectedChapterMeta?.englishName}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyVerses}
                className="justify-start md:justify-center"
              >
                <Copy className="mr-2 h-4 w-4" />
                {copied ? "Copied!" : "Copy results"}
              </Button>
            </div>
            <div className="divide-y rounded-lg border">
              {results.map((verse) => (
                <div
                  key={`${selectedChapter}-${verse.verse}`}
                  className="space-y-2 p-4"
                >
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Ayah {verse.verse}
                  </div>
                  <p className="text-right text-xl font-semibold leading-relaxed">
                    {verse.text}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-2 rounded-lg border border-dashed p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p className="text-sm font-medium">
                  Need a subtitles JSON template?
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateJsonTemplate}
                  >
                    Generate JSON Template
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCopyJson}
                    disabled={!jsonPayload}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {jsonCopied ? "JSON Copied!" : "Copy JSON"}
                  </Button>
                </div>
              </div>
              {jsonPayload && (
                <pre className="max-h-80 overflow-auto rounded-md bg-slate-950/5 p-3 text-xs font-mono whitespace-pre-wrap">
                  {jsonPayload}
                </pre>
              )}
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>
            Use this helper to grab the authentic Arabic (Uthmani) text and
            Spanish translation, then paste it into your subtitles JSON. You
            will still need to provide timings when generating videos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuranSearchTool;
