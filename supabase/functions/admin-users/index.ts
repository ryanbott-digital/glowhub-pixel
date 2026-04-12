import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await serviceSupabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      const { data: users } = await serviceSupabase.auth.admin.listUsers();
      const { data: profiles } = await serviceSupabase.from("profiles").select("*");
      const { data: screens } = await serviceSupabase.from("screens").select("id, name, status, last_ping, last_screenshot_url, user_id");

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      const screensByUser = new Map<string, any[]>();
      for (const s of screens || []) {
        const list = screensByUser.get(s.user_id) || [];
        list.push(s);
        screensByUser.set(s.user_id, list);
      }

      const result = (users?.users || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        subscription_status: profileMap.get(u.id)?.subscription_status || "free",
        subscription_tier: profileMap.get(u.id)?.subscription_tier || "free",
        granted_pro_until: profileMap.get(u.id)?.granted_pro_until || null,
        screen_packs: profileMap.get(u.id)?.screen_packs ?? 0,
        stripe_customer_id: profileMap.get(u.id)?.stripe_customer_id || null,
        screens: screensByUser.get(u.id) || [],
      }));

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json();

      // Handle add_screen_pack action
      if (body.action === "add_screen_pack") {
        const { user_id } = body;
        if (!user_id) {
          return new Response(JSON.stringify({ error: "Missing user_id" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: profile } = await serviceSupabase
          .from("profiles")
          .select("stripe_customer_id, screen_packs")
          .eq("id", user_id)
          .single();

        if (!profile?.stripe_customer_id) {
          return new Response(JSON.stringify({ error: "User has no Stripe account linked. They need to subscribe or add a payment method first." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
          apiVersion: "2025-08-27.basil",
        });

        try {
          // Create invoice, add line item, finalize, and pay
          const invoice = await stripe.invoices.create({
            customer: profile.stripe_customer_id,
            collection_method: "charge_automatically",
            auto_advance: true,
          });

          await stripe.invoiceItems.create({
            customer: profile.stripe_customer_id,
            price: "price_1TLWS8JjPm8usCNRdXsbRfoM",
            invoice: invoice.id,
          });

          const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
          const paid = await stripe.invoices.pay(finalized.id);

          if (paid.status !== "paid") {
            return new Response(JSON.stringify({ error: `Invoice not paid. Status: ${paid.status}. The user may need to update their payment method.` }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Increment screen_packs
          const newPacks = (profile.screen_packs ?? 0) + 1;
          await serviceSupabase
            .from("profiles")
            .update({ screen_packs: newPacks, updated_at: new Date().toISOString() })
            .eq("id", user_id);

          return new Response(JSON.stringify({ success: true, screen_packs: newPacks }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (stripeErr: any) {
          return new Response(JSON.stringify({ error: stripeErr.message || "Stripe charge failed" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Default: tier update
      const { user_id, subscription_tier, granted_pro_until } = body;
      if (!user_id || !subscription_tier) {
        return new Response(JSON.stringify({ error: "Missing user_id or subscription_tier" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const status = subscription_tier === "free" ? "free" : subscription_tier;

      const updateData: Record<string, any> = {
        subscription_status: status,
        subscription_tier: subscription_tier,
        updated_at: new Date().toISOString(),
      };

      if (granted_pro_until !== undefined) {
        updateData.granted_pro_until = granted_pro_until;
      }

      if (subscription_tier === "free") {
        updateData.granted_pro_until = null;
      }

      const { error } = await serviceSupabase
        .from("profiles")
        .update(updateData)
        .eq("id", user_id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
