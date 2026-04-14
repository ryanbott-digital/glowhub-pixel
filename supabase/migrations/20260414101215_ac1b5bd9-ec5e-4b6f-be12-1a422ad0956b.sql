
-- Create media_folders table
CREATE TABLE public.media_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'New Folder',
  parent_id UUID REFERENCES public.media_folders(id) ON DELETE CASCADE,
  color TEXT NOT NULL DEFAULT 'gray',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own folders"
  ON public.media_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
  ON public.media_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON public.media_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON public.media_folders FOR DELETE
  USING (auth.uid() = user_id);

-- Add folder_id to media table
ALTER TABLE public.media
  ADD COLUMN folder_id UUID REFERENCES public.media_folders(id) ON DELETE SET NULL;
