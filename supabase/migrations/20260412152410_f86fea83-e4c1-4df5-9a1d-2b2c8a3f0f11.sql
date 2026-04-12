ALTER TABLE public.sync_group_screens
  ADD COLUMN resolution_w integer NOT NULL DEFAULT 1920,
  ADD COLUMN resolution_h integer NOT NULL DEFAULT 1080;