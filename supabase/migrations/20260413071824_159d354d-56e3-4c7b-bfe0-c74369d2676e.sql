-- Create user_api_keys table for storing hashed API secrets
CREATE TABLE public.user_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  api_key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Policies: only the owner can manage their key
CREATE POLICY "Users can view own API key"
  ON public.user_api_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API key"
  ON public.user_api_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own API key"
  ON public.user_api_keys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add hardware_uuid to screens (permanent unique identifier per screen)
ALTER TABLE public.screens
  ADD COLUMN hardware_uuid TEXT UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', '');

-- Add last_remote_trigger timestamp to screens
ALTER TABLE public.screens
  ADD COLUMN last_remote_trigger TIMESTAMP WITH TIME ZONE;

-- Backfill existing screens with hardware_uuid
UPDATE public.screens
  SET hardware_uuid = replace(gen_random_uuid()::text, '-', '')
  WHERE hardware_uuid IS NULL;