

# Server-Side Authorization for Pro Features

## Overview

Currently, Pro feature checks are done client-side via `isProTier(subscriptionTier)` which reads from React state. A user can manipulate this in the console or delete paywall DOM elements. This plan adds defense-in-depth across four layers.

## Current State

- **Pro checks**: Client-side only via `isProTier()` from `AuthContext.subscriptionTier`
- **Pro features**: Playback Insights tab, Weather widget, RSS widget, Studio pro widgets, screen limits
- **Edge functions**: `weather-proxy` and `rss-proxy` have **no auth checks** -- anyone can call them
- **Watermark**: Already server-side validated via `check-watermark` edge function (good)

---

## Plan

### 1. Server-Side Tier Verification on Edge Functions

Lock the `weather-proxy` and `rss-proxy` edge functions behind subscription verification:

- Extract the JWT from the `Authorization` header
- Use the service role client to look up `profiles.subscription_tier` for the authenticated user
- Return `403 Forbidden` if the user is not on a Pro tier
- Allow unauthenticated calls only when a valid `screen_id` param is passed (for player devices displaying Pro-owner content), verified server-side against the screen owner's tier

**Files**: `supabase/functions/weather-proxy/index.ts`, `supabase/functions/rss-proxy/index.ts`

### 2. ProGuard Higher-Order Component

Create a `ProGuard` wrapper component that:

- Reads `subscriptionTier` from `AuthContext`
- On mount and on tier change, makes a **server-side verification call** to a new `verify-tier` edge function that returns the canonical tier from the database
- If the server says "free" but local state says "pro", forces a sign-out (tamper detected)
- Renders children only if server-confirmed Pro; otherwise renders an upgrade prompt or nothing
- Used to wrap: `PlaybackInsights`, Weather/RSS widget panels in Studio, and any other Pro-gated UI

**Files**: `src/components/ProGuard.tsx` (new), updates to `src/pages/Dashboard.tsx`, `src/pages/Studio.tsx`

### 3. New `verify-tier` Edge Function

A lightweight edge function that:

- Accepts an authenticated request (JWT in header)
- Returns `{ tier: "free" | "pro" | "enterprise" }` from the `profiles` table using the service role
- Used by `ProGuard` and the anti-tamper logic

**Files**: `supabase/functions/verify-tier/index.ts` (new)

### 4. Anti-Tamper DOM Protection

Add a `useAntiTamper` hook that:

- Uses `MutationObserver` to watch for removal of elements with a `data-paywall` attribute
- If a paywall element is removed externally (not by React), triggers `window.location.reload()` to force a hard refresh
- Periodically (every 30s) calls `verify-tier` to re-validate the subscription against the server
- If a mismatch is detected (local says Pro, server says free), calls `signOut()` from AuthContext

**Files**: `src/hooks/use-anti-tamper.ts` (new), integrate into `App.tsx` or `DashboardLayout.tsx`

### 5. DOM Cleanup for Free Tier

- Ensure Pro-only components are **not rendered at all** (not just hidden with CSS) when the user is on the free tier
- Replace `opacity-60` / `display:none` patterns with conditional rendering (`{isPro && <Component />}`)
- Add `data-paywall` attributes to upgrade prompt elements so the anti-tamper observer can monitor them

**Files**: `src/pages/Dashboard.tsx`, `src/pages/Studio.tsx`, `src/components/AppSidebar.tsx`

---

## Technical Details

### Edge Function Auth Check Pattern
```typescript
// Extract user from JWT
const authHeader = req.headers.get("authorization");
const token = authHeader?.replace("Bearer ", "");
const { data: { user } } = await supabaseAdmin.auth.getUser(token);

// Check tier
const { data: profile } = await supabaseAdmin
  .from("profiles")
  .select("subscription_tier")
  .eq("id", user.id)
  .single();

if (!["pro", "enterprise"].includes(profile?.subscription_tier)) {
  return new Response(JSON.stringify({ error: "Pro subscription required" }), { status: 403 });
}
```

### ProGuard Component Pattern
```typescript
export function ProGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { subscriptionTier, signOut } = useAuth();
  const [serverTier, setServerTier] = useState<string | null>(null);

  useEffect(() => {
    // Call verify-tier edge function
    // If mismatch detected, force sign-out
  }, [subscriptionTier]);

  if (serverTier && !isProTier(serverTier)) return fallback ?? null;
  return <>{children}</>;
}
```

### Summary of Files Changed
- **New**: `src/components/ProGuard.tsx`, `src/hooks/use-anti-tamper.ts`, `supabase/functions/verify-tier/index.ts`
- **Modified**: `supabase/functions/weather-proxy/index.ts`, `supabase/functions/rss-proxy/index.ts`, `src/pages/Dashboard.tsx`, `src/pages/Studio.tsx`, `src/components/AppSidebar.tsx`, `src/components/DashboardLayout.tsx`

