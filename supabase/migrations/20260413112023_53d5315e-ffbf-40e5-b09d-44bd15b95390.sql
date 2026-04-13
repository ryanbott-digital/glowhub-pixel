-- Allow unauthenticated player devices to update heartbeat fields on paired screens
CREATE POLICY "Player can heartbeat paired screens"
ON public.screens
FOR UPDATE
TO anon
USING (pairing_code IS NOT NULL)
WITH CHECK (pairing_code IS NOT NULL);