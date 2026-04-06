ALTER TABLE public.screens
  ADD COLUMN IF NOT EXISTS transition_type text NOT NULL DEFAULT 'crossfade',
  ADD COLUMN IF NOT EXISTS crossfade_ms integer NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS loop_enabled boolean NOT NULL DEFAULT true;