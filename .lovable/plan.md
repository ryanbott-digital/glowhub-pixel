

## Add Floor Reflection to Hardware Icons

### Overview
Add a polished black glass reflection effect beneath the Firestick and Google TV icon containers, making them appear to sit on a reflective surface.

### Changes

**`src/pages/Home.tsx`** (lines 305-317)

For each hardware icon column, add a reflection element after the icon container div — a duplicate of the container that is flipped vertically, faded, and blurred:

- Add a `div` after each icon container with:
  - `transform: scaleY(-1)` to flip vertically
  - A gradient mask (`mask-image: linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)`) so it fades out downward
  - `blur(2px)` and `opacity: 0.3` for a soft glass look
  - `h-12` height constraint so the reflection is subtle
  - `overflow: hidden` to clip cleanly
- Alternatively, use a CSS `::after` pseudo-element approach via an inline style block to avoid duplicating the image elements — create a reflected gradient strip beneath each container that mimics the card's glow

**Simpler approach**: Add a styled div below each icon container that renders a soft elliptical teal/white gradient, simulating a light pool on a glass floor:

```tsx
<div className="w-24 h-4 mx-auto mt-2 rounded-full bg-gradient-to-r from-transparent via-[#00A3A3]/15 to-transparent blur-sm" />
```

This creates a subtle "floor glow" reflection without duplicating images. Combined with the existing `hero-float` animation, the reflection will sit statically beneath the floating icons, enhancing the depth illusion.

### Technical Details
- No new files, no new dependencies
- Pure CSS/Tailwind — a small elliptical gradient div placed after each icon container
- The reflection glow will use the brand teal at ~15% opacity with a `blur-sm` for softness

