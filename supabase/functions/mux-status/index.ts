import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const MUX_TOKEN_ID = Deno.env.get("MUX_TOKEN_ID");
    const MUX_TOKEN_SECRET = Deno.env.get("MUX_TOKEN_SECRET");
    if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
      throw new Error("Mux credentials not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { media_ids } = await req.json();
    if (!media_ids || !Array.isArray(media_ids) || media_ids.length === 0) {
      return new Response(JSON.stringify({ error: "Missing media_ids array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch media records that have mux_asset_id and are still processing
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: mediaItems } = await supabaseAdmin
      .from("media")
      .select("id, mux_asset_id, mux_status")
      .in("id", media_ids)
      .eq("user_id", user.id)
      .not("mux_asset_id", "is", null);

    if (!mediaItems || mediaItems.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const muxAuth = btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`);
    const results: { id: string; status: string }[] = [];

    for (const item of mediaItems) {
      try {
        const res = await fetch(`https://api.mux.com/video/v1/assets/${item.mux_asset_id}`, {
          headers: { Authorization: `Basic ${muxAuth}` },
        });

        if (!res.ok) continue;

        const data = await res.json();
        const newStatus = data.data.status;

        if (newStatus !== item.mux_status) {
          await supabaseAdmin.from("media").update({
            mux_status: newStatus,
          }).eq("id", item.id);
        }

        results.push({ id: item.id, status: newStatus });
      } catch {
        // Skip failed checks
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Mux status check error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
