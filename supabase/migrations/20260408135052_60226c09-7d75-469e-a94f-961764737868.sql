
-- Sync groups table for multi-screen canvas spanning
CREATE TABLE public.sync_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Sync Group',
  orientation TEXT NOT NULL DEFAULT 'horizontal',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync groups" ON public.sync_groups FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sync groups" ON public.sync_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sync groups" ON public.sync_groups FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sync groups" ON public.sync_groups FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Sync group screens (which screens are in a group and their position)
CREATE TABLE public.sync_group_screens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_group_id UUID NOT NULL REFERENCES public.sync_groups(id) ON DELETE CASCADE,
  screen_id UUID NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (sync_group_id, screen_id),
  UNIQUE (sync_group_id, position)
);

ALTER TABLE public.sync_group_screens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync group screens" ON public.sync_group_screens FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sync_groups WHERE sync_groups.id = sync_group_screens.sync_group_id AND sync_groups.user_id = auth.uid()));
CREATE POLICY "Users can insert own sync group screens" ON public.sync_group_screens FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.sync_groups WHERE sync_groups.id = sync_group_screens.sync_group_id AND sync_groups.user_id = auth.uid()));
CREATE POLICY "Users can update own sync group screens" ON public.sync_group_screens FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sync_groups WHERE sync_groups.id = sync_group_screens.sync_group_id AND sync_groups.user_id = auth.uid()));
CREATE POLICY "Users can delete own sync group screens" ON public.sync_group_screens FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sync_groups WHERE sync_groups.id = sync_group_screens.sync_group_id AND sync_groups.user_id = auth.uid()));

-- Player needs to read sync group info for offset rendering
CREATE POLICY "Player can read sync groups" ON public.sync_groups FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.sync_group_screens sgs JOIN public.screens s ON s.id = sgs.screen_id WHERE sgs.sync_group_id = sync_groups.id AND s.pairing_code IS NOT NULL));
CREATE POLICY "Player can read sync group screens" ON public.sync_group_screens FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.screens s WHERE s.id = sync_group_screens.screen_id AND s.pairing_code IS NOT NULL));

-- Enable realtime for sync heartbeat
ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_groups;
