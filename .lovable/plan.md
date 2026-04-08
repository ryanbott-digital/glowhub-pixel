

## Create /billing Route — Glow Pro Billing Dashboard

### Overview
Replace the existing `/subscription` route with a new `/billing` route featuring glassmorphism design, a side-by-side pricing comparison, Stripe integration, "System Level Up" animation on upgrade, and a "Secure Checkout" trust badge.

### Changes

**1. Create `src/pages/Billing.tsx`**
- Glassmorphism cards with `backdrop-blur`, semi-transparent backgrounds, and cyan/teal border accents
- **Status header**: Large badge showing current tier (FREE or PRO) with neon glow for PRO
- **Conditional content**:
  - Free users: "Why Go Pro?" feature list (Unlimited screens, Weather widgets, RSS feeds, 4K Video, Advanced scheduling) + Upgrade CTA
  - Pro users: Next billing date display + "Manage Payment" button (calls `stripe-portal` edge function)
- **Pricing table**: Side-by-side Free vs Pro ($9/mo) comparison grid with checkmarks/crosses
- **Secure Checkout badge**: Lock icon + "Powered by Stripe" text below the CTA
- **System Level Up animation**: On return from successful checkout (`/payment/success` redirect or URL param), trigger a full-screen neon-teal flash overlay that fades out over 1.5s, then show a toast "Welcome to Glow Pro"

**2. Update `src/App.tsx`**
- Add `/billing` route (protected, inside `DashboardLayout`)
- Keep `/subscription` as a redirect to `/billing` for backward compatibility
- Update the lazy import from `Subscription` to `Billing`

**3. Update `src/components/AppSidebar.tsx`**
- Change the "Subscription" nav item to "Billing" with url `/billing`

**4. Update `src/pages/PaymentSuccess.tsx`**
- Add a redirect to `/billing?upgraded=true` so the level-up animation triggers

### Design Details
- Glassmorphism: `bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10` on dark, `bg-white/80 backdrop-blur-xl border border-gray-200/50` on light
- PRO badge: cyan glow ring (`ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]`)
- Feature comparison uses a clean table with Check/X icons
- Secure Checkout: small gray pill with Shield icon + "256-bit SSL · Powered by Stripe"
- Level-up flash: fixed overlay `bg-cyan-400/20` that scales from 0 to full opacity then fades, with CSS animation

### Technical Notes
- Reuses existing `stripe-checkout` and `stripe-portal` edge functions — no backend changes
- Reads `subscription_tier` from profiles table (existing pattern)
- The `?upgraded=true` query param is consumed once and cleared from URL via `history.replaceState`

