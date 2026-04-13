-- Create screen_broadcasts table for admin bulk messaging
CREATE TABLE public.screen_broadcasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_user_id UUID NOT NULL,
  sent_by UUID NOT NULL,
  message TEXT NOT NULL,
  broadcast_type TEXT NOT NULL DEFAULT 'info',
  duration_seconds INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.screen_broadcasts ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can insert broadcasts"
ON public.screen_broadcasts FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all broadcasts"
ON public.screen_broadcasts FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete broadcasts"
ON public.screen_broadcasts FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can see broadcasts targeted at them
CREATE POLICY "Users can view own broadcasts"
ON public.screen_broadcasts FOR SELECT
TO authenticated
USING (target_user_id = auth.uid());

-- Player devices can read broadcasts for screens they're paired to
CREATE POLICY "Player can read broadcasts"
ON public.screen_broadcasts FOR SELECT
TO public
USING (EXISTS (
  SELECT 1 FROM screens
  WHERE screens.user_id = screen_broadcasts.target_user_id
    AND screens.pairing_code IS NOT NULL
));

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.screen_broadcasts;