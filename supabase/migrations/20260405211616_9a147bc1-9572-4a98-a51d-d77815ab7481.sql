
CREATE POLICY "Authenticated users can claim screens via pairing code"
ON public.screens FOR UPDATE
TO authenticated
USING (pairing_code IS NOT NULL)
WITH CHECK (user_id = auth.uid());
