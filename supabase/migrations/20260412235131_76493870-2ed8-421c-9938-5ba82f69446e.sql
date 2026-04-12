-- Create schedule_blocks table for advanced multi-day scheduling
CREATE TABLE public.schedule_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  screen_id UUID NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
  media_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE SET NULL,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  block_type TEXT NOT NULL DEFAULT 'content' CHECK (block_type IN ('content', 'blackout', 'hype_override')),
  recurrence TEXT NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekdays', 'weekly', 'monthly')),
  recurrence_end TIMESTAMP WITH TIME ZONE,
  color_code TEXT NOT NULL DEFAULT 'teal',
  priority INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL DEFAULT '',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;

-- Owners can view their schedule blocks
CREATE POLICY "Users can view own schedule blocks"
ON public.schedule_blocks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.screens
    WHERE screens.id = schedule_blocks.screen_id
      AND screens.user_id = auth.uid()
  )
);

-- Owners can insert schedule blocks
CREATE POLICY "Users can insert own schedule blocks"
ON public.schedule_blocks FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.screens
    WHERE screens.id = schedule_blocks.screen_id
      AND screens.user_id = auth.uid()
  )
);

-- Owners can update schedule blocks
CREATE POLICY "Users can update own schedule blocks"
ON public.schedule_blocks FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.screens
    WHERE screens.id = schedule_blocks.screen_id
      AND screens.user_id = auth.uid()
  )
);

-- Owners can delete schedule blocks
CREATE POLICY "Users can delete own schedule blocks"
ON public.schedule_blocks FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.screens
    WHERE screens.id = schedule_blocks.screen_id
      AND screens.user_id = auth.uid()
  )
);

-- Players can read schedule blocks for their paired screen
CREATE POLICY "Player can read schedule blocks"
ON public.schedule_blocks FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.screens
    WHERE screens.id = schedule_blocks.screen_id
      AND screens.pairing_code IS NOT NULL
  )
);

-- Index for fast lookups
CREATE INDEX idx_schedule_blocks_screen ON public.schedule_blocks (screen_id, start_at, end_at);
CREATE INDEX idx_schedule_blocks_user ON public.schedule_blocks (user_id);