ALTER TABLE public.media ADD COLUMN IF NOT EXISTS display_mode text;
ALTER TABLE public.media ADD CONSTRAINT media_display_mode_check CHECK (display_mode IS NULL OR display_mode IN ('fit', 'fill'));