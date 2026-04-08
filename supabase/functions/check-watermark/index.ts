import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { screen_id } = await req.json();
    if (!screen_id) {
      return new Response(JSON.stringify({ show: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get screen owner
    const { data: screen } = await supabaseAdmin
      .from("screens")
      .select("user_id")
      .eq("id", screen_id)
      .single();

    if (!screen?.user_id) {
      return new Response(JSON.stringify({ show: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check owner's subscription tier
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("subscription_tier")
      .eq("id", screen.user_id)
      .single();

    const tier = profile?.subscription_tier || "free";
    const show = tier === "free";

    return new Response(JSON.stringify({ show }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ show: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
