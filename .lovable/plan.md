

## Full Neon Landing Page Upgrade

### Overview
Transform the landing page from static to fully dynamic with neon effects, animated elements, mouse-tracking spotlight, marquee, and premium typography.

### Changes

**1. CSS-Only Neon Logotype (Hero)**
- Replace `<GlowLogoImage>` in the hero with a CSS text element: the word "GLOW" rendered in transparent/outlined text with a vibrant teal `text-shadow` glow. No image, no background boxes.
- Keep `<GlowLogoImage>` in nav and footer (those are fine).

**2. Live Aurora TV Screen**
- Replace the static logo inside the hero TV mockup with a full-bleed CSS aurora animation — a slow-shifting gradient cycling through teal, blue, and purple (`@keyframes auroraShift`).
- Add a subtle scanline overlay for realism.

**3. Mouse Spotlight Effect**
- Add a `mousemove` listener on the entire page wrapper that positions a large (600px), soft radial teal glow (10% opacity) div following the cursor using CSS `transform: translate()`.
- Uses `pointer-events: none` so it doesn't interfere with clicks.

**4. Floating Animation on TV & Hardware Icons**
- Apply a `float` CSS animation (`translateY` oscillating 10px over ~4s) to the hero TV mockup and the Firestick/Google TV icon containers.

**5. Horizontal Scrolling Marquee (Trusted For)**
- Replace the static flex row with a CSS marquee — duplicated list items scrolling left infinitely.
- Add neon-styled icons (teal glow on each icon).

**6. Glassmorphism + Light Catch on Feature Cards**
- Add `border-image: linear-gradient(...)` style "light catch" to the Offline-First card and all feature cards.
- Apply the existing `.glass-spotlight` hover effect from the design system.

**7. Typography Upgrades**
- Change hero headline to Satoshi font with `letter-spacing: 0.1em`.
- "Pure Glow" text gets a CSS `@keyframes neonHeartbeat` animation that pulses the `text-shadow` brightness up and down.

### Files Modified

**`src/pages/Home.tsx`**
- Replace hero logo with neon CSS text
- Replace TV mockup inner content with aurora gradient div
- Add mouse spotlight state + tracking div
- Add floating animation class to TV and hardware sections
- Rebuild "Trusted for" as a marquee component
- Add `glass-spotlight` class to feature cards
- Update headline font/spacing, add heartbeat class to "Pure Glow"
- Add all new `@keyframes` to the inline `<style>` block (aurora, float, marquee, neonHeartbeat, spotlight)

### Technical Details

```css
/* Aurora TV screen */
@keyframes auroraShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Floating effect */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Neon heartbeat for "Pure Glow" */
@keyframes neonHeartbeat {
  0%, 100% { text-shadow: 0 0 10px rgba(0,163,163,0.4), 0 0 40px rgba(0,163,163,0.2); }
  50% { text-shadow: 0 0 20px rgba(0,163,163,0.8), 0 0 60px rgba(0,163,163,0.4), 0 0 100px rgba(0,163,163,0.2); }
}

/* Marquee */
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

The mouse spotlight will be a fixed-position div tracked via `onMouseMove` on the page wrapper, using `requestAnimationFrame` for smooth performance.

