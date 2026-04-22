

## What's broken

The player is stuck on the first image of a 4-item playlist (60s image → 122s video → 60s image → 30s video), confirmed against the live data. The root cause is **state churn from heartbeat / realtime echoes that resets the image-duration timer before it ever fires**.

Sequence:
1. New playlist arrives → `items` set, image at index 0 starts.
2. Image-timer effect schedules `setTimeout(advanceToNext, 60_000)`.
3. ~Every heartbeat (and every screen-row realtime echo of it) the screens UPDATE handler unconditionally calls `setSyncLayout(updated.sync_layout)`. JSONB always arrives as a new object reference, so the state actually changes → re-render.
4. That re-render does **not** reset the image timer by itself, BUT the heartbeat effect at line 1374 depends on `[currentIndex, items]` and `items` reference can churn from `setItems` calls happening elsewhere (cold-start path, sync-group fetch, etc.), which fires the heartbeat ping again, which echoes back, which triggers `setItems` indirectly through `playlist_items` realtime if any write touches that table.
5. Net effect: the image timer is being torn down and restarted (sometimes) before 60s elapses. With a video at index 1 buffering 122s, the same churn affects the `onEnded`-driven advance because the buffer can get reloaded mid-play.

## Fix (Player.tsx only)

### 1. Make the image-advance timer deadline-based, not restart-based
Replace the current image timer (line 1597–1612) with a deadline approach:
- When `currentIndex` changes to an image item, store `imageDeadlineRef.current = Date.now() + duration` and `imageItemKeyRef.current = item.id`.
- The `setTimeout` is scheduled for `deadline - Date.now()`.
- On effect cleanup, **only** clear the timer; do NOT reset the deadline.
- On effect re-run, if `imageItemKeyRef.current === item.id` AND `imageDeadlineRef.current` is in the future, schedule the timer for the **remaining** time, not a fresh full duration. If the deadline already passed, fire `advanceToNext` immediately.

Result: heartbeat / realtime / sync_layout re-renders cannot extend an image's lifetime.

### 2. Stop the realtime echo from setting state with unchanged values
In the screens UPDATE handler (lines 1308–1319), wrap each setState in an "only if changed" guard using refs that hold the last-applied value. Specifically:
- `setSyncLayout` only when JSON.stringify(sync_layout) differs from last applied.
- All other primitive setters (`setTransitionType`, `setCrossfadeDuration`, `setLoopEnabled`, `setDisplayMode`, `setFitBgColor`, `setAudioEnabled`, `setAudioStationUrl`, `setAudioStationName`, `setAudioVolume`, `setAudioMuteOnHype`) only when the new value differs from current state.

This eliminates the renders that re-trigger the playback effects.

### 3. Stop the heartbeat effect from churning on `items` reference changes
Change the heartbeat effect (line 1374) deps from `[screenId, paired, currentIndex, items]` to `[screenId, paired]` and read `items[currentIndex]` from refs (`itemsRef`, `currentIndexRef`) inside `ping()`. Add a `itemsRef = useRef(items)` synced via a tiny effect. The heartbeat fires every 60s on a stable interval — it does NOT restart on every `items` reference change (which currently re-pings immediately each time, polluting the echo bus).

### 4. Belt-and-braces: video advance via `timeupdate` watchdog
Videos already advance via `onEnded`. Add a small watchdog: if a video's `currentTime` is within 250ms of `duration` for two consecutive `timeupdate` events and no advance has happened, call `advanceToNext()`. This protects against `onEnded` not firing on Fire TV/HLS edge cases (a known issue with hls.js on some streams).

## What the user sees after deploy

- Friday Fund image plays for exactly 60s → crossfades to the 122s video → plays to completion → crossfades to Food Allergy image (60s) → Flower Lounge video (30s) → loops back to Friday Fund.
- Heartbeat pings continue every 60s in the background with zero visible effect.
- Sending a different playlist still crossfades in seamlessly (the recently-shipped buffer-handover path is unchanged).

## Out of scope

- No DB / RLS / edge function changes.
- No splash, branding, or APK changes.
- No new dependencies.

