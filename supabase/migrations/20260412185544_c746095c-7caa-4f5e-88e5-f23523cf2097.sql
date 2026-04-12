ALTER TABLE public.playlists ADD COLUMN position integer NOT NULL DEFAULT 0;

-- Backfill existing playlists with sequential positions per user
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) - 1 AS pos
  FROM public.playlists
)
UPDATE public.playlists SET position = ranked.pos FROM ranked WHERE playlists.id = ranked.id;