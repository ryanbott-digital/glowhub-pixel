

## Diagnose & Fix Failing Fire TV Build

### What's happening
All 3 GitHub Action runs failed. I can't read GitHub's run logs from inside Lovable, so I need either (a) the log text from the failed step, or (b) to harden the workflow against the most likely failure modes and re-run.

### Most likely cause
The workflow's "Inject Fire TV leanback intent & banner" step uses raw `sed` with no idempotency guard. The Android `android/` folder is committed to the repo and already contains the LEANBACK intent, banner attribute, and a `tv_banner` drawable from previous successful runs. Re-running the workflow now:

1. Adds a SECOND `LEANBACK_LAUNCHER` category → invalid `AndroidManifest.xml`
2. Re-prepends `<application android:banner="..."` to a tag that already has it → duplicate attribute → manifest merger fails
3. `cp public/tv_banner.png` succeeds but the manifest is already broken before gradle even runs

This produces a red ❌ at either the "Inject" step or the "Build APK" step.

### Fix (single workflow file)

Update `.github/workflows/build-firetv.yml` "Inject Fire TV leanback intent & banner" step to be idempotent — only patch what isn't already there:

```bash
MANIFEST="android/app/src/main/AndroidManifest.xml"

# LEANBACK intent — only add if missing
grep -q 'LEANBACK_LAUNCHER' "$MANIFEST" || \
  sed -i 's|<category android:name="android.intent.category.LAUNCHER" />|&\n                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />|' "$MANIFEST"

# Leanback + touchscreen feature flags — only add if missing
grep -q 'android.software.leanback' "$MANIFEST" || \
  sed -i 's|<application|<uses-feature android:name="android.software.leanback" android:required="false" />\n    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />\n    <application|' "$MANIFEST"

# Banner attribute — only add if missing
grep -q 'android:banner=' "$MANIFEST" || \
  sed -i 's|<application |<application android:banner="@drawable/tv_banner" |' "$MANIFEST"

# Internet permission — already idempotent, keep as-is
grep -q 'android.permission.INTERNET' "$MANIFEST" || \
  sed -i 's|<application|<uses-permission android:name="android.permission.INTERNET" />\n    <application|' "$MANIFEST"

mkdir -p android/app/src/main/res/drawable
cp public/tv_banner.png android/app/src/main/res/drawable/tv_banner.png

# Python immersive patch is already idempotent (checks for windowFullscreen) — keep
```

The Python block that injects the immersive style items is already idempotent (it checks `if 'android:windowFullscreen' in body`), so it stays as-is.

### What I need from you (faster path)
If after this idempotency fix the build still fails, please open the failed run on GitHub → click the red step (whichever has the ❌) → copy the last ~30 lines of red text and paste them here. Then I can pinpoint the exact error instead of guessing.

### File to edit
- `.github/workflows/build-firetv.yml` — make the manifest-patch step idempotent

### Then
- Commit auto-syncs to GitHub → Actions tab → Build Fire TV APK → Run workflow → wait ~5 min → download APK.

