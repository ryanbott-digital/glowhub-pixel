

## Force-Refresh for Published Player Screens

### Problem
The `Display.tsx` page (used by published player screens at `/display/:screenId`) doesn't use the `useVersionCheck` hook, so it never auto-reloads when a new frontend deployment is published. The `Player.tsx` page already has this working.

### Plan

**1. Add `useVersionCheck` to `Display.tsx`**
- Import `useVersionCheck` from `@/hooks/use-version-check`
- Call `useVersionCheck(120_000)` (poll every 2 minutes) at the top of the `Display` component
- This uses the existing, proven mechanism that detects changed Vite bundle hashes and auto-reloads

**2. Clear service worker cache on reload (optional hardening)**
- The service worker already uses NetworkFirst for JS/CSS bundles, so new code will be fetched on reload — no SW changes needed.

### Technical Details
- The `useVersionCheck` hook fetches `/?_t=<timestamp>` with `cache: "no-store"`, extracts the Vite bundle hash from the HTML, and triggers `window.location.reload()` when it changes.
- A 2-minute interval is appropriate for unattended display screens — frequent enough to pick up updates quickly, lightweight enough to not cause issues.
- The toast notification ("Updating to latest version…") will briefly appear on the display screen before reload, which is acceptable for a ~2.5s window.

### Files to Edit
- `src/pages/Display.tsx` — add one import and one hook call (2 lines)

