

## Add "Sync All" Button for Out-of-Sync Screens

### What We're Building
A contextual "Sync All" button that appears in each sync group card when any screen's `current_playlist_id` doesn't match the group's assigned `playlist_id`. Clicking it pushes the group playlist to only the mismatched screens.

### Changes

**`src/pages/Canvas.tsx`** (single file edit)

1. **Add a helper function** to detect mismatched screens in a group:
   - Compare each screen's `current_playlist_id` against the group's `playlist_id`
   - Return the list of out-of-sync screen IDs

2. **Add `handleSyncMismatched` handler**:
   - Takes a sync group, filters to only screens where `current_playlist_id !== group.playlist_id`
   - Updates only those screens via `supabase.from("screens").update(...).in("id", mismatchedIds)`
   - Shows toast: "Synced X screen(s)"
   - Calls `fetchData()` to refresh

3. **Render a "Sync All" button** between the existing "Push to All" button and the mini-map section (~line 423):
   - Only visible when `group.playlist_id` is set AND at least one screen has a different `current_playlist_id`
   - Styled with a pulsing amber/warning glow to draw attention
   - Uses `RefreshCw` icon + "Sync All" label
   - Import `RefreshCw` from lucide (or reuse existing import)

4. **Add a subtle mismatch indicator** on individual screen cards within the group:
   - Small amber dot next to screens whose playlist doesn't match the group's assigned playlist
   - Tooltip: "Out of sync"

### Technical Details
- Data is already available: each `SyncGroup.screens[].screen` object has `current_playlist_id`, and the group has `playlist_id`
- No database changes needed — uses existing `screens` update + existing RLS policies
- Single file change, no new dependencies

