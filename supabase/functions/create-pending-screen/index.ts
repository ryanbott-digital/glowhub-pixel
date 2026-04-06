import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate a unique 6-digit pairing code
    let pairingCode = generatePairingCode();

    // Check for collision (unlikely but safe)
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: existing } = await supabase
        .from("screens")
        .select("id")
        .eq("pairing_code", pairingCode)
        .maybeSingle();

      if (!existing) break;
      pairingCode = generatePairingCode();
    }

    // We need a placeholder user_id since the column is NOT NULL.
    // Use a well-known UUID that represents "unclaimed" screens.
    const UNCLAIMED_USER_ID = "00000000-0000-0000-0000-000000000000";

    const { data: screen, error } = await supabase
      .from("screens")
      .insert({
        pairing_code: pairingCode,
        status: "pending",
        name: "Pending Screen",
        user_id: UNCLAIMED_USER_ID,
      })
      .select("id, pairing_code")
      .single();

    if (error) {
      console.error("Failed to create pending screen:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create screen" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ screen_id: screen.id, pairing_code: screen.pairing_code }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
