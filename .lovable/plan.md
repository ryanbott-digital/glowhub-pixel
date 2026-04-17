

## Full Immersive Kiosk Mode for Android

### Current state (verified)
- `MainActivity.java` already sets `FLAG_FULLSCREEN` + `SYSTEM_UI_FLAG_IMMERSIVE_STICKY` — that's the native-side immersive flag set
- `AndroidManifest.xml` uses `@style/AppTheme.NoActionBarLaunch` → splash → `AppTheme.NoActionBar` (which already has `windowFullscreen`, `windowTranslucentStatus`, `windowTranslucentNavigation`)
- `capacitor.config.ts` already has `backgroundColor: '#0B1120'`
- **Missing**: Capacitor JS-side `StatusBar.hide()` / `NavigationBar.hide()` calls, and the CSS lockdown on `body`/`#root`

The native side is mostly correct — the gap is the **JS-side hide calls** (which Capacitor reapplies on every WebView resume — important on Samsung where the system can re-show bars after focus changes) and the **CSS overflow lockdown**.

### Implementation

**1. Install plugins**
- `@capacitor/status-bar` (official)
- `@capacitor-community/navigation-bar` (community — no official `@capacitor/navigation-bar` exists; this is the standard one)

**2. New file `src/lib/immersive-mode.ts`**
- Export `enableImmersiveMode()` that:
  - Guards with `isNativePlatform()` (skip in browser/preview)
  - Dynamically imports both plugins (Vite-safe pattern per `mem://tech/build-constraints`)
  - Calls `StatusBar.hide()`, `StatusBar.setOverlaysWebView({ overlay: true })`
  - Calls `NavigationBar.hide()`
  - Wraps in try/catch so a missing plugin never crashes the player
- Also re-applies on `App` resume + `visibilitychange` (Samsung re-shows bars after Recents)

**3. Wire into `src/pages/Player.tsx`**
- `useEffect` on mount → `enableImmersiveMode()`
- Add Capacitor `App.addListener('appStateChange', ...)` to re-hide on resume
- Player-only (not App.tsx root) so the dashboard/settings UI on PWA installs still gets browser chrome

**4. CSS lockdown in `src/index.css`**
- Add a `.kiosk-lockdown` class (applied to `<html>` via `document.documentElement.classList.add` inside `enableImmersiveMode`) that sets:
  - `html, body, #root { height: 100vh; width: 100vw; overflow: hidden; position: fixed; overscroll-behavior: none; }`
- Class-based (not global) so it only locks down on native — the web dashboard keeps normal scrolling

**5. Capacitor config**
- `capacitor.config.ts` already has `backgroundColor` ✅
- Add `StatusBar` plugin config block: `{ overlaysWebView: true, style: 'DARK', backgroundColor: '#0B1120' }`
- `bundledWebRuntime: false` is the Capacitor 2 default — Capacitor 6 (current) doesn't use this key, so skip it (would just be ignored)

**6. AndroidManifest.xml**
- Already correctly using `AppTheme.NoActionBar` which extends `Theme.AppCompat.DayNight.NoActionBar` with `windowFullscreen=true` ✅
- The user requested `@android:style/Theme.NoTitleBar.Fullscreen` — but that's a legacy non-AppCompat theme that breaks Capacitor's WebView. The current `AppTheme.NoActionBar` is the correct equivalent and already in place. **No change needed** here.

**7. Trigger native rebuild**
- After file changes, the GitHub Actions workflow will rebuild the APK on next push
- User downloads new APK from Artifacts → sideloads to Samsung

### Files touched
- `package.json` (add 2 deps)
- `src/lib/immersive-mode.ts` (new)
- `src/pages/Player.tsx` (call on mount + resume listener)
- `src/index.css` (add `.kiosk-lockdown` class)
- `capacitor.config.ts` (add StatusBar plugin config)

### Files intentionally NOT changed
- `MainActivity.java` — already correct
- `AndroidManifest.xml` / `styles.xml` — already correct (legacy `Theme.NoTitleBar.Fullscreen` would break Capacitor)
- `App.tsx` — keep immersive scoped to Player route only

### After merge
1. GitHub Actions rebuilds APK (~5 min)
2. Download from Artifacts → sideload Samsung
3. Status bar + nav bar should be gone; swiping from edge briefly shows them then re-hides

