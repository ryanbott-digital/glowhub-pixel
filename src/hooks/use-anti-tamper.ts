import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isProTier } from "@/lib/subscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CHEEKY_MESSAGES = [
  "Nice try! 😏 But true Glow power comes from the cloud. Upgrade for $9 to unlock for real.",
  "We see you! 👀 Pro features are server-locked. Upgrade to unlock the real deal.",
  "Sneaky sneaky! 🕵️ CSS tricks won't cut it — the backend knows all. Upgrade to Pro!",
  "Almost had it! 🔒 But our cloud says otherwise. $9/mo for the real glow-up.",
];

function getCheekyMessage() {
  return CHEEKY_MESSAGES[Math.floor(Math.random() * CHEEKY_MESSAGES.length)];
}

/**
 * Anti-tamper hook that:
 * 1. Watches for manual DOM removal of paywall elements → cheeky toast + reload
 * 2. Detects frequent devtools toggling
 * 3. Periodically verifies tier with the server
 */
export function useAntiTamper() {
  const { subscriptionTier, user, signOut } = useAuth();
  const paywallCountRef = useRef(0);
  const devtoolsOpenCount = useRef(0);
  const devtoolsTimer = useRef<ReturnType<typeof setTimeout>>();

  const showCheekyToast = useCallback(() => {
    toast(getCheekyMessage(), {
      duration: 6000,
      icon: "⚡",
      action: {
        label: "Upgrade",
        onClick: () => { window.location.href = "/billing"; },
      },
    });
  }, []);

  // DOM mutation observer — detect paywall element removal
  useEffect(() => {
    if (isProTier(subscriptionTier)) return;

    const countPaywalls = () => document.querySelectorAll("[data-paywall]").length;

    const timer = setTimeout(() => {
      paywallCountRef.current = countPaywalls();
    }, 2000);

    const observer = new MutationObserver(() => {
      if (paywallCountRef.current === 0) return;
      const current = countPaywalls();
      if (current < paywallCountRef.current) {
        console.warn("[AntiTamper] Paywall element removed from DOM.");
        showCheekyToast();
        // Re-count after a short delay (React may re-render)
        setTimeout(() => {
          paywallCountRef.current = countPaywalls();
          // If still removed, hard reload
          if (countPaywalls() < 1) {
            window.location.reload();
          }
        }, 3000);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [subscriptionTier, showCheekyToast]);

  // DevTools detection via resize heuristic
  useEffect(() => {
    if (isProTier(subscriptionTier)) return;

    const threshold = 160;
    let lastWidth = window.outerWidth - window.innerWidth;
    let lastHeight = window.outerHeight - window.innerHeight;

    const handleResize = () => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      const devtoolsLikelyOpen =
        widthDiff > threshold || heightDiff > threshold;
      const wasNarrow = lastWidth <= threshold && lastHeight <= threshold;

      if (devtoolsLikelyOpen && wasNarrow) {
        devtoolsOpenCount.current += 1;
        if (devtoolsOpenCount.current >= 2) {
          showCheekyToast();
          devtoolsOpenCount.current = 0;
        }
      }

      lastWidth = widthDiff;
      lastHeight = heightDiff;
    };

    window.addEventListener("resize", handleResize);

    // Reset counter every 60s
    devtoolsTimer.current = setInterval(() => {
      devtoolsOpenCount.current = 0;
    }, 60_000);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (devtoolsTimer.current) clearInterval(devtoolsTimer.current);
    };
  }, [subscriptionTier, showCheekyToast]);

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

        if (isProTier(subscriptionTier) && !isProTier(serverTier)) {
          console.warn("[AntiTamper] Server tier mismatch. Forcing sign-out.");
          await signOut();
        }
      } catch {
        // Silent fail
      }
    };

    const interval = setInterval(verify, 30_000);
    return () => clearInterval(interval);
  }, [user, subscriptionTier, signOut]);
}
