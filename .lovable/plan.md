

# Send Multiple Media Items to Screen as Quick Playlist

## Overview

Currently, "Send to Screen" only sends the first selected media item by setting `current_media_id` on the screen — which is actually only used for status display, not playback. To send multiple items, we need to create a temporary playlist and assign it to the screen via `current_playlist_id`.

## Implementation

### File: `src/pages/MediaLibrary.tsx`

**Replace the `sendToScreen` function** with logic that:

1. **Single item selected**: Create a quick playlist with just that one item, assign to screen (consistent behavior)
2. **Multiple items selected**: Create a playlist named e.g. `"Quick Send · {timestamp}"`, insert all selected media as `playlist_items` with sequential positions, then update the screen's `current_playlist_id`

```text
sendToScreen(screenId)
├── Create playlist: "Quick Send · Apr 9, 12:34 PM"
│   └── user_id, title
├── Insert playlist_items (one per selected media, ordered)
│   └── playlist_id, media_id, position
├── Update screen: current_playlist_id = new playlist ID
└── Toast: "Sent 5 items to Living Room"
```

**Detailed changes:**
- Make `sendToScreen` async, create a playlist via `supabase.from("playlists").insert(...)` 
- Batch-insert playlist items for all selected media IDs with position index
- Update screen's `current_playlist_id` instead of `current_media_id`
- Update toast message to show item count (e.g. "Sent 3 items to Living Room")
- Update the "Send to Screen" button label to show count: `Send {n} to Screen`

### No database changes needed

The `playlists` and `playlist_items` tables already exist with appropriate RLS policies. The screen's `current_playlist_id` column is already used by the player for playback.

### Single file changed

`src/pages/MediaLibrary.tsx` — ~20 lines modified in the `sendToScreen` function.

