

## Plan: Add Chromecast/Smart TV section to Install Guide

Add a third device section to `src/pages/InstallGuide.tsx` covering Chromecast and generic Smart TVs, following the same card/step pattern as the existing Firestick and Android TV sections.

### Steps in `src/pages/InstallGuide.tsx`:

1. Add a `smarttv` key to the `steps` object with 4-5 steps covering:
   - Cast tab from Chrome browser (for Chromecast)
   - Using the built-in browser on Smart TVs (Samsung/LG/Vizio)
   - Navigating to the player URL and pairing
   - Keeping the screen awake / disabling screen saver
   - Kiosk mode alternatives for Smart TVs

2. Add a new `<Card>` section below the Android TV card, using the same layout pattern with numbered steps, icons, and separators. Use a `Globe` or `Tv` icon in the header.

Single file change, ~60 lines added.

