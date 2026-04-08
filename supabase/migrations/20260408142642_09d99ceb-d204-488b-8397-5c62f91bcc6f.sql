
CREATE TABLE public.studio_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Layout',
  canvas_data JSONB NOT NULL DEFAULT '{"elements":[]}'::jsonb,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own layouts" ON public.studio_layouts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own layouts" ON public.studio_layouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own layouts" ON public.studio_layouts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own layouts" ON public.studio_layouts FOR DELETE TO authenticated USING (auth.uid() = user_id);
