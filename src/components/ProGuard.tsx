import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isProTier } from "@/lib/subscription";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** If true, show a default upgrade prompt instead of nothing */
  showUpgradePrompt?: boolean;
  featureName?: string;
}

export function ProGuard({ children, fallback, showUpgradePrompt = false, featureName = "This feature" }: ProGuardProps) {
  const { subscriptionTier, user, signOut } = useAuth();
  const [serverTier, setServerTier] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const verify = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const res = await supabase.functions.invoke("verify-tier", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        const tier = res.data?.tier || "free";
        setServerTier(tier);
        setVerified(true);

        // Tamper detection: local says pro but server says free
        if (isProTier(subscriptionTier) && !isProTier(tier)) {
          console.warn("[ProGuard] Tier mismatch detected. Forcing sign-out.");
          await signOut();
        }
      } catch {
        // On error, fall back to local tier
        setServerTier(subscriptionTier);
        setVerified(true);
      }
    };

    verify();
  }, [user, subscriptionTier, signOut]);

  // While verifying, don't render Pro content
  if (!verified) return null;

  const effectiveTier = serverTier || subscriptionTier;
  if (!isProTier(effectiveTier)) {
    if (fallback) return <>{fallback}</>;
    if (showUpgradePrompt) {
      return (
        <div className="glass rounded-2xl p-8 text-center space-y-4" data-paywall="true">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">{featureName} requires Pro</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Upgrade to Pro to unlock this feature and get access to all premium capabilities.
          </p>
          <Button
            onClick={() => navigate("/billing")}
            className="bg-gradient-to-r from-primary to-glow-blue text-primary-foreground"
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </Button>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}
