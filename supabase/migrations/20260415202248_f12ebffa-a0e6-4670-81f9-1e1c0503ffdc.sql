
ALTER TABLE public.screens
  ADD COLUMN fkb_device_id text DEFAULT NULL,
  ADD COLUMN fkb_device_info jsonb DEFAULT NULL;
