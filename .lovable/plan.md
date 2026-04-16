

# Add APK File Upload to Admin Dashboard

## What this does
Adds a file upload button to the existing APK Update Manager card in the Admin dashboard. When you upload a `.apk` file, it gets stored in cloud storage and the download URL is automatically filled in — no need to host it elsewhere or copy URLs manually.

## Steps

1. **Create a storage bucket for APK files**
   - Create an `apk-releases` public storage bucket via migration
   - Add RLS policies: admins can upload/delete, anyone can download

2. **Update Admin APK Update Manager UI** (`src/pages/Admin.tsx`)
   - Add a file input (accept `.apk`) with an "Upload APK" button between the version/URL fields and the Save button
   - On upload: store the file in `apk-releases/{version}.apk` (or timestamped name), get the public URL, and auto-fill the download URL field
   - Show upload progress state (spinner while uploading)
   - Auto-increment the version field if it matches a semver pattern (optional, can just leave it for manual entry)

3. **Update the Download page link** (`src/pages/Download.tsx`)
   - Ensure the download button/link works with the storage URL (it already uses the `apk_download_url` from `app_settings`, so this should work automatically)

## Technical details
- Storage path: `apk-releases/GlowHub-{version}.apk`
- Public URL constructed via `supabase.storage.from('apk-releases').getPublicUrl(...)`
- File size: APKs are typically 5-30MB, well within storage limits
- The existing `saveApkSettings` flow remains unchanged — upload just pre-fills the URL field

