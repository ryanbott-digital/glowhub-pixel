
-- 1. Create a security-definer helper to check Pro tier
CREATE OR REPLACE FUNCTION public.is_pro_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id
      AND subscription_tier = 'pro'
  )
$$;

-- 2. Create premium_widgets table
CREATE TABLE public.premium_widgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Widget',
  widget_type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.premium_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pro users can view own widgets"
  ON public.premium_widgets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

CREATE POLICY "Pro users can insert own widgets"
  ON public.premium_widgets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

CREATE POLICY "Pro users can update own widgets"
  ON public.premium_widgets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

CREATE POLICY "Pro users can delete own widgets"
  ON public.premium_widgets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

-- 3. Drop existing owner-scoped policies on sync_groups and replace with Pro-gated ones
DROP POLICY IF EXISTS "Users can view own sync groups" ON public.sync_groups;
DROP POLICY IF EXISTS "Users can insert own sync groups" ON public.sync_groups;
DROP POLICY IF EXISTS "Users can update own sync groups" ON public.sync_groups;
DROP POLICY IF EXISTS "Users can delete own sync groups" ON public.sync_groups;

CREATE POLICY "Pro users can view own sync groups"
  ON public.sync_groups FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

CREATE POLICY "Pro users can insert own sync groups"
  ON public.sync_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

CREATE POLICY "Pro users can update own sync groups"
  ON public.sync_groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

CREATE POLICY "Pro users can delete own sync groups"
  ON public.sync_groups FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
