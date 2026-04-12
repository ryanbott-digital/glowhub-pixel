import { supabase } from "@/integrations/supabase/client";

export const PRO_TIERS = ["pro", "enterprise"];
export const isProTier = (tier: string) => PRO_TIERS.includes(tier);

const BASE_SCREEN_LIMITS: Record<string, number> = {
  free: 1,
  basic: 2,
  pro: 5,
};

const SCREENS_PER_PACK = 5;

export async function checkScreenLimit(userId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  limit: number;
  tier: string;
  screenPacks: number;
}> {
  const [profileRes, screensRes] = await Promise.all([
    supabase.from("profiles").select("subscription_tier, screen_packs").eq("id", userId).single(),
    supabase.from("screens").select("id", { count: "exact" }).eq("user_id", userId),
  ]);

  const tier = profileRes.data?.subscription_tier || "free";
  const screenPacks = (profileRes.data as any)?.screen_packs ?? 0;
  const currentCount = screensRes.count || 0;
  const baseLimit = BASE_SCREEN_LIMITS[tier] ?? 1;
  const limit = baseLimit + (screenPacks * SCREENS_PER_PACK);

  return {
    allowed: currentCount < limit,
    currentCount,
    limit,
    tier,
    screenPacks,
  };
}
