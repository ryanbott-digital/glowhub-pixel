

## Cloud APK Build via GitHub Actions

### What This Does
Creates a GitHub Actions workflow that automatically patches and builds a Fire TV-compatible APK whenever you upload a PWABuilder source ZIP — no PC or Android Studio needed.

### Prerequisites
- Your Lovable project must be connected to GitHub (Settings → GitHub → Connect)
- You'll need to download the PWABuilder source ZIP to your phone and commit it to the repo

### Files to Create/Modify

**1. `.github/workflows/build-firetv.yml`** (new)
A GitHub Actions workflow that:
- Triggers manually (workflow_dispatch) with an input for the PWABuilder ZIP path
- Sets up JDK 17 and Android SDK
- Runs the existing `public/patch-firetv.py` to inject Leanback launcher, banner, and feature declarations
- Builds the APK using Gradle (`./gradlew assembleDebug`)
- Uploads the built APK as a downloadable GitHub Actions artifact

**2. `public/patch-firetv.py`** (minor update)
- Update the output path to work within the GitHub Actions workspace instead of `/mnt/documents/`
- Make the banner path default to `public/tv_banner.png` from the repo

**3. `src/pages/InstallGuide.tsx`** (update)
- Add instructions for the cloud build workflow: upload ZIP to repo → Actions tab → download APK

### How You'll Use It (from your phone)
1. Go to pwabuilder.com, download the **Android source ZIP**
2. Go to your GitHub repo, upload the ZIP file to the root
3. Go to Actions tab → "Build Fire TV APK" → Run workflow
4. Wait ~3 minutes, download the built APK artifact
5. Upload the APK to `public/GlowHub.apk` via GitHub

### Technical Details
- Uses `actions/setup-java@v4` with JDK 17
- Android SDK setup via `android-actions/setup-android@v3`
- Gradle wrapper from the PWABuilder source handles the build
- The patched APK is uploaded as a workflow artifact (available for 90 days)

