-- Create a trigger function that restricts anon updates to specific columns
CREATE OR REPLACE FUNCTION public.restrict_player_screen_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only restrict anonymous (non-authenticated) users
  IF auth.uid() IS NULL THEN
    -- Preserve all columns except the allowed ones
    NEW.name := OLD.name;
    NEW.user_id := OLD.user_id;
    NEW.pairing_code := OLD.pairing_code;
    NEW.current_playlist_id := OLD.current_playlist_id;
    NEW.group_id := OLD.group_id;
    NEW.hardware_uuid := OLD.hardware_uuid;
    NEW.created_at := OLD.created_at;
    NEW.crossfade_ms := OLD.crossfade_ms;
    NEW.transition_type := OLD.transition_type;
    NEW.loop_enabled := OLD.loop_enabled;
    NEW.sync_layout := OLD.sync_layout;
    NEW.launch_on_boot := OLD.launch_on_boot;
    NEW.last_remote_trigger := OLD.last_remote_trigger;
    -- Allowed to change: last_ping, status, current_media_id, last_screenshot_url
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_restrict_player_screen_update
BEFORE UPDATE ON public.screens
FOR EACH ROW
EXECUTE FUNCTION public.restrict_player_screen_update();