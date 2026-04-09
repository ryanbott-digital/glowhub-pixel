CREATE POLICY "Auth users can update pairings"
ON public.pairings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);