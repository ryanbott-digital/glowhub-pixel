import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get current day of week (0=Sunday) and time in UTC
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const currentTime = now.toISOString().slice(11, 19); // HH:MM:SS

    // Find all schedule entries matching right now
    const { data: activeSchedules, error: schedErr } = await supabase
      .from("screen_schedules")
      .select("screen_id, playlist_id")
      .eq("day_of_week", dayOfWeek)
      .lte("start_time", currentTime)
      .gt("end_time", currentTime);

    if (schedErr) {
      console.error("Error fetching schedules:", schedErr);
      return new Response(JSON.stringify({ error: schedErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updated = 0;

    if (activeSchedules && activeSchedules.length > 0) {
      // Group by screen — if multiple schedules match, use the first one
      const screenMap = new Map<string, string>();
      for (const s of activeSchedules) {
        if (!screenMap.has(s.screen_id)) {
          screenMap.set(s.screen_id, s.playlist_id);
        }
      }

      for (const [screenId, playlistId] of screenMap) {
        const { error: updateErr } = await supabase
          .from("screens")
          .update({ current_playlist_id: playlistId })
          .eq("id", screenId)
          .neq("current_playlist_id", playlistId); // Only update if changed

        if (!updateErr) updated++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: activeSchedules?.length ?? 0,
        updated,
        time: currentTime,
        day: dayOfWeek,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
