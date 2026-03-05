# Arabic Text Rendering Solutions

## Current Issue
Only diacritics (harakat) are showing, not the Arabic letters themselves.

## Root Cause
The `test.ttf` font file doesn't contain Arabic letter glyphs - only diacritics.

## Solutions

### Solution 1: Use Proper Quran Font (RECOMMENDED)
Use the `UthmanicHafs.otf` font that's already in your project.

**Advantages:**
- Authentic Quran typography
- Contains all Arabic glyphs and diacritics
- Works with current arabic_reshaper approach

**Implementation:**
Change font path from `./backend/fonts/test.ttf` to `./backend/fonts/UthmanicHafs.otf`

### Solution 2: Modern Pillow with libraqm (Advanced)
Use Pillow's built-in libraqm support for complex text layout.

**Advantages:**
- No need for arabic_reshaper or python-bidi
- Native support for RTL and complex scripts
- More accurate text shaping

**Requirements:**
- Install system libraries: `brew install fribidi harfbuzz`
- Pillow will automatically use libraqm if available

**Implementation:**
```python
# No reshaping needed!
draw.text(
    (x, y),
    arabic_text,  # Original text, no reshaping
    font=font,
    fill=color,
    direction='rtl',  # Right-to-left
    language='ar'     # Arabic
)
```

**Current Status:**
- libraqm: Not available
- fribidi: Not available

## Recommended Action
**Use Solution 1** - Simply switch to UthmanicHafs.otf font.
