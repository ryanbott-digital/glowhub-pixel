
CREATE TABLE public.screen_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  screen_id UUID NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.screen_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own screen schedules"
  ON public.screen_schedules FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.screens WHERE screens.id = screen_schedules.screen_id AND screens.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own screen schedules"
  ON public.screen_schedules FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.screens WHERE screens.id = screen_schedules.screen_id AND screens.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own screen schedules"
  ON public.screen_schedules FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.screens WHERE screens.id = screen_schedules.screen_id AND screens.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own screen schedules"
  ON public.screen_schedules FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.screens WHERE screens.id = screen_schedules.screen_id AND screens.user_id = auth.uid()
  ));
