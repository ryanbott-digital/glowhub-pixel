

## Diagnosis

You're not doing anything wrong — there are **two real bugs** behind the 1.0.0 / stale-banner symptom:

### Bug 1 — Native APK is hard-coded as version 1.0
`android/app/build.gradle` line 10–11:
```
versionCode 1
versionName "1.0"
```
Every workflow run produces an APK that Android labels "1.0.0", regardless of what the JS layer thinks. The Samsung's "App info" screen will always say 1.0 until this is bumped.

### Bug 2 — `/GlowHub.apk` is served by Lovable's published frontend, not GitHub
The GitHub Action commits `public/GlowHub.apk`. But `glow.pixelhub.org.uk` only serves what was last **Published** in Lovable. So even after a successful build, downloading `/GlowHub.apk` returns the previous bundled APK until you click **Publish → Update**. That's why the file you got still behaves like an older build.

You chose **GitHub Releases** — that fixes Bug 2 cleanly: the URL bypasses Lovable's CDN entirely and always serves the latest artifact.

---

## The fix (3 parts)

### 1. Sync the Android `versionName` to APK_VERSION
- Update `android/app/build.gradle` → `versionCode 3`, `versionName "3.0.0"`
- Add a workflow step that auto-reads `src/lib/apk-version.ts` and patches `build.gradle` before `./gradlew` runs, so future bumps to `APK_VERSION` flow through automatically (no risk of forgetting again)

### 2. Switch the workflow to publish to GitHub Releases
Replace the "Commit APK to repo" step with a release-publish step using `softprops/action-gh-release@v2`:
- Tag: `v{APK_VERSION}-{run_number}` (e.g. `v3.0.0-15`)
- Asset name: `GlowHub.apk`
- Marks as latest release
- Keeps the existing Artifacts upload as a backup

This means a stable URL like:
```
https://github.com/{owner}/{repo}/releases/latest/download/GlowHub.apk
```
…always serves the newest APK, no Lovable republish needed.

### 3. Point the download buttons at the Releases URL
- Update the `app_settings.apk_download_url` row in the database to the GitHub Releases URL
- Update `src/pages/Download.tsx` line 473 — the hardcoded `href="/GlowHub.apk"` becomes the Releases URL (with cache-busting `?v={APK_VERSION}` appended for safety)
- Optionally: stop committing `public/GlowHub.apk` to the repo at all (saves 5MB per build in git history)

---

## What you'll see after deploying

1. Re-run the workflow → it builds APK v3.0.0, tags it, publishes a GitHub Release
2. Samsung "App info" reads **3.0.0** ✅
3. Visiting `glow.pixelhub.org.uk/download` → "Download APK" button hits the Releases URL → always fresh
4. The in-app update banner stops nagging because Samsung now reports 3.0.0 matching what you set in the admin panel

---

## Files I'll edit (in default mode after approval)

- `android/app/build.gradle` — bump `versionCode` to 3, `versionName` to "3.0.0"
- `.github/workflows/build-firetv.yml` — add version-sync step; replace commit step with `gh-release` publish
- `src/pages/Download.tsx` — swap `/GlowHub.apk` href for the Releases URL
- Database migration — upsert `apk_download_url` in `app_settings`

## What I need from you to finish step 2

I need the **GitHub repo owner + name** (e.g. `ryanbott-digital/glowhub-pixel`) so I can hardcode the Releases URL. I can read it from your screenshot — `ryanbott-digital` is the owner; please confirm the repo name (it's not visible in the screenshot crop) when you approve.

