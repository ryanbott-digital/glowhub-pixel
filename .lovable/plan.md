

## Plan: Optimize Player Route for TV Hardware

### What we're building
Three TV-specific optimizations for `/player/:pairingCode`:

1. **Fullscreen lock CSS** — hide scrollbars, force exact 100vw×100vh, no overflow
2. **Wake Lock API** — prevent screen dimming/sleep while player is active
3. **Offline overlay** — detect `offline`/`online` events, show subtle reconnecting indicator, keep last content playing

### Technical approach

**File: `src/pages/Player.tsx`**

**CSS changes:**
- Add global styles within the component: `html, body { overflow: hidden; margin: 0; padding: 0; }`, hide all scrollbars via `::-webkit-scrollbar { display: none }` and `scrollbar-width: none`
- Root container: `w-screen h-screen` with `overflow-hidden` (already close, just tighten)

**Wake Lock:**
- `useEffect` that calls `navigator.wakeLock.request('screen')` on mount and when tab becomes visible again (`visibilitychange`)
- Release on unmount; re-acquire on `visibilitychange` (browsers release wake lock when tab is hidden)
- Wrapped in try/catch for browsers that don't support it

**Offline detection:**
- `useState<boolean>` for `isOffline`, initialized from `!navigator.onLine`
- `useEffect` with `window.addEventListener('offline'/'online')` listeners
- When offline: show a small fixed overlay in bottom-right corner with "Reconnecting..." text and a pulsing dot — content continues playing from cache
- When back online: hide overlay, use `toast.success("Back online")` via sonner

All changes in a single file (`src/pages/Player.tsx`).

