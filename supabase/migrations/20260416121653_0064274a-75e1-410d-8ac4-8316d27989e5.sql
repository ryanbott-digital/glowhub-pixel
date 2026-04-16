
INSERT INTO storage.buckets (id, name, public)
VALUES ('apk-releases', 'apk-releases', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can download APK releases"
ON storage.objects FOR SELECT
USING (bucket_id = 'apk-releases');

CREATE POLICY "Admins can upload APK releases"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'apk-releases' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update APK releases"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'apk-releases' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete APK releases"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'apk-releases' AND public.has_role(auth.uid(), 'admin'));
