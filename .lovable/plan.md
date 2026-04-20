

## Goal

When a media item is letterboxed on the player (Fit mode + portrait/odd aspect on a 16:9 TV), surface a one-click suggestion in the **Media Library** to use AI to extend the artwork to fill the full screen — so the user can keep "no cropping" while still removing the black bars.

## How it works

1. **Detect candidates** in `MediaLibrary.tsx`
   - On image load, read natural width/height and compute aspect ratio.
   - Flag any image whose aspect differs from 16:9 by more than ~10% (portrait posters, square art, ultra-wide banners) as a "fill candidate".
   - Persist the detected ratio into `media.aspect_ratio` (column already exists) so we don't recompute every visit.

2. **Surface the suggestion**
   - On flagged media cards, show a subtle pill in the corner: ✨ **"Fill the screen with AI"** (teal accent, glassmorphism, matches design system).
   - Tooltip: *"This image will letterbox on 16:9 screens. Let AI extend the background so it fills edge-to-edge."*

3. **AI Fill action**
   - Click opens a small modal: preview of original (letterboxed on a mock 16:9 frame) vs. the AI-filled version once generated.
   - Calls a new edge function `ai-fill-media` that:
     - Downloads the original from `signage-content` storage.
     - Sends it to **Lovable AI** using `google/gemini-2.5-flash-image` (Nano Banana) with a prompt: *"Extend this image outward to a 16:9 aspect ratio. Seamlessly continue the background, colours, and atmosphere of the original. Keep all original content centered and untouched."*
     - Uploads the returned image to storage as a sibling file (`<original>_ai-fill-16x9.png`).
     - Inserts a new row in `media` (same folder, name suffixed " (AI Fill 16:9)", `aspect_ratio = '16:9'`, `display_mode = 'fill'`).
   - Modal shows: **Use new version** (replaces references in playlists with the new media id, optional) or **Keep both**.

4. **Default the new asset**
   - The AI-filled copy is created with `display_mode = 'fill'` so it always edge-fills — user gets the no-cropping, no-letterbox win automatically.

## Technical changes

- **`supabase/functions/ai-fill-media/index.ts`** (new, `verify_jwt = true` — default): receives `{ media_id }`, validates ownership, calls Lovable AI image endpoint, uploads result, inserts new media row, returns new media id.
- **`src/pages/MediaLibrary.tsx`**:
  - Add `imageDimensions` state map keyed by media id.
  - On image card mount, compute aspect ratio (or read from `media.aspect_ratio`).
  - Render `AiFillSuggestionPill` on flagged cards.
  - New `AiFillModal` component (preview + Generate + Apply).
- **`src/components/media/AiFillSuggestionPill.tsx`** (new): teal glass pill with sparkle icon and tooltip.
- **`src/components/media/AiFillModal.tsx`** (new): side-by-side preview, generate button with progress, save/apply controls.
- **No DB migration needed** — `media.aspect_ratio` and `media.display_mode` already exist.

## What the user sees

- Open Media Library → portrait poster shows a ✨ "Fill with AI" chip.
- Click → modal previews the letterbox problem and offers AI extension.
- Generate → ~5–10s later, a new edge-to-edge 16:9 version appears in the same folder, ready to drop into playlists. Original kept intact.

