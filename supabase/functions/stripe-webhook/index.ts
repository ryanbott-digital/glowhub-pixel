import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const SINGLE_SCREEN_PRICE_ID = "price_1TLgXoJjPm8usCNRNmL9gCc5";

const logStep = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${d}`);
};

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2025-08-27.basil",
  });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      logStep("Signature verification failed", { error: String(err) });
      return new Response("Webhook signature verification failed", { status: 400 });
    }
  } else {
    event = JSON.parse(body);
  }

  logStep("Event received", { type: event.type });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Check if a subscription contains the single-screen price
  const isSingleScreenSub = (subscription: Stripe.Subscription): boolean => {
    return subscription.items.data.some(
      (item) => item.price.id === SINGLE_SCREEN_PRICE_ID
    );
  };

  // Get user id from subscription metadata or customer id
  const getUserIdFromSubscription = async (subscription: Stripe.Subscription): Promise<string | null> => {
    // Try metadata first
    if (subscription.metadata?.supabase_user_id) {
      return subscription.metadata.supabase_user_id;
    }
    // Fallback: look up by stripe_customer_id
    const customerId = subscription.customer as string;
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();
    return data?.id ?? null;
  };

  const handleSubscriptionChange = async (subscription: Stripe.Subscription) => {
    const customerId = subscription.customer as string;

    // Handle single-screen subscription separately
    if (isSingleScreenSub(subscription)) {
      const userId = await getUserIdFromSubscription(subscription);
      if (!userId) {
        logStep("No user found for single screen sub", { customerId });
        return;
      }

      const isActive = subscription.status === "active" || subscription.status === "trialing";

      // Count all active single-screen subscriptions for this customer
      const allSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 100,
      });
      const activeSingleCount = allSubs.data.filter(isSingleScreenSub).length;

      const { error } = await supabase
        .from("profiles")
        .update({
          single_screen_subs: activeSingleCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        logStep("Error updating single_screen_subs", { error });
      } else {
        logStep("Single screen subs updated", { userId, activeSingleCount, subStatus: subscription.status });
      }
      return;
    }

    // Handle main Pro/Enterprise subscription
    const status = subscription.status;
    const tier = subscription.metadata?.tier || "pro";

    let subscriptionTier = "free";
    let subscriptionStatus = "free";

    if (status === "active" || status === "trialing") {
      subscriptionTier = tier;
      subscriptionStatus = "active";
    } else if (status === "past_due") {
      subscriptionTier = tier;
      subscriptionStatus = "past_due";
    } else {
      subscriptionTier = "free";
      subscriptionStatus = "free";
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        subscription_status: subscriptionStatus,
        subscription_tier: subscriptionTier,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_customer_id", customerId);

    if (error) {
      logStep("Error updating profile", { error });
    } else {
      logStep("Profile updated", { customerId, subscriptionTier, subscriptionStatus });
    }
  };

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await handleSubscriptionChange(event.data.object as Stripe.Subscription);
      break;
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        // Store user ID in subscription metadata for future webhook events
        if (session.metadata?.supabase_user_id && !subscription.metadata?.supabase_user_id) {
          await stripe.subscriptions.update(subscription.id, {
            metadata: { supabase_user_id: session.metadata.supabase_user_id, type: session.metadata.type || "" },
          });
        }
        await handleSubscriptionChange(subscription);
      }
      // Handle one-time screen pack purchase
      if (session.metadata?.type === "screen_pack" && session.payment_status === "paid") {
        const userId = session.metadata.supabase_user_id;
        if (userId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("screen_packs")
            .eq("id", userId)
            .single();
          const currentPacks = profile?.screen_packs ?? 0;
          const { error: packError } = await supabase
            .from("profiles")
            .update({ screen_packs: currentPacks + 1, updated_at: new Date().toISOString() })
            .eq("id", userId);
          if (packError) {
            logStep("Error incrementing screen_packs", { error: packError });
          } else {
            logStep("Screen pack added", { userId, newTotal: currentPacks + 1 });
          }
        }
      }
      break;
    }
    default:
      logStep("Unhandled event type", { type: event.type });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
