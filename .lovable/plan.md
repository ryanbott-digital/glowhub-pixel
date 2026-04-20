
## Diagnosis

Your photo confirms the device is still running the web app inside Amazon Silk, not inside the native GlowHub app shell. The `glow.pixelhub.org.uk` bar at the top can only come from Silk.

From the code, the main risk is that `capacitor.config.ts` still hardcodes:

```ts
server: {
  url: 'https://glowhub-pixel.lovable.app/player?forceHideBadge=true',
  cleartext: true,
}
```

That means the Android build is configured to load the remote website instead of behaving like a fully self-contained app build. Even though the Android project has fullscreen/native setup, this needs to be hardened so the released APK is unmistakably the native player experience.

## Plan

### 1) Fix the APK so production builds do not depend on a live website
Update `capacitor.config.ts` so the remote `server.url` is only used for live-reload/dev scenarios, not for release APKs.

Result:
- production APK loads bundled local assets from `dist`
- app launches as its own native shell
- no browser chrome / no Silk URL bar

### 2) Keep the native app launching straight into the player
Use the existing route behavior (`/` -> `/player` on native launches) but make sure the release APK always starts from the app shell, not from a web URL.

Result:
- opening the installed GlowHub app goes directly to the player flow
- no dependency on opening a website first

### 3) Add a build-time safety check so this cannot regress
Update `.github/workflows/build-firetv.yml` to fail the build if a release APK is still configured to use a remote `server.url`.

Result:
- future APKs cannot silently ship as “website wrappers”
- prevents this exact problem from happening again

### 4) Tighten the `/download` guidance so customers don’t end up in Silk
Update `src/pages/Download.tsx` copy to make the install path crystal clear:
- install APK
- tap **Install**
- then launch **GlowHub** from Apps
- if they see `glow.pixelhub.org.uk` at the top, they are in Silk, not the app

I’d also add a short “Wrong screen?” warning that explicitly says:
- Silk = browser
- GlowHub app = correct native player

### 5) Rebuild and republish the APK
After the config fix, generate a new Android/Fire TV APK and publish it to the same GitHub latest-release asset path so your direct download and Downloader flow keep working.

Result:
- customers install the corrected native player
- existing direct-download flow stays simple

## Files to change

- `capacitor.config.ts`
- `.github/workflows/build-firetv.yml`
- `src/pages/Download.tsx`

## Important note

This is not something a web-page tweak alone can solve. The screenshot shows the wrong runtime environment, so the fix requires a new APK build and reinstall of that corrected APK.

## Technical details

- Android native fullscreen is already present in:
  - `android/app/src/main/java/.../MainActivity.java`
  - `android/app/src/main/AndroidManifest.xml`
- The missing hardening is the Capacitor production config
- The app already has correct player routes in `src/App.tsx`
- The current build workflow already publishes `GlowHub.apk`; I would keep that release URL stable and only fix what gets packaged into it
