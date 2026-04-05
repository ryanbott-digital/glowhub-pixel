
CREATE TABLE public.screen_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  screen_id UUID NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE SET NULL,
  playlist_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.screen_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own screen activity"
  ON public.screen_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.screens
      WHERE screens.id = screen_activity_logs.screen_id
        AND screens.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own screen activity"
  ON public.screen_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own screen activity"
  ON public.screen_activity_logs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.screens
      WHERE screens.id = screen_activity_logs.screen_id
        AND screens.user_id = auth.uid()
    )
  );
