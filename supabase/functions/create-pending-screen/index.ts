import { createClient } from "npm:@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function generatePairingCode(): string {
  const chars = "0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Generate a unique 6-digit pairing code
    let pairingCode = generatePairingCode();

    // Check for collision in pairings table
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: existing } = await supabase
        .from("pairings")
        .select("id")
        .eq("pairing_code", pairingCode)
        .maybeSingle();

      if (!existing) break;
      pairingCode = generatePairingCode();
    }

    // Create a pairing record (no screen yet — screen is created when dashboard claims it)
    const { data: pairing, error } = await supabase
      .from("pairings")
      .insert({
        pairing_code: pairingCode,
        // screen_id is null — will be set when claimed
        // expires_at defaults to now() + 15 min
      })
      .select("id, pairing_code")
      .single();

    if (error) {
      console.error("Failed to create pairing:", JSON.stringify(error));
      return new Response(
        JSON.stringify({ error: "Failed to create pairing", detail: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ pairing_id: pairing.id, pairing_code: pairing.pairing_code }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
