
CREATE TABLE public.remote_trigger_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  screen_id UUID REFERENCES public.screens(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  payload TEXT,
  toggled_off BOOLEAN NOT NULL DEFAULT false,
  source_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.remote_trigger_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trigger logs"
  ON public.remote_trigger_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_trigger_logs_user_id ON public.remote_trigger_logs(user_id);
CREATE INDEX idx_trigger_logs_screen_id ON public.remote_trigger_logs(screen_id);
CREATE INDEX idx_trigger_logs_created_at ON public.remote_trigger_logs(created_at DESC);
