
CREATE TABLE public.playback_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  screen_id UUID NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.playback_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (player runs unauthenticated on TV)
CREATE POLICY "Anyone can insert playback logs"
  ON public.playback_logs FOR INSERT
  TO public
  WITH CHECK (true);

-- Screen owners can view their logs
CREATE POLICY "Screen owners can view playback logs"
  ON public.playback_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.screens
      WHERE screens.id = playback_logs.screen_id
        AND screens.user_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.playback_logs;
