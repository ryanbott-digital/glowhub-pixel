ALTER TABLE public.screens ALTER COLUMN display_mode SET DEFAULT 'fit';
UPDATE public.screens SET display_mode = 'fit' WHERE display_mode IS NULL OR display_mode = 'fill';