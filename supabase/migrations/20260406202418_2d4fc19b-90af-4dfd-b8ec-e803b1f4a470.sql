-- Create screen_groups table
CREATE TABLE public.screen_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.screen_groups ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own screen groups"
  ON public.screen_groups FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own screen groups"
  ON public.screen_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own screen groups"
  ON public.screen_groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own screen groups"
  ON public.screen_groups FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add group_id column to screens
ALTER TABLE public.screens ADD COLUMN group_id UUID REFERENCES public.screen_groups(id) ON DELETE SET NULL;