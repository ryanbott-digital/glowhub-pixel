

## Admin User Detail Panel

### Overview
Build a clickable user detail view in the Admin page that shows comprehensive information about each user: their screens (with online/offline status and health), screen packs, billing info, and the ability to add screens on their behalf (charging via Stripe).

### Current State
- Admin page lists users with email, join date, tier badge, and a tier selector
- No per-user drill-down exists
- Screen data (`screens` table) has `user_id`, `status`, `last_ping`, `name`, `last_screenshot_url`
- Screen packs tracked via `profiles.screen_packs`
- Stripe customer ID stored in `profiles.stripe_customer_id`
- Existing `admin-users` edge function returns basic user/profile data (GET) and updates tiers (POST)

### Plan

**1. Expand the `admin-users` edge function (GET response)**

Add per-user data to the response:
- Query `screens` table for each user: id, name, status, last_ping, last_screenshot_url
- Include `screen_packs` and `stripe_customer_id` from profiles
- Return these fields alongside existing user data

**2. Create an admin action: add screen pack for a user**

Add a new POST action to `admin-users` (e.g. `action: "add_screen_pack"`) that:
- Takes `user_id` and uses the service role to look up their `stripe_customer_id`
- Creates a Stripe invoice with the $9 screen pack line item (using `price_1TLWS8JjPm8usCNRdXsbRfoM`) and auto-finalizes + charges it
- On success, increments `screen_packs` in the profiles table
- This charges the user's payment method on file via Stripe (invoice approach)

**3. Build the User Detail Dialog in `Admin.tsx`**

When clicking a user row, open a dialog/sheet showing:

- **User Info**: email, joined date, tier, stripe customer ID status
- **Screens Section**: table listing all their screens with:
  - Name
  - Online/Offline status (green/red dot based on last_ping > 90s ago)
  - Last seen timestamp
  - Screenshot thumbnail (if available)
  - Count summary: "3 of 5 screens used (0 packs)"
- **Billing Section**:
  - Stripe customer status (linked/not linked)
  - Link to add a screen pack ($9) — triggers the invoice via the edge function
  - Current screen capacity breakdown
- **Health Alerts**: flag screens offline > 5 minutes

**4. Files Changed**

| File | Change |
|------|--------|
| `supabase/functions/admin-users/index.ts` | Add screens + screen_packs + stripe_customer_id to GET response; add "add_screen_pack" POST action with Stripe invoice |
| `src/pages/Admin.tsx` | Add user detail dialog with screens list, billing info, and "Add Screen Pack" button; update `AdminUser` interface |

### Technical Notes

- The Stripe invoice approach (`stripe.invoices.create` + `stripe.invoices.pay`) charges the customer's default payment method without requiring a checkout redirect
- If the user has no payment method on file, the admin will see an error and can inform the user to add one via the billing portal
- Online/offline detection reuses the same 90-second threshold as the main app
- No database schema changes needed -- all data already exists

