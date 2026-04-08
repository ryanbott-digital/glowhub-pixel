

## Enterprise-Ready Stripe Integration

### Overview
Four changes: new welcome page with neon animation, enhanced checkout with tax ID collection, updated portal with return URL, and Stripe Dashboard branding guidance.

### Changes

**1. Create `src/pages/WelcomePro.tsx`**
- Full-screen dark page (`bg-[#0B1120]`) with a "System Level Up" neon animation on mount
- Animation: fixed overlay with `bg-cyan-400/25` that pulses outward from center, then fades (1.5s CSS keyframe)
- After animation completes, reveal content: large Crown icon with cyan glow, heading "System Level Up", subtext about unlocked Pro features
- "Start Pro Broadcast" button (gradient cyan-to-blue, full width) that navigates to `/` (dashboard)
- Secondary "Go to Billing" link below

**2. Update `src/App.tsx`**
- Add lazy import for `WelcomePro`
- Add route: `<Route path="/welcome-pro" element={<WelcomePro />} />` (no ProtectedRoute wrapper — accessed immediately after Stripe redirect)

**3. Update `supabase/functions/stripe-checkout/index.ts`**
- Change `success_url` from `/payment/success` to `/welcome-pro`
- Add `tax_id_collection: { enabled: true }` to the checkout session creation
- Note on branding: Stripe hosted Checkout page colors (brand color, accent color) are configured in the Stripe Dashboard under Branding Settings, not via API parameters. A comment will be added noting this.

**4. Update `supabase/functions/stripe-portal/index.ts`**
- Update return URL from `/subscription` to `/billing`
- Update Stripe SDK imports to match the checkout function (latest versions)
- Update `apiVersion` to `"2025-08-27.basil"`

**5. Update `src/pages/Billing.tsx`**
- Add a prominent "Billing Settings" button for Pro users that opens the Stripe Customer Portal (reuses existing `handlePortal` logic)
- Rename existing "Manage Payment" button to "Billing Settings" with a Settings icon
- Add subtitle text: "Update card, download invoices, manage subscription"

**6. Remove `src/pages/PaymentSuccess.tsx`** (replaced by WelcomePro)
- Update `App.tsx`: redirect `/payment/success` to `/welcome-pro`

### Technical Notes
- Stripe hosted Checkout does not accept `primary_color`/`background_color` via the API. These must be set in the Stripe Dashboard under Settings > Branding. The `accent_color` setting in the Dashboard controls the Checkout page background. A code comment will document this for the team.
- `tax_id_collection: { enabled: true }` is a first-class Stripe Checkout Session parameter
- No database changes needed
- Files changed: 4 modified, 1 created

