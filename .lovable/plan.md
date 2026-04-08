

## Redesign `/welcome-pro` — Cinematic Pro Activation Page

### Overview
Complete rewrite of `src/pages/WelcomePro.tsx` with a multi-phase cinematic sequence: particle explosion → scan line reveal → logo glow-up → terminal status → glassmorphism card with action buttons. Plus a canvas-based "glowing O confetti" effect and faster-moving Deep Space background blobs.

### Phases (timed sequence)

```text
0s─1.5s    Black screen → Neon teal/blue particle explosion from center (canvas)
1.5s─3s    Horizontal "System Scan" line sweeps top-to-bottom
3s─4s      Giant "O" logo fades in with permanent pulsing glow
4s─5s      Terminal text types out: [ PRO ACCOUNT ACTIVATED ]
5s+        Glassmorphism card + buttons slide up; confetti starts
```

### File: `src/pages/WelcomePro.tsx` (full rewrite)

**Background layer:**
- Deep Space base (`bg-black` initially, transitioning to `#0B1120`)
- Two large animated blobs (cyan + blue) with faster animation speed than normal pages (e.g., 8s cycle instead of 20s)

**Canvas layer — Particle Explosion:**
- On mount, spawn ~200 particles from center with radial velocity, colored in teal (`#00E5FF`) and electric blue (`#3B82F6`)
- Particles fade and decelerate over 1.5s, then canvas clears

**Scan Line:**
- A thin horizontal gradient line (teal → transparent) animates from `top: 0` to `top: 100%` over ~1.5s using CSS animation
- Reveals content beneath as it passes

**Giant "O" Logo:**
- Large text "O" (8rem+) with `text-shadow` multi-layer glow in teal
- Permanent breathing pulse animation (reuse existing `glow-text-pulse` pattern)

**Terminal Status:**
- `font-mono text-green-400` — types out `[ PRO ACCOUNT ACTIVATED ]` character-by-character over ~1s

**Glassmorphism Card:**
- `bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl`
- Heading: "Welcome to the Future of Signage."
- Subtext about Pro features (Sync Canvas, Pro widgets, High-Bitrate streaming)

**Action Buttons:**
- "🚀 Launch Sync Canvas" → navigates to `/canvas`
- "🎨 Open Glow Studio" → navigates to `/studio`
- Both use gradient `from-[#00A3A3] to-[#3B82F6]` with glow hover shadow

**Confetti — Glowing "O" Pixels:**
- Second canvas layer, starts at phase 5s
- Spawns small "O" characters rendered on canvas, falling slowly from random x positions
- Each "O" has a subtle teal glow (shadow blur), random opacity and size
- Continuous gentle drift downward

### No other files changed
- Route already exists in `App.tsx`
- No backend changes needed

### Technical Notes
- All animations are CSS keyframes + canvas (no framer-motion dependency needed, keeping it lightweight)
- Phase timing controlled via `useState` + `setTimeout` chain in a