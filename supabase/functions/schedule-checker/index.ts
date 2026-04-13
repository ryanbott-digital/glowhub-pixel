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

    const now = new Date();
    const nowISO = now.toISOString();
    const dayOfWeek = now.getUTCDay();
    const currentTime = nowISO.slice(11, 19); // HH:MM:SS

    // ── 1. Legacy: screen_schedules (simple day-of-week + time range) ──
    const { data: legacySchedules, error: legacyErr } = await supabase
      .from("screen_schedules")
      .select("screen_id, playlist_id")
      .eq("day_of_week", dayOfWeek)
      .lte("start_time", currentTime)
      .gt("end_time", currentTime);

    if (legacyErr) {
      console.error("Error fetching legacy schedules:", legacyErr);
    }

    // ── 2. Advanced: schedule_blocks (datetime ranges with recurrence & priority) ──
    // Fetch all blocks that could be active now (non-recurring that span now,
    // or recurring that started before now). We expand recurrence in code.
    const { data: allBlocks, error: blocksErr } = await supabase
      .from("schedule_blocks")
      .select("id, screen_id, media_id, playlist_id, start_at, end_at, block_type, recurrence, recurrence_end, priority")
      .lte("start_at", nowISO)
      .eq("recurrence", "none")
      .lte("start_at", nowISO)
      .gt("end_at", nowISO);

    // Also fetch recurring blocks (they may have started in the past but repeat)
    const { data: recurringBlocks, error: recurErr } = await supabase
      .from("schedule_blocks")
      .select("id, screen_id, media_id, playlist_id, start_at, end_at, block_type, recurrence, recurrence_end, priority")
      .neq("recurrence", "none");

    if (blocksErr) console.error("Error fetching schedule_blocks:", blocksErr);
    if (recurErr) console.error("Error fetching recurring blocks:", recurErr);

    // Expand recurring blocks and check if any are active right now
    const activeAdvanced: Array<{
      screen_id: string;
      playlist_id: string | null;
      media_id: string | null;
      block_type: string;
      priority: number;
    }> = [];

    // Add non-recurring active blocks
    if (allBlocks) {
      for (const b of allBlocks) {
        activeAdvanced.push(b);
      }
    }

    // Expand recurring blocks
    if (recurringBlocks) {
      for (const b of recurringBlocks) {
        if (b.recurrence_end && new Date(b.recurrence_end) < now) continue;
        const origStart = new Date(b.start_at);
        const origEnd = new Date(b.end_at);
        const durationMs = origEnd.getTime() - origStart.getTime();
        const origDay = origStart.getUTCDay();
        const origDate = origStart.getUTCDate();
        const nowDay = now.getUTCDay();
        const nowDate = now.getUTCDate();
        const isWeekday = nowDay >= 1 && nowDay <= 5;

        let matches = false;
        if (b.recurrence === "daily") matches = true;
        else if (b.recurrence === "weekdays") matches = isWeekday;
        else if (b.recurrence === "weekly") matches = nowDay === origDay;
        else if (b.recurrence === "monthly") matches = nowDate === origDate;

        if (!matches) continue;

        // Build today's instance of this block
        const todayStart = new Date(now);
        todayStart.setUTCHours(origStart.getUTCHours(), origStart.getUTCMinutes(), origStart.getUTCSeconds(), 0);
        const todayEnd = new Date(todayStart.getTime() + durationMs);

        if (now >= todayStart && now < todayEnd) {
          activeAdvanced.push(b);
        }
      }
    }

    // ── 3. Merge results: advanced blocks take priority over legacy ──
    // Group by screen_id. Within each screen, pick the highest-priority
    // non-blackout block. Blackout blocks suppress all content.
    const screenMap = new Map<string, { playlist_id: string | null; media_id: string | null; priority: number; isBlackout: boolean }>();

    // Start with legacy schedules (priority 0)
    if (legacySchedules) {
      for (const s of legacySchedules) {
        if (!screenMap.has(s.screen_id)) {
          screenMap.set(s.screen_id, { playlist_id: s.playlist_id, media_id: null, priority: -1, isBlackout: false });
        }
      }
    }

    // Layer advanced blocks on top (higher priority wins)
    for (const b of activeAdvanced) {
      const existing = screenMap.get(b.screen_id);
      if (!existing || b.priority > existing.priority) {
        screenMap.set(b.screen_id, {
          playlist_id: b.playlist_id,
          media_id: b.media_id,
          priority: b.priority,
          isBlackout: b.block_type === "blackout",
        });
      }
    }

    // ── 4. Apply updates to screens ──
    let updated = 0;
    for (const [screenId, entry] of screenMap) {
      if (entry.isBlackout) {
        // Blackout: clear current content
        const { error } = await supabase
          .from("screens")
          .update({ current_playlist_id: null, current_media_id: null })
          .eq("id", screenId);
        if (!error) updated++;
      } else if (entry.playlist_id) {
        const { error } = await supabase
          .from("screens")
          .update({ current_playlist_id: entry.playlist_id })
          .eq("id", screenId)
          .neq("current_playlist_id", entry.playlist_id);
        if (!error) updated++;
      } else if (entry.media_id) {
        const { error } = await supabase
          .from("screens")
          .update({ current_media_id: entry.media_id, current_playlist_id: null })
          .eq("id", screenId)
          .neq("current_media_id", entry.media_id);
        if (!error) updated++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        legacy_matches: legacySchedules?.length ?? 0,
        advanced_matches: activeAdvanced.length,
        screens_evaluated: screenMap.size,
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
