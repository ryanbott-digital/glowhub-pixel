ALTER TABLE public.sync_group_screens
  ADD COLUMN grid_col integer NOT NULL DEFAULT 0,
  ADD COLUMN grid_row integer NOT NULL DEFAULT 0;