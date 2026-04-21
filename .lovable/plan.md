

## Problem

The previous icon update wrote **0-byte placeholder files** for all 15 launcher PNGs (`ic_launcher.png`, `ic_launcher_round.png`, `ic_launcher_foreground.png` × 5 densities). AAPT can't compile empty PNGs, so every release/debug Gradle build fails at `mergeReleaseResources`.

The only valid asset that survived is `src/assets/launcher-fg.png` (446 KB, the teal "G" foreground at full resolution).

## Fix

Regenerate all 15 launcher PNGs as **real, valid PNG image data** at the correct Android densities, using the existing `src/assets/launcher-fg.png` as the source of truth.

### Densities (Android standard)

| Folder | `ic_launcher` & `_round` | `ic_launcher_foreground` |
|---|---|---|
| mipmap-mdpi | 48×48 | 108×108 |
| mipmap-hdpi | 72×72 | 162×162 |
| mipmap-xhdpi | 96×96 | 216×216 |
| mipmap-xxhdpi | 144×144 | 324×324 |
| mipmap-xxxhdpi | 192×192 | 432×432 |

### Steps

1. **Generate icons via script** (default mode, using ImageMagick from nix):
   - For each density, resize `src/assets/launcher-fg.png` to the foreground size and write `ic_launcher_foreground.png`.
   - For `ic_launcher.png` and `ic_launcher_round.png`: composite the foreground (centered, ~66% scale per Android adaptive icon guidelines) onto the deep-navy `#0B1120` background at the launcher size. Round variant uses a circular mask.
2. **Verify** every output file is a non-empty PNG with `identify` (ImageMagick) before committing.
3. **No changes needed** to the adaptive XML (`mipmap-anydpi-v26/ic_launcher*.xml`) or `ic_launcher_background.xml` — those already point at the correct names.

### What you'll see

Push triggers the GitHub Action → `mergeReleaseResources` succeeds → APK builds → published to Releases as before, with the GlowHub teal "G" launcher icon visible on Fire Stick.

### Notes

- No app code, manifest, Gradle, or workflow changes — purely regenerating binary assets.
- `src/assets/launcher-fg.png` is preserved as-is.

