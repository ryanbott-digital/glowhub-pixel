import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifyProAccess(req: Request): Promise<{ allowed: boolean; error?: string }> {
  const url = new URL(req.url);
  const screenId = url.searchParams.get("screen_id");

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Player device path: verify screen owner is Pro
  if (screenId) {
    const { data: screen } = await supabaseAdmin
      .from("screens")
      .select("user_id")
      .eq("id", screenId)
      .single();

    if (!screen) return { allowed: false, error: "Screen not found" };

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("subscription_tier")
      .eq("id", screen.user_id)
      .single();

    const tier = profile?.subscription_tier || "free";
    if (!["pro", "enterprise"].includes(tier)) {
      return { allowed: false, error: "Pro subscription required" };
    }
    return { allowed: true };
  }

  // Authenticated user path
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return { allowed: false, error: "Authentication required" };

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return { allowed: false, error: "Invalid token" };

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  const tier = profile?.subscription_tier || "free";
  if (!["pro", "enterprise"].includes(tier)) {
    return { allowed: false, error: "Pro subscription required" };
  }
  return { allowed: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify Pro access
    const access = await verifyProAccess(req);
    if (!access.allowed) {
      return new Response(
        JSON.stringify({ error: access.error }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const feedUrl = url.searchParams.get("url");

    if (!feedUrl) {
      return new Response(
        JSON.stringify({ error: "Missing 'url' query parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      new URL(feedUrl);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const res = await fetch(feedUrl, {
      headers: { "User-Agent": "GlowHub/1.0 RSS Reader" },
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: `Feed returned ${res.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const xml = await res.text();
    const headlines: string[] = [];

    const itemMatches = xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi);
    for (const m of itemMatches) {
      const titleMatch = m[0].match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch) {
        let t = titleMatch[1].trim();
        t = t.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
        t = t.replace(/<[^>]+>/g, "");
        t = t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        if (t) headlines.push(t);
      }
      if (headlines.length >= 20) break;
    }

    if (headlines.length === 0) {
      const entryMatches = xml.matchAll(/<entry[\s>][\s\S]*?<\/entry>/gi);
      for (const m of entryMatches) {
        const titleMatch = m[0].match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleMatch) {
          let t = titleMatch[1].trim();
          t = t.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
          t = t.replace(/<[^>]+>/g, "");
          t = t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
          if (t) headlines.push(t);
        }
        if (headlines.length >= 20) break;
      }
    }

    return new Response(
      JSON.stringify({ headlines }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "RSS fetch failed", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
