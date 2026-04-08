const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const feedUrl = url.searchParams.get("url");

    if (!feedUrl) {
      return new Response(
        JSON.stringify({ error: "Missing 'url' query parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL format
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

    // Parse titles from RSS/Atom XML using regex (lightweight, no deps)
    const headlines: string[] = [];

    // Try RSS <item><title>...</title></item>
    const itemMatches = xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi);
    for (const m of itemMatches) {
      const titleMatch = m[0].match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch) {
        let t = titleMatch[1].trim();
        // Strip CDATA
        t = t.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
        // Strip HTML tags
        t = t.replace(/<[^>]+>/g, "");
        // Decode common entities
        t = t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        if (t) headlines.push(t);
      }
      if (headlines.length >= 20) break;
    }

    // If no RSS items found, try Atom <entry><title>...</title></entry>
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
