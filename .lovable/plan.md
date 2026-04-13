

## Plan: Auto-compress oversized uploads

When a user uploads a file exceeding 50MB, instead of rejecting it, show a dialog offering to compress it client-side before uploading.

### How it works

1. **Image compression** — Use the browser Canvas API to resize and re-encode images (JPEG quality reduction, dimension capping at ~4000px). No new dependencies needed.

2. **Video compression** — Videos can't be reliably compressed client-side in most browsers. For videos over 50MB, show a toast suggesting the user compress externally (e.g., HandBrake) or offer to upload anyway if we raise/remove the limit for Mux-transcoded videos (since Mux handles re-encoding).

3. **Compression dialog** — When oversized files are detected during upload, show a confirmation dialog listing the files and their sizes, with options:
   - "Compress & Upload" (for images)
   - "Cancel"
   - For videos: explain that video compression isn't available in-browser, suggest external tools

### File changes

**`src/pages/MediaLibrary.tsx`**
- Modify `uploadFiles` to separate oversized files instead of rejecting them
- Add a compression confirmation dialog with file list
- Add `compressImage()` helper using Canvas API (resize + quality reduction)
- For oversized videos: offer to upload anyway (Mux will transcode) or skip
- Update the 50MB messaging in the drop zone to say "Images auto-compressed if needed"

### Technical details

- `compressImage`: Creates an offscreen canvas, draws the image scaled down (max 4000x4000), exports as JPEG at 0.8 quality. Targets under 50MB.
- No external libraries needed — pure browser APIs (`createImageBitmap`, `HTMLCanvasElement.toBlob`)
- Videos over 50MB: since Mux transcodes anyway, we can allow larger video uploads (raise limit to 500MB for videos) or keep 50MB and suggest compression

