
INSERT INTO storage.buckets (id, name, public)
VALUES ('signage-content', 'signage-content', true);

CREATE POLICY "Users can upload own signage content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'signage-content' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own signage content"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'signage-content' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own signage content"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'signage-content' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public can view signage content"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'signage-content');
