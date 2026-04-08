

## Build the Smart-Glow Weather Widget

### What We're Building
A premium weather widget for the Studio that auto-detects location via IP geolocation, displays animated neon weather icons with an aurora background bloom effect, and shows a live London preview in the sidebar to tease free users.

### Changes

**1. Edge Function: `weather-proxy`** (new file)
- Calls `http://ip-api.com/json` to get city from the TV's IP, then fetches weather from Open-Meteo (free, no API key needed) using the lat/lon returned
- Returns: `{ city, temp, condition, isNight }` 
- CORS headers included; no secrets needed (both APIs are free/public)

**2. Studio Widget Library — Sidebar Preview** (`src/pages/Studio.tsx`)
- Replace the existing static weather preview tile with a live-data teaser
- Add a `useEffect` that fetches weather for London (hardcoded lat/lon via Open-Meteo) on mount and stores `{ temp, condition, icon }` in state
- The sidebar tile shows the real London temperature with animated neon sun/cloud icon and "London · Live" label — this is the "tease" for free users

**3. Canvas Renderer — Weather Widget** (`src/pages/Studio.tsx`)
- Replace the current placeholder renderer (lines 358-364) with the full glassmorphism card:
  - **Container**: `backdrop-blur-[24px]`, thin teal glowing border, rounded-2xl
  - **Aurora bloom**: A blurred background div whose color shifts based on weather condition:
    - Sunny → `from-amber-500/20 to-orange-400/10`
    - Rainy/Cloudy → `from-blue-500/15 to-purple-500/10`
    - Night → `from-indigo-600/20 to-violet-900/10`
  - **Neon icon**: Animated SVG-style icon using lucide icons with glow shadows:
    - Sunny: `Sun` with pulsing golden glow (`animate-pulse`, golden `drop-shadow`)
    - Rainy: `CloudRain` with teal neon drops animation
    - Cloudy: `Cloud` with subtle drift animation
  - **Data display**: Large bold temperature in Satoshi font, city name + condition in small-caps monospace below
- Config JSON: `{"city":"auto","temp":null,"condition":null,"isNight":false}` — the "auto" flag tells the Player to use IP geolocation
- In the Studio canvas, fetch London weather data on mount as a preview (same as sidebar)

**4. Right Sidebar — Weather Config Panel** (`src/pages/Studio.tsx`)
- When a weather widget is selected, show a minimal config section:
  - Toggle: "Auto-detect location" (default on) vs manual city override input
  - Display: Current preview city + temp (read-only)
  - Note: "Location is detected automatically on TV"

**5. CSS Animations** (`src/pages/Studio.tsx` inline styles)
- `@keyframes weatherSunPulse` — golden glow pulse for sunny icon
- `@keyframes weatherRainDrop` — falling neon drop effect
- `@keyframes weatherAuroraShift` — slow color drift for the bloom background

**6. Pro Paywall** — Already handled: `widget-weather` is `pro: true` in the library, so `addElement(w.type, true)` triggers `gatePro()` and shows the "Level Up Your Glow" modal for free users.

### Technical Details
- Open-Meteo API is free, no key required — perfect for this use case
- Edge function uses `ip-api.com` for geolocation (free for non-commercial, works for TV devices)
- Weather code mapping (Open-Meteo WMO codes) → condition strings done in the edge function
- Single file edit for Studio + one new edge function file
- No database changes needed

