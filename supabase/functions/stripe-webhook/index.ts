import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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

  const handleSubscriptionChange = async (subscription: Stripe.Subscription) => {
    const customerId = subscription.customer as string;
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
        await handleSubscriptionChange(subscription);
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
