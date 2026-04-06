
-- 1. Drop overly permissive public SELECT on screens
DROP POLICY IF EXISTS "Public can read screens by id" ON public.screens;

-- 2. Add scoped public read for player devices (screens with a pairing_code)
CREATE POLICY "Player can read paired screens"
ON public.screens FOR SELECT
USING (pairing_code IS NOT NULL);

-- 3. Allow player (anon) to read playlists assigned to a paired screen
CREATE POLICY "Player can read assigned playlists"
ON public.playlists FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.screens
    WHERE screens.current_playlist_id = playlists.id
    AND screens.pairing_code IS NOT NULL
  )
);

-- 4. Allow player (anon) to read playlist items for assigned playlists
CREATE POLICY "Player can read assigned playlist items"
ON public.playlist_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.screens
    WHERE screens.current_playlist_id = playlist_items.playlist_id
    AND screens.pairing_code IS NOT NULL
  )
);

-- 5. Allow player (anon) to read media referenced by assigned playlists
CREATE POLICY "Player can read assigned media"
ON public.media FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.playlist_items pi
    JOIN public.screens s ON s.current_playlist_id = pi.playlist_id
    WHERE pi.media_id = media.id
    AND s.pairing_code IS NOT NULL
  )
);
