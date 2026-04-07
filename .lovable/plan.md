

## Gate Pro Features Behind Subscription

### Current State
- The sidebar shows a "PRO" badge on Analytics but doesn't block access
- The Dashboard has a "PRO" Insights tab that isn't gated
- The Analytics page loads fully regardless of subscription tier
- Advanced scheduling (WeeklyScheduleGrid) is listed as a Pro feature but isn't gated
- The `subscription_tier` is stored in the `profiles` table but only used for screen limits

### What This Does
Enforces Pro-only access so free-tier users see an upgrade prompt instead of the actual feature content.

### Files to Modify

**`src/lib/subscription.ts`**
- Export a `PRO_TIERS` constant (`["pro", "enterprise"]`) for reuse
- Add a `isProTier(tier: string)` helper function

**`src/pages/Analytics.tsx`**
- Fetch user's `subscription_tier` from profiles
- If not Pro, render a full-page upgrade prompt (lock icon, "Upgrade to Pro" message, button linking to `/subscription`) instead of charts

**`src/pages/Dashboard.tsx`**
- When `subscriptionTier` is not Pro, disable the Insights tab — show an upgrade tooltip and redirect to `/subscription` on click instead of showing `PlaybackInsights`

**`src/components/screens/WeeklyScheduleGrid.tsx`**
- Accept a `tier` prop; if not Pro, show an inline upgrade banner instead of the schedule grid

**`src/pages/Screens.tsx`**
- Pass the user's tier to `WeeklyScheduleGrid`

**`src/components/AppSidebar.tsx`**
- For `pro: true` items, if user is on free tier, navigate to `/subscription` with a toast instead of the actual page

### Upgrade Prompt Design
- Reuses existing glass card styling
- Crown icon + "Pro Feature" header
- Brief description of what the feature does
- "Upgrade to Pro" button linking to `/subscription`
- Consistent across all gated surfaces

