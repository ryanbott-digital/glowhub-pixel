

## Apply Premium Glassmorphism to Media Library & Playlists

### Overview
Both pages currently use plain `Card` components with default styling. The Dashboard uses `glass glass-spotlight rounded-2xl` containers throughout. We'll apply the same treatment for visual consistency.

### Changes

**`src/pages/MediaLibrary.tsx`**
- **Page header area**: Wrap stats subtitle in the same tracking/uppercase style used on Dashboard
- **Drop zone**: Add `glass glass-spotlight rounded-2xl` classes, replace `border-dashed` with the frosted glass border style, add teal glow on drag-over
- **Media grid cards**: Replace plain `Card` with `div` using `glass glass-spotlight rounded-2xl` classes, matching the Dashboard stat cards' frosted look. Keep existing selection ring behavior
- **Empty state**: Wrap in `glass glass-spotlight rounded-2xl` container
- **Upload button area**: Style the bulk-action bar with `glass-strong rounded-xl` when in selection mode

**`src/pages/Playlists.tsx`**
- **Playlist sidebar cards**: Replace plain `Card` with `glass glass-spotlight rounded-2xl` styled divs. Selected state uses `ring-2 ring-primary` (already exists), unselected gets the glass hover glow
- **Empty "Select a playlist" placeholder**: Wrap in `glass glass-spotlight rounded-2xl` container
- **Empty "No playlists yet" state**: Style with glass container
- **Create Playlist dialog**: Add `glass-strong` class to `DialogContent`

**`src/components/playlists/PlaylistBuilder.tsx`**
- **Main card wrapper**: Replace `Card` with `glass glass-spotlight rounded-2xl` container
- **Timeline track background**: Update from `bg-muted/50 border border-border` to frosted glass style
- **Add media button section**: Subtle glass background strip
- **Lightbox dialog**: Add `glass-strong` to `DialogContent`

### Technical Details
- All glass classes (`glass`, `glass-strong`, `glass-spotlight`) are already defined in `src/index.css`
- The spotlight cursor effect from `DashboardLayout.tsx` (mousemove handler setting `--mouse-x`/`--mouse-y`) already runs globally on all `.glass-spotlight` elements, so no additional JS needed
- Replace `Card`/`CardContent` imports with plain divs where the glass classes provide the container styling, or keep Card but override its classes

