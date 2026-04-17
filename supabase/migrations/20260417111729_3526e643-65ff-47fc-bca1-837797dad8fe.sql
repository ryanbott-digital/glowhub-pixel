-- Seed/refresh the latest APK version + GitHub Releases download URL.
-- After your first GitHub Release publishes, update apk_download_url to your real repo URL via Admin → Settings.
INSERT INTO public.app_settings (key, value)
VALUES
  ('latest_apk_version', '3.0.0'),
  ('apk_download_url', 'https://github.com/REPLACE_OWNER/REPLACE_REPO/releases/latest/download/GlowHub.apk')
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = now();