

## Problem

The APK is shipping with Capacitor's default blue "X" launcher icon (visible in your Fire TV screenshot) instead of our GlowHub teal "G" — even though the correct PNGs are committed in `android/app/src/main/res/mipmap-*/`.

**Root cause:** the GitHub Action runs `npx cap sync android` (line 122 of `.github/workflows/build-firetv.yml`). Capacitor's sync step copies the default blue-X launcher PNGs from `node_modules/@capacitor/android/.../res/mipmap-*/ic_launcher*.png` **over the top of our committed icons every build**. Locally everything looks fine; CI silently overwrites them right before Gradle assembles the APK.

A secondary cosmetic issue: the source `launcher-fg.png` has heavy transparent padding, so the "G" inside the round Fire TV tile is smaller than the platform-style we want.

## Fix

All changes in `.github/workflows/build-firetv.yml` only — no code, no Gradle, no manifest changes.

### 1. Restore icons after `cap sync` (the real fix)

Add a new step **immediately after `Sync existing Android project`** that copies the canonical icons from a safe location back into `android/app/src/main/res/`. To make this self-healing without committing duplicate assets, the step will:

- Take the committed `src/assets/launcher-fg.png` as the source of truth.
- Use ImageMagick (already available on `ubuntu-latest`) to regenerate all 15 PNGs at correct densities into the mipmap folders, overwriting whatever `cap sync` just wrote.
- Densities (Android adaptive icon spec):

| Folder | `ic_launcher` & `_round` | `ic_launcher_foreground` |
|---|---|---|
| mdpi | 48×48 | 108×108 |
| hdpi | 72×72 | 162×162 |
| xhdpi | 96×96 | 216×216 |
| xxhdpi | 144×144 | 324×324 |
| xxxhdpi | 192×192 | 432×432 |

- `ic_launcher_foreground.png`: resized from source with **~15% safe-zone trim** so the "G" fills the visible circle on Fire TV instead of looking tiny inside the launcher tile.
- `ic_launcher.png` / `ic_launcher_round.png`: composite the trimmed foreground (centered, ~70% scale) on the deep-navy `#0B1120` background, matching the platform "Deep Space" aesthetic. Round variant gets a circular mask.

### 2. Verify before Gradle runs

After regeneration, the step asserts every file is a non-empty PNG (`identify` from ImageMagick). If any file is 0 bytes or fails to decode, fail the build with a clear error so we never ship the blue-X again.

### 3. Bump `APK_VERSION`

Bump `src/lib/apk-version.ts` from `3.0.0` → `3.0.1` so the new build supersedes the bad icon on Fire TV (Android caches launcher icons aggressively per versionCode).

## What you'll see

- Trigger the workflow → `cap sync` runs → our regeneration step overwrites the default icons → Gradle assembles → `GlowHub.apk` ships with the teal "G" on `#0B1120` background.
- On Fire TV "Recently used apps", the tile shows the GlowHub G (well-sized inside the rounded square), not the blue X.
- Future Capacitor upgrades can never regress this — the workflow is now idempotent.

## Out of scope

- No splash screen, manifest, Gradle, or Player changes.
- No new committed image assets (the workflow generates them at build time from the existing `launcher-fg.png`).

