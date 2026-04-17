

## Samsung Kiosk Hardening — 5 Fixes

### Current state (verified against codebase)
- ✅ `@capacitor/status-bar` + `@hugotomazi/capacitor-navigation-bar` already installed (from last turn)
- ✅ `src/lib/immersive-mode.ts` already calls `StatusBar.hide()` + `NavigationBar.hide()` with resume listeners
- ✅ `MainActivity.java` already sets `SYSTEM_UI_FLAG_IMMERSIVE_STICKY`
- ✅ `capacitor-autostart` helper exists (`src/lib/capacitor-autostart.ts`) — but Capacitor JS-side autostart only flips a pref; needs native `BOOT_COMPLETED` receiver to actually fire on boot
- ❌ No keep-awake (Samsung will sleep the screen after timeout)
- ❌ No `SYSTEM_ALERT_WINDOW` permission
- ❌ No `BOOT_COMPLETED` receiver in native Android code
- ❌ No SplashScreen config in `capacitor.config.ts` (default ~3s white-ish flash possible)
- ❌ Background colour in `capacitor.config.ts` is `#0B1120` (Deep Space) — user wants `#000000` for retail windows

### Fix 1 — Deeper Immersive (unhide → hide cycle)
Update `src/lib/immersive-mode.ts` `applyHide()`:
- Call `NavigationBar.show()` then immediately `NavigationBar.hide()` (the unhide→hide cycle re-arms the sticky immersive flag — without this, Samsung's One UI sometimes leaves the bar in a "peek" state after swipe)
- Same trick for `StatusBar`: `show()` → `hide()`
- Wrap in `requestAnimationFrame` so the cycle happens on the next paint (avoids race with Samsung's UI thread)

### Fix 2 — Keep Awake
- Add dep: `@capacitor-community/keep-awake`
- New helper `src/lib/keep-awake.ts` with `enableKeepAwake()` using the same Vite-safe dynamic-import pattern as `immersive-mode.ts`
- Call from `Player.tsx` mount effect alongside `enableImmersiveMode()`
- Re-apply on `appStateChange` resume (some OEMs drop the wakelock on background)

### Fix 3 — SYSTEM_ALERT_WINDOW
- Add `<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />` to `android/app/src/main/AndroidManifest.xml`
- Note in plan: Android 6+ requires the user to grant this manually via Settings → Apps → Glow → "Display over other apps" the first time. We'll add a one-time prompt later if you want — for now, the permission declaration is enough so power users can enable it.

### Fix 4 — BOOT_COMPLETED Receiver
- Add `<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />` to manifest
- Register a receiver inside `<application>`:
  ```xml
  <receiver android:name=".BootReceiver" android:enabled="true" android:exported="true">
    <intent-filter><action android:name="android.intent.action.BOOT_COMPLETED" /></intent-filter>
  </receiver>
  ```
- New file `android/app/src/main/java/app/lovable/ac739cba0262443bbcae51cf10fbf03b/BootReceiver.java` — on `BOOT_COMPLETED` it launches `MainActivity` with `FLAG_ACTIVITY_NEW_TASK`
- This is the **real** autostart (the existing `capacitor-autostart` JS helper only sets a flag; it depends on a native receiver like this one to act on it). Our receiver makes it work standalone.

### Fix 5 — Splash + Black Background (no white flash)
- `capacitor.config.ts`:
  - Change `backgroundColor` from `'#0B1120'` to `'#000000'` (root + `android` block)
  - Add `SplashScreen` plugin block: `{ launchShowDuration: 0, backgroundColor: '#000000', showSpinner: false, splashFullScreen: true, splashImmersive: true }`
- Update `android/app/src/main/res/values/styles.xml` `AppTheme.NoActionBarLaunch` `windowBackground` to `@android:color/black` (currently likely the splash drawable) — prevents the brief theme flash before WebView paints
- Note: SplashScreen plugin is already a Capacitor core dep; no install needed

### Files touched
- `package.json` (1 dep: `@capacitor-community/keep-awake`)
- `src/lib/immersive-mode.ts` (unhide→hide cycle)
- `src/lib/keep-awake.ts` (new)
- `src/pages/Player.tsx` (call `enableKeepAwake()` on mount + resume)
- `capacitor.config.ts` (black bg + SplashScreen block)
- `android/app/src/main/AndroidManifest.xml` (2 permissions + BootReceiver)
- `android/app/src/main/java/.../BootReceiver.java` (new)
- `android/app/src/main/res/values/styles.xml` (black `windowBackground` on launch theme)

### After merge
1. GitHub Actions rebuilds APK (~5 min)
2. Download from Artifacts → sideload Samsung
3. On first launch, manually grant "Display over other apps" in Samsung Settings (one-time)
4. Reboot tablet → app should auto-launch into black-background fullscreen kiosk that never sleeps

### What I'm NOT doing (and why)
- Not adding a UI button to grant SYSTEM_ALERT_WINDOW — keeping this turn focused; can add a settings toggle later
- Not changing `MainActivity.java` — its existing immersive flags are correct; the JS-side unhide→hide cycle is what's missing
- Not touching the existing `capacitor-autostart` JS helper — it stays as a user-facing toggle; the new `BootReceiver` is the always-on native backstop

