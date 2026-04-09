

# Optimize PWA for Google Play / PWABuilder Packaging

## Problem

PWABuilder flags several issues: relative URLs in the manifest, missing offline fetch handler in the Workbox-generated SW, `display: "fullscreen"` instead of `"standalone"`, and icon `purpose` configuration.

## Changes

### 1. Update manifest in `vite.config.ts`

- Change `start_url` from `"/player"` to `"https://glowhub-pixel.lovable.app/player"`
- Change `scope` from `"/"` to `"https://glowhub-pixel.lovable.app/"`
- Change `display` from `"fullscreen"` to `"standalone"`
- Update `theme_color` and `background_color` to brand teal `"#00A3A3"`
- Merge the two 512x512 icon entries into one with `purpose: "any maskable"`
- Update icon `src` paths to absolute URLs (`https://glowhub-pixel.lovable.app/icon-512x512.png`)

### 2. Enhance Workbox config for offline support

In the `workbox` section of VitePWA config, add:
- `runtimeCaching` with a catch