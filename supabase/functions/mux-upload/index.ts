import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

    const { storage_path, file_name, media_id } = await req.json();
    if (!storage_path || !file_name) {
      return new Response(JSON.stringify({ error: "Missing storage_path or file_name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the public URL for the uploaded file so Mux can ingest it
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: urlData } = supabaseAdmin.storage
      .from("signage-content")
      .getPublicUrl(storage_path);

    const inputUrl = urlData.publicUrl;

    // Create Mux asset from URL
    const muxAuth = btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`);
    const muxRes = await fetch("https://api.mux.com/video/v1/assets", {
      method: "POST",
      headers: {
        Authorization: `Basic ${muxAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: [{ url: inputUrl }],
        playback_policy: ["public"],
        encoding_tier: "baseline",
      }),
    });

    if (!muxRes.ok) {
      const errBody = await muxRes.text();
      throw new Error(`Mux API error [${muxRes.status}]: ${errBody}`);
    }

    const muxData = await muxRes.json();
    const asset = muxData.data;
    const playbackId = asset.playback_ids?.[0]?.id;

    if (!playbackId) {
      throw new Error("No playback ID returned from Mux");
    }

    const streamUrl = `https://stream.mux.com/${playbackId}.m3u8`;

    // Update the media record with the Mux stream URL
    if (media_id) {
      await supabaseAdmin.from("media").update({
        storage_path: streamUrl,
      }).eq("id", media_id).eq("user_id", user.id);
    }

    return new Response(
      JSON.stringify({
        playback_id: playbackId,
        stream_url: streamUrl,
        asset_id: asset.id,
        status: asset.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Mux upload error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
