

# Add Confirmation Toast on Player Screen

## Change

When the Display/Player screen receives new content via the realtime subscription, show a brief toast notification confirming the update.

## Implementation

**File: `src/pages/Display.tsx`**

1. Import `toast` from `sonner` and `Toaster` from `sonner` (the player page runs standalone outside the dashboard layout, so it needs its own `<Toaster />`)
2. In the realtime callback (line ~89-94), after `fetchPlaylist(newPlaylistId)`, add: `toast("New content received", { description: "Updating display now…", duration: 3000 })`
3. Render `<Toaster position="bottom-right" theme="dark" />` inside the component's return JSX

Single file change, ~5 lines added.

