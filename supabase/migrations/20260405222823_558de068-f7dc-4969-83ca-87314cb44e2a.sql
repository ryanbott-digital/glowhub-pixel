-- Create debug-screenshots storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('debug-screenshots', 'debug-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload debug screenshots (player is unauthenticated)
CREATE POLICY "Anyone can upload debug screenshots"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'debug-screenshots');

-- Allow authenticated users to view debug screenshots
CREATE POLICY "Authenticated users can view debug screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'debug-screenshots');

-- Allow authenticated users to delete debug screenshots
CREATE POLICY "Authenticated users can delete debug screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'debug-screenshots');

-- Add screenshot and current media tracking columns to screens
ALTER TABLE public.screens ADD COLUMN IF NOT EXISTS last_screenshot_url text;
ALTER TABLE public.screens ADD COLUMN IF NOT EXISTS current_media_id uuid;