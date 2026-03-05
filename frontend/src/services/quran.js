const SURAH_BASE_URL = '/api/quran/surah';

const chapterCache = new Map();

const padChapterNumber = (chapterNumber) => String(chapterNumber).padStart(3, '0');

const normalizeChapterPayload = (chapterNumber, payload) => {
  const verseEntries = Object.entries(payload?.verse || {});
  const translationEntries = payload?.translation || {};

  return verseEntries
    .map(([key, text]) => {
      const verse = Number(key.replace('verse_', ''));
      if (!verse || !text) {
        return null;
      }

      const translationKey = `verse_${verse}`;
      const spanish = translationEntries[translationKey] || '';

      return {
        chapter: chapterNumber,
        verse,
        text: text.trim(),
        spanishText: spanish.trim(),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.verse - b.verse);
};

const fetchChapterData = async (chapterNumber) => {
  const response = await fetch(`${SURAH_BASE_URL}/${padChapterNumber(chapterNumber)}`, {
    headers: {
      'Cache-Control': 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error('Unable to download Quran text. Please try again later.');
  }

  return response.json();
};

export const getChapterVerses = async (chapterNumber) => {
  if (chapterCache.has(chapterNumber)) {
    return chapterCache.get(chapterNumber);
  }

  const payload = await fetchChapterData(chapterNumber);
  const verses = normalizeChapterPayload(Number(chapterNumber), payload);

  if (!verses.length) {
    throw new Error('Unexpected Quran surah format.');
  }

  chapterCache.set(chapterNumber, verses);
  return verses;
};
