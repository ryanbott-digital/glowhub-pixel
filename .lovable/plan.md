

## Enhance Pro-Glow Ticker with Breaking Alert System

### What We're Building
A dramatic "Emergency Flash Mode" for the ticker widget with glitch entrance animation, red glow spill effect, and a remote trigger button on the Dashboard that sends a Realtime event to force any screen into alert mode.

### Changes

**1. Studio Ticker — Canvas Renderer** (`src/pages/Studio.tsx`, lines ~393-420)

- Parse new `alertMode` boolean from the ticker's JSON config
- When `alertMode` is true:
  - Swap background from `bg-white/5` to vibrant `bg-[#FF0033]`
  - Apply upward "glow spill" via `box-shadow: 0 -20px 60px rgba(255,0,51,0.4), 0 -40px 100px rgba(255,0,51,0.2)`
  - LIVE badge flashes rapidly with a custom `0.5s` animation instead of `animate-pulse`
  - Text forced to `uppercase font-extrabold text-white`
  - Apply `alertGlitchIn` CSS animation class on the container (0.2s white/red flicker)

**2. Studio Ticker — Properties Panel** (`src/pages/Studio.tsx`, lines ~622-666)

- Add an "Emergency Flash Mode" toggle (Switch component) below the Color selector
- When toggled, sets `alertMode: true/false` in the ticker's JSON config
- Visual: red-tinted label with a `Siren` icon from lucide

**3. CSS Animations** (`src/pages/Studio.tsx`, style block at bottom)

Add three new keyframes:
```css
@keyframes alertGlitchIn {
  0% { opacity: 0; background: white; }
  25% { opacity: 1; background: #FF0033; }
  50% { opacity: 0.3; background: white; }
  75% { opacity: 1; background: #FF0033; }
  100% { opacity: 1; background: #FF0033; }
}
@keyframes alertLiveFlash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}
@keyframes alertGlowSpill {
  0%, 100% { box-shadow: 0 -20px 60px rgba(255,0,51,0.3); }
  50% { box-shadow: 0 -30px 80px rgba(255,0,51,0.5), 0 -50px 120px rgba(255,0,51,0.2); }
}
```

**4. Dashboard — "Trigger Alert" Button** (`src/pages/Dashboard.tsx`)

- Add a "Trigger Alert" button (red, with `Siren` icon) next to the "Signage Preview" header inside the preview tab
- On click, broadcasts a Supabase Realtime event on channel `screen-alerts` with payload `{ type: "flash-alert", user_id }` to all user's screens
- Includes a confirmation toast: "Alert triggered on all screens"
- Only visible for Pro tier users

**5. Player — Realtime Alert Listener** (`src/pages/Player.tsx`)

- Subscribe to the `screen-alerts` Realtime channel
- On receiving a `flash-alert` event, set a local `alertMode` state to true
- Render a full-width red ticker bar at the bottom of the player viewport with the glitch entrance animation, glow spill, and rapid LIVE flash
- Auto-dismiss after 30 seconds or until a `clear-alert` event is received

### Technical Details
- No database changes needed — alerts are ephemeral Realtime broadcasts, not persisted
- Ticker config JSON gains one new field: `alertMode: boolean`
- Uses `supabase.channel().send()` for broadcast (no Postgres changes publication needed)
- Three files edited: `Studio.tsx`, `Dashboard.tsx`, `Player.tsx`
- New lucide icon import: `Siren` (or `AlertTriangle` as fallback)

