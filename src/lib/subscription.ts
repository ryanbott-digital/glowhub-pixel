import { supabase } from "@/integrations/supabase/client";

export const PRO_TIERS = ["pro", "enterprise"];
export const isProTier = (tier: string) => PRO_TIERS.includes(tier);

const SCREEN_LIMITS: Record<string, number> = {
  free: 1,
  basic: 2,
  pro: 5,
};

export async function checkScreenLimit(userId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  limit: number;
  tier: string;
}> {
  const [profileRes, screensRes] = await Promise.all([
    supabase.from("profiles").select("subscription_tier").eq("id", userId).single(),
    supabase.from("screens").select("id", { count: "exact" }).eq("user_id", userId),
  ]);

  const tier = profileRes.data?.subscription_tier || "free";
  const currentCount = screensRes.count || 0;
  const limit = SCREEN_LIMITS[tier] ?? 1;

  return {
    allowed: currentCount < limit,
    currentCount,
    limit,
    tier,
  };
}
