

# APK Update Notification System

## Context

Your APK is a Capacitor wrapper that loads the web app from your published URL. The existing `useVersionCheck` hook already detects **web code** changes and auto-reloads — so frontend updates are seamless without needing a new APK.

However, when you publish a **new APK** (e.g. new native capabilities, Android manifest changes, boot receiver updates), users running the old APK won't know. Here's the plan to fix that.

## How It Works

1. **Store the latest APK version in the database** — a simple `app_settings` table with a `latest_apk_version` key (e.g. `"2.3.0"`) and an optional `apk_download_url`.

2. **The Player checks on startup** — compare the hardcoded `APK_VERSION` ("2.2.0") baked into the APK against the database value. If the DB version is newer, show an update banner.

3. **Admin UI to bump the version** — a small section on the Admin page where you set the latest APK version and download URL. When you build and upload a new APK, just update this value.

4. **Update banner on the Player/TV** — a non-intrusive banner appears on the Player screen saying "A new GlowHub update is available (v2.3.0)" with a dismiss option. On native devices, it can link to the download page.

## Implementation Steps

### Step 1: Database migration
Create an `app_settings` table:
- `key` (text, primary key) — e.g. `"latest_apk_version"`, `"apk_download_url"`
- `value` (text)
- `updated_at` (timestamptz)

Seed with `latest_apk_version = "2.2.0"` and `apk_download_url` pointing to the download page.

### Step 2: Admin UI — APK version manager
Add a section to the Admin page with inputs for "Latest APK Version" and "Download URL", with a save button that updates `app_settings`.

### Step 3: Player-side update check hook
Create `useApkUpdateCheck()`:
- On mount (and periodically), query `app_settings` for `latest_apk_version`
- Compare against the bundled `APK_VERSION` using semver logic
- If newer, set state to show an update banner
- Only runs when detected as a native/APK environment (User-Agent contains `AFT` or `FireTV` or Capacitor bridge exists)

### Step 4: Update banner component
A dismissable banner overlaid on the Player with:
- "GlowHub v{newVersion} is available"
- "Update Now" button linking to `/download` or the configured URL
- "Dismiss" button (stores dismissal in localStorage so it doesn't nag every second, re-shows after 24 hours)

### Step 5: Update `apk-version.ts` workflow
When you bump `APK_VERSION` in code and rebuild the APK, you also update the `app_settings` table from the Admin page — that's all it takes to notify every running device.

## Technical Details

- No edge function needed — direct Supabase reads from the player with anon-accessible RLS policy on `app_settings` (SELECT only for anon/authenticated)
- The `APK_VERSION` constant is already baked into each APK build, making comparison straightforward
- localStorage throttle prevents the banner from reappearing constantly after dismissal

