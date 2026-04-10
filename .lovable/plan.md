

# Fix Icon Dimensions and Publish

## Problem
The published site is running an older build. Additionally, `icon-192x192.png` has incorrect dimensions — the browser rejects it because the file's actual size doesn't match the 192x192 declared in the manifest. This will cause PWABuilder to fail.

## Plan

### 1. Fix the icon file
Verify the actual dimensions of `/public/icon-192x192.png`. If it's the wrong size, resize it to exactly 192x192px. Similarly verify `/public/icon-512x512.png` is exactly 512x512px.

### 2. Publish the app
After fixing the icon, publish/update the site so the latest manifest config (split icon purposes, correct `short_name: "Glow"`, root-relative paths) goes live.

### 3. Verify post-publish
After publishing, confirm:
- `https://glowhub-pixel.lovable.app/manifest.webmanifest` shows split icon entries with `purpose: "any"` and `purpose: "maskable"` separately
- No icon dimension warnings in console
- Service worker registers and passes offline check

### Files
- Potentially resize `public/icon-192x192.png` and `public/icon-512x512.png` (verify dimensions first)

