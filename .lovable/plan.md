

# Add Kiosk Mode Section to Settings Page

## What changes

Add a new "Kiosk Mode" section to `src/pages/Settings.tsx`, placed between the "Pro Widget Defaults" section and the "Danger Zone" section. This section provides clear step-by-step instructions for Android/Fire TV users to enable the permissions needed for full kiosk operation.

## Content

The section will include:

1. **"Display Over Other Apps" permission** — explains why it's needed (for Hype Triggers and Takeovers to overlay) and provides an `intent://` deep link button that opens the Android overlay settings directly on the device.

2. **"Pin App to Screen" (Screen Pinning)** — instructions to enable screen pinning in Android Settings > Security, then pin GlowHub so users can't exit without a PIN.

3. **"Disable System Navigation"** — guidance on using Android's Device Owner / fully managed mode (`startLockTask()`) for enterprise deployments where the device should be locked to GlowHub permanently.

4. **"Auto-Start on Boot"** — a note that this is configured per-screen on the Screens page (linking to the existing `launch_on_boot` toggle), keeping settings consolidated.

Each item will use the existing `SettingRow` component pattern with descriptive text and action buttons where applicable.

## Technical details

- **File modified**: `src/pages/Settings.tsx`
- Add `Smartphone`, `Lock`, `ExternalLink` to the lucide imports
- Add a new glassmorphism card section with a `Lock` icon header titled "Kiosk Mode"
- Deep link button uses `intent://` URI scheme: `intent://settings/action_manage_overlay_permission#Intent;scheme=android.settings;end` — this opens the correct