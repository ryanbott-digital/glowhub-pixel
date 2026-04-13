import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  subscriptionTier: string;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd: boolean;
  grantedProUntil: string | null;
  isGrantExpired: boolean;
  refreshSubscription: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  subscriptionTier: "free",
  subscriptionEnd: null,
  cancelAtPeriodEnd: false,
  grantedProUntil: null,
  isGrantExpired: false,
  refreshSubscription: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState("free");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [grantedProUntil, setGrantedProUntil] = useState<string | null>(null);

  const isGrantExpired = grantedProUntil !== null && new Date(grantedProUntil) < new Date();

  const fetchTier = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("subscription_tier, granted_pro_until, subscription_end, cancel_at_period_end")
      .eq("id", userId)
      .single();
    if (data) {
      const grant = (data as any).granted_pro_until as string | null;
      setGrantedProUntil(grant);
      setSubscriptionEnd((data as any).subscription_end as string | null);
      setCancelAtPeriodEnd((data as any).cancel_at_period_end ?? false);

      // If grant has expired, show as free so user is prompted to subscribe
      if (grant && new Date(grant) < new Date() && data.subscription_tier === "pro") {
        setSubscriptionTier("free");
      } else {
        setSubscriptionTier(data.subscription_tier || "free");
      }
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (session?.user) {
      await fetchTier(session.user.id);
    }
  }, [session?.user, fetchTier]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
      if (newSession?.user) {
        setTimeout(() => {
          supabase.from("profiles").select("id").eq("id", newSession.user.id).maybeSingle().then(({ data }) => {
            if (!data) {
              supabase.from("profiles").upsert({ id: newSession.user.id }, { onConflict: "id" });
            }
          });
          fetchTier(newSession.user.id);
        }, 0);
      } else {
        setSubscriptionTier("free");
        setSubscriptionEnd(null);
        setCancelAtPeriodEnd(false);
        setGrantedProUntil(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setLoading(false);
      if (initialSession?.user) {
        fetchTier(initialSession.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchTier]);

  // Refresh subscription tier every 60 seconds
  useEffect(() => {
    if (!session?.user) return;
    const interval = setInterval(() => fetchTier(session.user.id), 60_000);
    return () => clearInterval(interval);
  }, [session?.user, fetchTier]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setSubscriptionTier("free");
    setSubscriptionEnd(null);
    setCancelAtPeriodEnd(false);
    setGrantedProUntil(null);
    window.location.href = "/home";
  }, []);

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      subscriptionTier,
      subscriptionEnd,
      cancelAtPeriodEnd,
      grantedProUntil,
      isGrantExpired,
      refreshSubscription,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
