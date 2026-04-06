

# Home Page for GLOW Digital Signage

## Overview
Create a new public landing page at `/home` and make it the default route for unauthenticated users. The page will be a dark-themed, high-conversion marketing page with hero, pricing, and features sections.

## Routing Changes
- **`src/App.tsx`**: Add a new `/home` route for the landing page (public, no auth required). Update `AuthRoute` and the root `/` logic so unauthenticated visitors see the landing page, while authenticated users go straight to the dashboard.

## New File: `src/pages/Home.tsx`
A single-page component with four sections, all using a forced dark theme (`bg-[#0B1120]`):

### Hero Section
- Large headline: "Your Content. Any Screen. Pure Glow."
- Sub-headline about Firestick/Android TV
- TV mockup frame (CSS-drawn monitor shape) with a colorful gradient placeholder "screen" inside, surrounded by the existing `radiant-glow` CSS effect
- Two CTAs: "Start Glowing for Free" (teal-to-blue gradient button, links to `/auth`) and "See how it works" (outline button, scrolls to features)

### Pricing Section — "Disruptive Pricing"
Two glassmorphism cards (`backdrop-blur-xl bg-white/5 border border-white/10`):

| The Starter (Free Forever) | The Pro Glow (Recommended) |
|---|---|
| $0/mo | $9/mo |
| 1 Screen, Basic Scheduling, 500MB, Watermark | Up to 5 screens (bold), No watermarks, Offline, Health Monitoring, 5GB, Priority Support |
| "Get Started" button → `/auth` | "Go Pro" button → `/auth` with glow border highlight |

The Pro card gets a "Recommended" badge and a subtle glow border.

### Features Section — "The Elements"
3-column grid (stacks on mobile) with custom SVG icons:
1. **Reliability** — Offline-First technology
2. **Simplicity** — Install via Downloader in 60 seconds
3. **Intelligence** — Real-time Health Heartbeat

### Footer
Minimal footer with Glow logo and copyright.

## Design Details
- **Background**: `#0B1120` (deep navy), forced dark regardless of theme toggle
- **Typography**: Poppins (already loaded), wide `tracking-wide`/`tracking-widest` on headings
- **Buttons**: Teal-to-blue gradient (`from-[#00A3A3] to-[#3B82F6]`) with `hover:shadow-[0_0_20px_rgba(0,163,163,0.4)]` glow
- **Glassmorphism cards**: `backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl`
- **No external dependencies needed** — all built with Tailwind utilities

## Files
- **Create**: `src/pages/Home.tsx`
- **Modify**: `src/App.tsx` (add route, adjust unauthenticated redirect)

