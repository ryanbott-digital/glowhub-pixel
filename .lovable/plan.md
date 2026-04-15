

## Add Fully Kiosk Browser Setup Guide to Download Page

### What
Add a new collapsible section on the `/download` page — alongside the existing "Sideloading Install Guide" — that walks users through setting up Fully Kiosk Browser (FKB) on their Fire Stick as a professional kiosk alternative to the custom APK. This eliminates the Silk browser URL bar issue entirely.

### Why
The current APK opens in Amazon Silk, which shows the URL bar and blocks video autoplay. Fully Kiosk Browser is the industry-standard solution for Fire TV kiosk deployments — it provides true fullscreen, autoplay support, remote management, and device-level controls.

### Plan

**1. Add a "Fully Kiosk Browser" ecosystem card** to the grid (alongside "The Player" and "The Admin")
- Icon: `Shield` or `Globe` with a "KIOSK MODE" status label
- Title: "Fully Kiosk Browser"
- Description: "Pro kiosk mode — no URL bar, auto-launch, remote management."
- Badge: "RECOMMENDED FOR FIRE TV"

**2. Add a new collapsible setup guide** after the existing Sideloading Guide
- Title: "Fully Kiosk Browser Setup (Recommended)"
- Steps:
  1. Install **Fully Kiosk Browser** from Amazon App Store (or sideload the APK from fullymanage.com)
  2. Open Fully Kiosk Browser and enter the Glow player URL: `https://glowhub-pixel.lovable.app/player`
  3. Go to **Settings → Web Content** and enable "Autoplay Videos" and "Enable JavaScript"
  4. Go to **Settings → Kiosk Mode** and enable "Enable Kiosk Mode" to lock the device to Glow
  5. Go to **Settings → Device Management** and enable "Launch on Boot" so it starts automatically
  6. Optional: Enable "Screen On/Off Scheduling" for power management
  7. Tap "PLUS" license for remote device management (optional, $7.90 one-time)

**3. Add a tip callout** below the guide explaining the advantages:
- No URL bar or browser chrome
- True fullscreen with autoplay support
- Launch-on-boot without custom APK
- Remote device restart and screenshot capture
- Screen on/off scheduling built in

### Files to Edit
- `src/pages/Download.tsx` — Add the ecosystem card and collapsible guide section (~80 lines added)

### Technical Details
- Uses existing `Step` component and `Collapsible` pattern already on the page
- Matches the Deep Space glassmorphism design system
- The player URL will use the published URL from `project_urls`
- No backend changes needed

