

## Fix Studio Template Rendering Quality

### Problem
Templates look broken when loaded into Studio because of several rendering bugs in the text element system. The Café Menu screenshot shows overlapping text, no line breaks, wrong alignment, and content that doesn't match the template design.

### Root Causes

1. **No newline support** — Text content with `\n` characters (used in every menu template for multi-line items) renders as a single line. The text element at line 678 renders `{el.content}` as plain text without `whiteSpace: "pre-wrap"`.

2. **Wrong vertical alignment** — All text uses `flex items-center justify-center`, which vertically centers everything. Menu items, price lists, and descriptions should be top-aligned (`items-start`).

3. **Hardcoded `text-sm`** — The text element has `text-sm` (14px) hardcoded on the container, which overrides the template's intended `fontSize` from the style prop (e.g. 56px for headings, 24px for menu items).

4. **Missing `textAlign` support** — Templates set `textAlign: "center"` in the style but the flex centering overrides visual text alignment.

5. **Google Fonts race condition** — Template fonts (Playfair Display, Bebas Neue, DM Sans, etc.) are loaded dynamically when elements render. At 50% zoom with many elements, fonts may not load before the user sees the canvas.

### Plan

**1. Fix text element rendering** (`src/pages/Studio.tsx`, ~line 677-680)
- Add `whiteSpace: "pre-wrap"` to support `\n` line breaks
- Remove hardcoded `text-sm` class so template fontSize takes effect
- Change default alignment from `items-center justify-center` to `items-start justify-start` (top-left aligned)
- Respect the element's `textAlign` style property for horizontal alignment

**2. Preload template fonts** (`src/components/studio/StudioTemplateGallery.tsx`)
- When a template is applied via `handleApply`, iterate over its elements and call `loadGoogleFont()` for each unique `fontFamily` before passing elements to `onApply`
- Export the `loadGoogleFont` function from Studio or move it to a shared util

**3. Improve the MiniCanvasPreview** in the template gallery
- The tiny preview thumbnails should also render text with `pre-wrap` so users can see what they're getting before applying

**4. Template coordinate audit** (optional, second pass)
- Review template element positions and sizes to ensure they fit within the 960x540 canvas at 100% zoom
- The Café Menu has elements going to y:880 which is beyond the 540px canvas height — needs repositioning

### Files to Edit
- `src/pages/Studio.tsx` — Fix text rendering in `renderElementContent` (~5 lines changed)
- `src/components/studio/StudioTemplateGallery.tsx` — Preload fonts on apply, fix mini preview text, audit template coordinates to fit 960x540 canvas
- Potentially refactor `loadGoogleFont` to a shared location

### Impact
These fixes will make every template render correctly with proper typography, line breaks, and alignment — making the Studio feel like the high-end creative tool it's meant to be.

