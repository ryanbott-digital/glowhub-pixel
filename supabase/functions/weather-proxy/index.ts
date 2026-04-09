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

const WMO_CONDITIONS: Record<number, { label: string; icon: "sun" | "cloud" | "rain" | "snow" | "storm" }> = {
  0: { label: "Clear Sky", icon: "sun" },
  1: { label: "Mostly Clear", icon: "sun" },
  2: { label: "Partly Cloudy", icon: "cloud" },
  3: { label: "Overcast", icon: "cloud" },
  45: { label: "Foggy", icon: "cloud" },
  48: { label: "Icy Fog", icon: "cloud" },
  51: { label: "Light Drizzle", icon: "rain" },
  53: { label: "Drizzle", icon: "rain" },
  55: { label: "Heavy Drizzle", icon: "rain" },
  61: { label: "Light Rain", icon: "rain" },
  63: { label: "Rain", icon: "rain" },
  65: { label: "Heavy Rain", icon: "rain" },
  71: { label: "Light Snow", icon: "snow" },
  73: { label: "Snow", icon: "snow" },
  75: { label: "Heavy Snow", icon: "snow" },
  80: { label: "Rain Showers", icon: "rain" },
  81: { label: "Heavy Showers", icon: "rain" },
  82: { label: "Violent Showers", icon: "storm" },
  95: { label: "Thunderstorm", icon: "storm" },
  96: { label: "Hail Storm", icon: "storm" },
  99: { label: "Heavy Hail", icon: "storm" },
};

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
    const manualCity = url.searchParams.get("city");
    let lat: number, lon: number, city: string;

    if (manualCity) {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(manualCity)}&count=1`);
      const geoData = await geoRes.json();
      if (!geoData.results?.length) {
        return new Response(JSON.stringify({ error: "City not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      lat = geoData.results[0].latitude;
      lon = geoData.results[0].longitude;
      city = geoData.results[0].name;
    } else {
      const ipRes = await fetch("http://ip-api.com/json/?fields=city,lat,lon,status");
      const ipData = await ipRes.json();
      if (ipData.status !== "success") {
        lat = 51.5074;
        lon = -0.1278;
        city = "London";
      } else {
        lat = ipData.lat;
        lon = ipData.lon;
        city = ipData.city;
      }
    }

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day`
    );
    const weatherData = await weatherRes.json();
    const current = weatherData.current;

    const weatherCode = current?.weather_code ?? 0;
    const condition = WMO_CONDITIONS[weatherCode] || WMO_CONDITIONS[0];

    return new Response(
      JSON.stringify({
        city,
        temp: Math.round(current?.temperature_2m ?? 0),
        condition: condition.label,
        icon: condition.icon,
        isNight: current?.is_day === 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Weather fetch failed", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
