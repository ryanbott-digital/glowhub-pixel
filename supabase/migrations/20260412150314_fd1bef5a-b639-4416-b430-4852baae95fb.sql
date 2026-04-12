ALTER TABLE public.sync_group_screens
  ADD COLUMN bezel_compensation integer NOT NULL DEFAULT 0,
  ADD COLUMN color_r integer NOT NULL DEFAULT 0,
  ADD COLUMN color_g integer NOT NULL DEFAULT 0,
  ADD COLUMN color_b integer NOT NULL DEFAULT 0,
  ADD COLUMN brightness_offset integer NOT NULL DEFAULT 0;