import { corsHeaders } from "@supabase/supabase-js/cors";

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
    const url = new URL(req.url);
    const manualCity = url.searchParams.get("city");
    let lat: number, lon: number, city: string;

    if (manualCity) {
      // Use Open-Meteo geocoding for manual city
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
      // IP-based geolocation
      const ipRes = await fetch("http://ip-api.com/json/?fields=city,lat,lon,status");
      const ipData = await ipRes.json();
      if (ipData.status !== "success") {
        // Fallback to London
        lat = 51.5074;
        lon = -0.1278;
        city = "London";
      } else {
        lat = ipData.lat;
        lon = ipData.lon;
        city = ipData.city;
      }
    }

    // Fetch weather from Open-Meteo
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
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Weather fetch failed", detail: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
