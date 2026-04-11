import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  subscriptionTier: string;
  refreshSubscription: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  subscriptionTier: "free",
  refreshSubscription: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState("free");

  const fetchTier = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .single();
    if (data?.subscription_tier) {
      setSubscriptionTier(data.subscription_tier);
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (session?.user) {
      await fetchTier(session.user.id);
    }
  }, [session?.user, fetchTier]);

  useEffect(() => {
    // Set up listener FIRST, then get initial session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
      if (newSession?.user) {
        // Use setTimeout to avoid deadlock from awaiting inside onAuthStateChange
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
    window.location.href = "/home";
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, subscriptionTier, refreshSubscription, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
