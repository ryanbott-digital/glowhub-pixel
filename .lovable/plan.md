

## Diagnosis

The "Friday" headline is being cropped because the screen is in **Fill** mode (`object-cover`), which crops portrait/tall artwork to fill a 16:9 TV. Your portrait-shaped poster is taller than the TV is, so the top and bottom get clipped.

The player already supports a **Fit** mode (`object-contain`) that shows the entire image with a coloured background filling the leftover space — the toggle exists in each Screen card under Settings → Scaling. The default is just wrong for poster-style content.

## Fix

**1. `src/components/screens/ScreenStatusCard.tsx`**
- Change the default scaling mode from `"fill"` to `"fit"` so new screens show the entire artwork by default.
- Reword the Select options so they're clearer:
  - `Fit (no cropping)` — recommended
  - `Fill (crop to fill)` — for true 16:9 content
- Add a tiny helper line under the Select: *"Use Fit for posters / Fill for 16:9 video."*

**2. `src/pages/Display.tsx`** and **`src/pages/Player.tsx`**
- Change the in-memory default of `displayMode` from `"fill"` to `"fit"` so any screen with no value stored also defaults to no-crop.

**3. Database migration**
- Update the `screens.display_mode` column default from `'fill'` to `'fit'`.
- One-off backfill for screens still on the old default: `UPDATE screens SET display_mode = 'fit' WHERE display_mode IS NULL OR display_mode = 'fill';`
  - This flips every existing screen to no-crop. If you have any screen you specifically want cropping on (true 16:9 video wall), you can switch it back in the card afterwards.

**4. Immediate fix for the Fire Stick on the wall**
- Open the screen's settings card on the Dashboard → **Scaling** → switch to **Fit**. The player picks this up over realtime within ~1s — no APK rebuild needed for that one screen.

## What you'll see

- "Friday Fun Fund" poster will display in full, with letterbox bars in your chosen background colour (default black).
- All future screens you pair will default to Fit, so this never happens again.
- Web-only change for the Player default — but since the player already reads `display_mode` live from the DB, the existing APK on the Fire Stick will pick up the new setting **without a reinstall** the moment you flip Scaling to Fit.

