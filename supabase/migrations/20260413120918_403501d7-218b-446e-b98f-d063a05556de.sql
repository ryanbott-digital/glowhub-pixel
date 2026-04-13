ALTER TABLE public.screens
  ADD COLUMN audio_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN audio_station_url text DEFAULT NULL,
  ADD COLUMN audio_station_name text DEFAULT NULL,
  ADD COLUMN audio_volume integer NOT NULL DEFAULT 80,
  ADD COLUMN audio_mute_on_hype boolean NOT NULL DEFAULT true;

-- Update the player heartbeat restriction trigger to also preserve audio columns
-- (owner sets them via dashboard, player should not overwrite)
CREATE OR REPLACE FUNCTION public.restrict_player_screen_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
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
    NEW.audio_enabled := OLD.audio_enabled;
    NEW.audio_station_url := OLD.audio_station_url;
    NEW.audio_station_name := OLD.audio_station_name;
    NEW.audio_volume := OLD.audio_volume;
    NEW.audio_mute_on_hype := OLD.audio_mute_on_hype;
  END IF;
  RETURN NEW;
END;
$$;