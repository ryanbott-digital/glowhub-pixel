import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isProTier } from "@/lib/subscription";
import { supabase } from "@/integrations/supabase/client";

/**
 * Anti-tamper hook that:
 * 1. Watches for manual DOM removal of paywall elements
 * 2. Periodically verifies tier with the server
 */
export function useAntiTamper() {
  const { subscriptionTier, user, signOut } = useAuth();
  const paywallCountRef = useRef(0);

  // DOM mutation observer — detect paywall element removal
  useEffect(() => {
    // Only watch if user is on free tier (paywall elements should exist)
    if (isProTier(subscriptionTier)) return;

    // Count initial paywall elements
    const countPaywalls = () => document.querySelectorAll("[data-paywall]").length;
    
    // Delay initial count to let React render
    const timer = setTimeout(() => {
      paywallCountRef.current = countPaywalls();
    }, 2000);

    const observer = new MutationObserver(() => {
      if (paywallCountRef.current === 0) return;
      const current = countPaywalls();
      if (current < paywallCountRef.current) {
        // Paywall element was removed — force reload
        console.warn("[AntiTamper] Paywall element removed from DOM. Reloading.");
        window.location.reload();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [subscriptionTier]);

  // Periodic server-side tier verification (every 30s)
  useEffect(() => {
    if (!user) return;

    const verify = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const res = await supabase.functions.invoke("verify-tier", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        const serverTier = res.data?.tier || "free";

        // Mismatch: local says pro, server says free
        if (isProTier(subscriptionTier) && !isProTier(serverTier)) {
          console.warn("[AntiTamper] Server tier mismatch. Forcing sign-out.");
          await signOut();
        }
      } catch {
        // Silent fail — don't disrupt UX for network issues
      }
    };

    const interval = setInterval(verify, 30_000);
    return () => clearInterval(interval);
  }, [user, subscriptionTier, signOut]);
}
