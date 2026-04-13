import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const RADIO_API = "https://de1.api.radio-browser.info/json";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("q") || "";
    const limit = Math.min(Number(url.searchParams.get("limit") || "20"), 50);

    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ stations: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiUrl = `${RADIO_API}/stations/byname/${encodeURIComponent(query)}?limit=${limit}&order=clickcount&reverse=true&hidebroken=true`;

    const response = await fetch(apiUrl, {
      headers: { "User-Agent": "GlowHub/1.0" },
    });

    if (!response.ok) {
      throw new Error(`Radio API returned ${response.status}`);
    }

    const raw = await response.json();

    const stations = raw.map((s: any) => ({
      id: s.stationuuid,
      name: s.name?.trim(),
      url: s.url_resolved || s.url,
      favicon: s.favicon || null,
      country: s.country || null,
      codec: s.codec || null,
      bitrate: s.bitrate || 0,
      tags: s.tags || "",
    }));

    return new Response(
      JSON.stringify({ stations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
