ALTER TABLE public.media ADD COLUMN IF NOT EXISTS mux_asset_id text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS mux_status text DEFAULT NULL;