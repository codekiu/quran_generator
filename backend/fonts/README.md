# Fonts Directory

## Required Font

Place the **KFGQPC Uthmanic Script HAFS** font file here:

```
UthmanicHafs.ttf
```

## Where to Get the Font

You can download the KFGQPC Uthmanic Script HAFS font from:

1. **Internet Archive**: Search for "KFGQPC Uthmanic Script HAFS"
2. **Islamic Font Websites**: Many Islamic resource websites provide this font
3. **GitHub**: Some repositories host this font for Quran applications

## Alternative Fonts

If you can't find the exact font, you can use any Arabic font that supports:
- Arabic script
- Tashkil (diacritical marks)
- Right-to-left (RTL) text

Some alternatives:
- `Amiri` (free, open-source)
- `Scheherazade` (free, SIL Open Font License)
- `Traditional Arabic`
- `Arial` (has Arabic support but not ideal for Quran)

## Configuration

If you use a different font:
1. Place the `.ttf` file in this directory
2. Update the `FONT_PATH` in `backend/.env`:
   ```
   FONT_PATH=./fonts/YourFontName.ttf
   ```

## Font Requirements

The font must:
- Support Unicode Arabic characters (U+0600 to U+06FF)
- Include tashkil/harakat marks
- Be in TrueType (.ttf) format
- Have proper character shaping support

## Testing the Font

Once you've added the font, test it using the `/api/test-arabic` endpoint:

```bash
curl -X POST http://localhost:5000/api/test-arabic \
  -H "Content-Type: application/json" \
  -d '{"arabic_text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "spanish_text": "En el nombre de Allah"}'
```

This will generate a test image at `/api/image/test_arabic_frame.png` that you can view to verify the font renders correctly.
