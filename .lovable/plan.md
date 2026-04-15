

## Rebuild Fire TV APK as Capacitor WebView Wrapper

### Problem
The current APK is built via PWABuilder, which opens in Amazon Silk browser — causing the URL bar to show and video autoplay to be blocked. A Capacitor-based APK uses its own embedded WebView, giving true fullscreen with no browser chrome.

### What's Already Done
- `capacitor.config.ts` exists with the correct `appId`, `appName`, and remote `server.url` pointing to the player page
- `@capacitor/core`, `@capacitor/cli`, and `@capacitor/android` are already installed
- The existing GitHub Actions workflow (`build-firetv.yml`) uses the PWABuilder approach

### Plan

**1. Update `capacitor.config.ts`**
- Point `server.url` to the published URL: `https://glowhub-pixel.lovable.app/player?forceHideBadge=true`
- Add Android-specific config for immersive fullscreen and landscape orientation
- Add `backgroundColor` to avoid white flash on boot

**2. Replace the GitHub Actions workflow** (`.github/workflows/build-firetv.yml`)
- Remove the PWABuilder/patch-firetv approach entirely
- New workflow:
  1. Checkout repo
  2. Set up Node 20, JDK 17, Android SDK
  3. `npm ci`
  4. `npx cap add android` (generates the `android/` folder fresh each build)
  5. Inject Fire TV leanback intent + 320×180 banner into `AndroidManifest.xml` via sed
  6. `cd android && ./gradlew assembleRelease`
  7. Upload APK artifact + commit to `public/GlowHub.apk`

**3. Update `src/lib/apk-version.ts`**
- Bump `APK_VERSION` to `3.0.0` to mark the Capacitor migration

**4. Update the Download page guidance**
- Change the sideloading guide text to reference the new Capacitor-based APK (no functional code changes needed, just copy updates mentioning it's now a native WebView wrapper)

### What This Fixes
- **No URL bar** — Capacitor uses an embedded Android WebView, not Silk
- **Autoplay works** — WebView doesn't have Silk's autoplay restrictions
- **True fullscreen** — immersive mode hides the system navigation bar
- **Launch on boot** — can still use the autostart plugin already in the codebase

### Files to Edit
- `capacitor.config.ts` — update server URL and add Android config
- `.github/workflows/build-firetv.yml` — replace with Capacitor build pipeline
- `src/lib/apk-version.ts` — bump to 3.0.0

### What You Need to Do After
Once implemented, you'll need to:
1. Export the repo to GitHub
2. Run the "Build Fire TV APK" workflow manually from the Actions tab
3. Download the built APK artifact and sideload it onto your Fire Stick

