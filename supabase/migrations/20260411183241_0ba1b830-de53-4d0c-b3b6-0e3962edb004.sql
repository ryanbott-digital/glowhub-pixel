CREATE POLICY "Admins can delete contact submissions"
ON public.contact_submissions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));