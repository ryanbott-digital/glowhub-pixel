import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    // Handle VAPID key request from frontend
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body?.action === "get-vapid-key") {
          return new Response(
            JSON.stringify({ vapidPublicKey: vapidPublicKey || null }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch {
        // Not a JSON body or no action — continue with watchdog logic
      }
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const cutoff = new Date(Date.now() - OFFLINE_THRESHOLD_MS).toISOString();

    // Find screens that are still marked online but haven't pinged recently
    const { data: staleScreens, error: screenErr } = await supabase
      .from("screens")
      .select("id, name, user_id, status, last_ping, launch_on_boot")
      .eq("status", "online")
      .lt("last_ping", cutoff);

    if (screenErr) {
      console.error("Error fetching stale screens:", screenErr);
      return new Response(JSON.stringify({ error: screenErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!staleScreens || staleScreens.length === 0) {
      return new Response(JSON.stringify({ marked: 0, notified: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark them offline
    const staleIds = staleScreens.map((s: any) => s.id);
    await supabase
      .from("screens")
      .update({ status: "offline" })
      .in("id", staleIds);

    // Group by user
    const userScreens: Record<string, { name: string; launch_on_boot: boolean }[]> = {};
    for (const s of staleScreens) {
      if (!userScreens[s.user_id]) userScreens[s.user_id] = [];
      userScreens[s.user_id].push({ name: s.name, launch_on_boot: s.launch_on_boot });
    }

    let notified = 0;

    // Send push notifications if VAPID keys are configured
    if (vapidPublicKey && vapidPrivateKey) {
      for (const [userId, screens] of Object.entries(userScreens)) {
        // Get push subscriptions for this user
        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth")
          .eq("user_id", userId)
          .eq("enabled", true);

        if (!subs || subs.length === 0) continue;

        for (const screen of screens) {
          const isProtected = screen.launch_on_boot;
          const payload = JSON.stringify({
            title: isProtected
              ? `🛡️ CRITICAL: Protected Screen Offline: ${screen.name}`
              : `⚠️ Screen Offline: ${screen.name}`,
            body: isProtected
              ? "A Hardware Protected screen has lost connection. Auto-restart may have failed — immediate attention required."
              : "Your broadcast has stopped. Tap to troubleshoot the connection.",
            icon: "/admin-icon-alert-192x192.png",
            url: "/screens",
          });

          for (const sub of subs) {
            try {
              // Use web-push compatible fetch
              const pushEndpoint = sub.endpoint;
              
              // Create JWT for VAPID
              const header = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" }))
                .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
              
              const audience = new URL(pushEndpoint).origin;
              const expiry = Math.floor(Date.now() / 1000) + 12 * 3600;
              
              const jwtPayload = btoa(JSON.stringify({
                aud: audience,
                exp: expiry,
                sub: "mailto:hello@glowhub.io",
              })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

              // For simplicity, send the notification using the raw push API
              // In production, consider using a web-push library
              const response = await fetch(pushEndpoint, {
                method: "POST",
                headers: {
                  "Content-Type": "application/octet-stream",
                  "TTL": "86400",
                },
                body: new TextEncoder().encode(payload),
              });

              if (response.ok || response.status === 201) {
                notified++;
              } else {
                const text = await response.text();
                console.error(`Push failed for ${pushEndpoint}: ${response.status} ${text}`);
                // If subscription is expired/invalid, remove it
                if (response.status === 404 || response.status === 410) {
                  await supabase
                    .from("push_subscriptions")
                    .delete()
                    .eq("endpoint", pushEndpoint)
                    .eq("user_id", userId);
                }
              }
            } catch (pushErr) {
              console.error("Push send error:", pushErr);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ marked: staleIds.length, notified }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Watchdog error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
