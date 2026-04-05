
-- Create media table
CREATE TABLE public.media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  duration INTEGER,
  aspect_ratio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own media" ON public.media FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own media" ON public.media FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own media" ON public.media FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own media" ON public.media FOR DELETE USING (auth.uid() = user_id);

-- Create playlists table
CREATE TABLE public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own playlists" ON public.playlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own playlists" ON public.playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own playlists" ON public.playlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own playlists" ON public.playlists FOR DELETE USING (auth.uid() = user_id);

-- Create playlist_items table
CREATE TABLE public.playlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  override_duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own playlist items" ON public.playlist_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_items.playlist_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own playlist items" ON public.playlist_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_items.playlist_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own playlist items" ON public.playlist_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_items.playlist_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own playlist items" ON public.playlist_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_items.playlist_id AND user_id = auth.uid())
);

-- Create screens table
CREATE TABLE public.screens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Unnamed Screen',
  pairing_code TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline')),
  current_playlist_id UUID REFERENCES public.playlists(id) ON DELETE SET NULL,
  last_ping TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.screens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own screens" ON public.screens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own screens" ON public.screens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own screens" ON public.screens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own screens" ON public.screens FOR DELETE USING (auth.uid() = user_id);
-- Allow anonymous/public read for the player route
CREATE POLICY "Public can read screens by id" ON public.screens FOR SELECT USING (true);

-- Create pairings table
CREATE TABLE public.pairings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pairing_code TEXT NOT NULL UNIQUE,
  screen_id UUID REFERENCES public.screens(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pairings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pairings" ON public.pairings FOR SELECT USING (true);
CREATE POLICY "Auth users can create pairings" ON public.pairings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users can delete own pairings" ON public.pairings FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.screens WHERE id = pairings.screen_id AND user_id = auth.uid())
);

-- Enable realtime for screens table
ALTER PUBLICATION supabase_realtime ADD TABLE public.screens;

-- Create storage bucket for media
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

CREATE POLICY "Users can upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own media files" ON storage.objects FOR UPDATE USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own media files" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Public can view media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
