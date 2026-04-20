

User wants to proceed with swapping the Downloader code from `1648081` to `1692151` on the `/download` page. Re-presenting the same plan.

## Changes

**`src/pages/Download.tsx`**
- Replace every occurrence of `1648081` with `1692151`.
- Make the code the hero of that card: large monospaced display with a one-tap copy button, labelled "Type into the Downloader app on your Fire Stick".
- Add a 4-step Fire Stick quick-start under the code:
  1. Install **Downloader** from the Fire Stick app store
  2. Enable *Apps from Unknown Sources* (Settings → My Fire TV → Developer Options)
  3. Open Downloader → enter `1692151` → Go
  4. Install when prompted → launch GlowHub
- Add a reassurance line: "Installs the official GlowHub APK directly from GitHub Releases — no browser, no Silk."

No other files touched. Web-only change, no APK rebuild needed.

