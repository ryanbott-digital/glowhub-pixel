CREATE TABLE public.player_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id uuid NOT NULL,
  media_id uuid,
  error_message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.player_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert error logs"
ON public.player_error_logs FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Screen owners can view error logs"
ON public.player_error_logs FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM screens WHERE screens.id = player_error_logs.screen_id AND screens.user_id = auth.uid()
));