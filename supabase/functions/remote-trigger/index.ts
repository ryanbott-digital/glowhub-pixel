import { createClient } from "npm:@supabase/supabase-js@2";

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
    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    const device = url.searchParams.get("device");
    const payload = url.searchParams.get("payload");
    const action = url.searchParams.get("action") || "play_playlist";

    if (!key || !device) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: key, device" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Hash the provided key to compare against stored hash
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Look up the API key
    const { data: apiKeyRow, error: keyError } = await supabase
      .from("user_api_keys")
      .select("user_id")
      .eq("api_key_hash", keyHash)
      .maybeSingle();

    if (keyError || !apiKeyRow) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the device belongs to this user
    const { data: screen, error: screenError } = await supabase
      .from("screens")
      .select("id, name, user_id")
      .eq("hardware_uuid", device)
      .eq("user_id", apiKeyRow.user_id)
      .maybeSingle();

    if (screenError || !screen) {
      return new Response(
        JSON.stringify({ error: "Device not found or not owned by this API key holder" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Execute the action
    let updateData: Record<string, unknown> = {
      last_remote_trigger: new Date().toISOString(),
    };

    if (action === "play_playlist" && payload) {
      updateData.current_playlist_id = payload;
    } else if (action === "play_media" && payload) {
      updateData.current_media_id = payload;
    }

    const { error: updateError } = await supabase
      .from("screens")
      .update(updateData)
      .eq("id", screen.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to execute command" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Command '${action}' sent to screen '${screen.name}'`,
        screen_id: screen.id,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
