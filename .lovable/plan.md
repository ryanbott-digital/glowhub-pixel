

## What's actually happening

Your screenshot shows the player loaded inside **Amazon Silk** (the Fire Stick web browser) — that's the `glow.pixelhub.org.uk` bar at the top. That bar is part of Silk itself, not your app. **No web code can remove it.** Silk always shows that bar; only a real app (your APK) or a kiosk browser (Fully Kiosk) can hide it.

So even though the GitHub Actions APK is now correct, on this device Silk is still the thing actually displaying the page — meaning the APK either isn't installed, or it's installed but the Downloader code opened the URL in Silk instead of launching the app.

You chose **Fully Kiosk** as the supported browser-based path, so the plan is to make that the loud, primary recommendation on `/download` and stop pretending Silk can ever be "fullscreen."

## What I'll change

### 1. `/download` page — promote Fully Kiosk to the #1 option
- Move the **Fully Kiosk Browser** card to the top, label it "Recommended for Fire Stick".
- Add a clear warning callout above the Downloader code: *"Don't open the link in Silk — it will keep showing a URL bar. Use Fully Kiosk Browser or the GlowHub APK instead."*
- Keep the GlowHub APK card as the "best experience" option for sideloaders.
- Demote the raw Downloader code (it's what users were using to land in Silk).

### 2. Add a "You're in Silk" detector on `/player` and `/display`
When the player loads inside Amazon Silk (detected via UA string `Silk` + no Capacitor + no Fully Kiosk UA), show a one-time full-screen overlay:
> "You're viewing this in the Fire Stick browser, which always shows a URL bar. For a true fullscreen kiosk, install Fully Kiosk Browser or the GlowHub APK." + two buttons (open Fully Kiosk setup guide / dismiss).

This stops the user staring at a URL bar wondering what's broken — it tells them exactly why and what to do.

### 3. Tighten the Fully Kiosk setup card on `/download`
Add the exact start URL as a one-tap copy chip and three concrete settings to flip after install:
- Start URL: `https://glowhub-pixel.lovable.app/player`
- Toggle: *Hide Browser UI* → ON
- Toggle: *Fullscreen Mode* → ON
- Toggle: *Auto-Launch on Boot* → ON

### 4. No backend, no APK, no Capacitor changes
The APK build is already correct. The Capacitor wrapper hides system bars correctly. This entire issue is "user opened the wrong thing on the Fire Stick" — the fix is making the right path obvious and adding a self-diagnosing warning when they end up in Silk.

## Files touched
- `src/pages/Download.tsx` — reorder cards, add warning callout, copy-chip the start URL.
- `src/components/SilkFallbackOverlay.tsx` *(new)* — one-time overlay shown when running in Silk.
- `src/pages/Player.tsx` — mount the overlay when Silk is detected.
- `src/pages/Display.tsx` — same overlay.

## What this does NOT fix
It will not remove the URL bar from Silk — that is technically impossible from inside a web page. It makes sure no one ends up in Silk again unless they explicitly choose to.

