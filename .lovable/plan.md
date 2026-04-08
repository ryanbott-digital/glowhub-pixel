

## Glow Cookie Consent Banner

### What We're Building
A floating glassmorphism pill banner at bottom-center that slides up 2 seconds after page load, with cookie consent controls. Persists consent to `localStorage` so it only shows once.

### Changes

**1. Create `src/components/CookieConsent.tsx`**
- Floating pill: `fixed bottom-6 left-1/2 -translate-x-1/2 z-50`, rounded-full, glassmorphism (`bg-white/5 backdrop-blur-[15px] border border-cyan-400/20`)
- Pulsing teal dot using existing `heartbeat-pulse` style or a simple CSS pulse
- Copy: "We use cookies to optimize your Glow experience. System optimized?"
- Two buttons: "Accept" (teal filled) and "Customize" (ghost/outline, links to `/terms?tab=privacy`)
- State: check `localStorage.getItem('glow-cookie-consent')` — if set, don't render
- Slide-up animation: start off-screen (`translate-y-full opacity-0`), after 2s delay transition to visible with a spring-like cubic-bezier
- Accept click: trigger a neon flash overlay (small white/teal flash div that fades in/out over 300ms), then set localStorage and unmount
- Customize click: navigate to `/terms?tab=privacy`

**2. Update `src/App.tsx`**
- Import and render `<CookieConsent />` alongside `<Toaster />` and `<Sonner />` (outside routes, always visible)

### Technical Details
- Spring motion via CSS transition with `cubic-bezier(0.34, 1.56, 0.64, 1)` for overshoot
- Neon flash: absolute overlay inside the pill that flashes `bg-cyan-400/30` then fades out before hiding
- No new dependencies needed
- localStorage key: `glow-cookie-consent`

