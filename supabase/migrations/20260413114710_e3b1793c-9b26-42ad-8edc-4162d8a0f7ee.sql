CREATE POLICY "Users can delete own broadcasts"
ON public.screen_broadcasts
FOR DELETE
TO authenticated
USING (target_user_id = auth.uid());