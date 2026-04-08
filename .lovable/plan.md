

## Add Glowing Border to Secondary Buttons on Landing Page

### What We're Building
Applying the same glowing teal border treatment (currently on "See how it works") to all other secondary/outline-style buttons on the landing page for visual consistency.

### Buttons to Update

1. **"Get Started" button** (Starter pricing card, line 638) — currently has `border border-[#1E293B]` with a subtle hover glow. Needs the stronger resting glow shadow and teal border tint to match.

2. **Nav "Login" button** (line 359) — this is a gradient-filled primary button, so it stays as-is.

3. **"Go Pro" button** (line 676) — gradient-filled primary CTA, stays as-is.

4. **"Send Message" button** (line 821) — gradient-filled primary CTA, stays as-is.

### Changes

**`src/pages/Home.tsx`** (single file edit)

**"Get Started" button (line 638):**
Change from:
```
border border-[#1E293B] hover:border-[#00A3A3]/50 hover:shadow-[0_0_16px_rgba(0,163,163,0.1)]
```
To match the "See how it works" treatment:
```
border border-primary/30 shadow-[0_0_12px_hsla(180,100%,32%,0.15)] hover:border-primary/60 hover:shadow-[0_0_20px_hsla(180,100%,32%,0.3)]
```

This gives it the same resting teal glow halo and intensified hover state as the hero