import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIVE_PACK_PRICE_ID = "price_1TLWS8JjPm8usCNRdXsbRfoM"; // +5 Screens $9 one-time
const SINGLE_SCREEN_PRICE_ID = "price_1TLgXoJjPm8usCNRNmL9gCc5"; // +1 Screen $3/mo

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body for pack_type
    let packType = "five_pack";
    try {
      const body = await req.json();
      if (body?.pack_type === "single") packType = "single";
    } catch {
      // No body or invalid JSON — default to five_pack
    }

    // Verify user is Pro
    const serviceSupabase = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("stripe_customer_id, subscription_tier")
      .eq("id", user.id)
      .single();

    if (!profile || !["pro", "enterprise"].includes(profile.subscription_tier)) {
      return new Response(JSON.stringify({ error: "Screen packs are only available for Pro users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await serviceSupabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const isSingle = packType === "single";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: isSingle ? "subscription" : "payment",
      line_items: [{ price: isSingle ? SINGLE_SCREEN_PRICE_ID : FIVE_PACK_PRICE_ID, quantity: 1 }],
      success_url: `${req.headers.get("origin")}/screens?pack=success`,
      cancel_url: `${req.headers.get("origin")}/screens`,
      metadata: {
        supabase_user_id: user.id,
        type: isSingle ? "single_screen_sub" : "screen_pack",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Screen pack checkout error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
