

## Hide Browser URL Bar on Android Tablets (Player Page)

### Problem
When loading `glow.pixelhub.org.uk` directly in Chrome on an Android tablet, the browser's URL bar and tabs remain visible, eating into the player's display area. This happens because Chrome only hides chrome in two situations:

1. The site is launched as an installed PWA (Add to Home Screen → opened from home screen icon).
2. The page programmatically enters Fullscreen API.

The manifest already declares `"display": "standalone"`, so the install path works — but loading the URL in a regular Chrome tab does NOT honor that. We need to actively request fullscreen on the player.

### Solution

**1. Auto-request Fullscreen on `/player` for touch devices**

In `src/pages/Player.tsx`, on mount, attempt `document.documentElement.requestFullscreen()` automatically when the page loads on a non-Capacitor Android device. Browsers require a user gesture, so we also wrap it in a one-time tap listener as a fallback ("tap anywhere to enter fullscreen"). The existing TV-optimization logic already does this for desktop — we extend it to cover Android Chrome.

**2. Show a subtle "Tap to enter fullscreen" hint**

If autoplay-fullscreen is blocked (it usually is in Chrome without a gesture), display a small dismissible Glow-styled toast/badge in the corner of the player with text like "Tap to go fullscreen". One tap anywhere triggers fullscreen + hides the hint. Once fullscreen, store a flag in `sessionStorage` so we don't keep nagging.

**3. Add an "Install as App" prompt to `/download` for Android**

Surface the existing PWA install prompt more aggressively on the `/download` page when accessed from Android Chrome — this is the cleanest long-term solution since installed PWAs always launch chromeless. Use the `beforeinstallprompt` event we already hook in `AdminInstallBanner` and add a similar player-focused banner.

**4. Lock viewport to remove address bar scroll behavior**

Add `<meta name="mobile-web-app-capable" content="yes">` and `<meta name="apple-mobile-web-app-capable" content="yes">` to `index.html`. These reinforce standalone behavior when the page IS launched from the home screen, and signal the browser to minimize chrome where supported.

### Files to Edit
- `src/pages/Player.tsx` — auto-fullscreen request + tap-to-fullscreen hint
- `index.html` — add mobile-web-app-capable meta tags
- `src/components/AdminInstallBanner.tsx` (or new `PlayerInstallBanner.tsx`) — install prompt on `/download` for player devices

### Why this approach
The URL bar can ONLY be hidden by either (a) installing as a PWA, or (b) Fullscreen API after a user gesture. There is no CSS or meta tag that will remove Chrome's address bar on a regular browser tab — that's a browser security restriction. The combination of auto-fullscreen +