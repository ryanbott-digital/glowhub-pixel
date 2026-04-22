

## Goal

Make sending content to a screen feel **seamless** (Yodeck-style): no flash of the GlowHub logo over already-playing media, no buffer reload when the playlist refetches but hasn't actually changed.

## Root cause

In `src/pages/Player.tsx`:

1. **`bufferLoading` overlay (line 2296)** is a full-screen GH-loader card that paints over both buffers at `z-20`. It's set to `true` *every time* the LOAD ACTIVE BUFFER effect runs (line 1615), then auto-clears after 2s or when `onload`/`play()` resolves.
2. The LOAD effect (line 1605) depends on `[currentIndex, items, activeBuffer, volume, …]`. When realtime fires `fetchPlaylist` (lines 1465, 1300, etc.) and a new `items` array reference is set — even when the *content* is identical (same signature) — the effect re-runs, **re-assigns `img.src` / re-calls `video.load()`**, and flips `bufferLoading` on. That's the flash the user sees.
3. The pre-load effect (line 1477) also re-fires for the same reason, momentarily wiping the inactive buffer's cached frame.

Net effect: any DB write touching `screens` or `playlist_items` (heartbeat, settings tweak, send-to-screen creating its temporary playlist) triggers a visible glow-logo flash even though playback should continue uninterrupted.

## Fix

### 1. Don't reload buffers when the source URL hasn't changed
In the LOAD ACTIVE BUFFER effect (lines 1604–1647):
- Track the last-loaded URL per buffer in a ref (`lastLoadedUrlRef = { A: string, B: string }`).
- If `url === lastLoadedUrlRef.current[activeBuffer]` **and** the element already has a valid src/readyState, skip the reload entirely (no `setBufferLoading(true)`, no `img.src =`, no `video.load()`).
- Same guard for the pre-load effect (lines 1477–1492) using the inactive buffer.

### 2. Suppress the overlay when a buffer already has paint
- Only show the `bufferLoading` overlay on **cold start** (no item has ever rendered) — track `hasEverRenderedRef`. Once any media has successfully painted, never show the full-screen loader again; let the existing crossfade handle transitions, even if the next item is slow (it'll just hold the previous frame, which is exactly what Yodeck does).
- Keep the GH loader strictly for the very first paint and the pairing/boot flow.

### 3. Stop fetchPlaylist from churning items when nothing changed
`fetchPlaylist` (line 737) already computes `lastPlaylistSigRef`. Confirm that when `isSamePlaylist === true` **and** the signature matches, it returns **without** calling `setItems` (currently it calls `setItems(parsed)` unconditionally on line 758). Move `setItems` inside the "signature changed" branch so realtime no-op refetches don't replace the array reference.

### 4. Don't reset the active buffer / currentIndex on send-to-screen
When a brand-new playlist arrives (`current_playlist_id` actually changed