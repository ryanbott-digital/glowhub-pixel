import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Crown, Zap, Shield, Loader2, Building2, Settings, RefreshCw, Clock, AlertTriangle, Monitor, Package, Receipt, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useSearchParams, Link } from "react-router-dom";

const EXPANDABLE_FEATURE = "Up to 5 screens + expandable";
const EXPANDABLE_TOOLTIP = "Add more screens anytime — $9 per 5-screen pack, one-time payment. Stacks with existing packs.";

const FeatureName = ({ name }: { name: string }) => {
  if (name !== EXPANDABLE_FEATURE) return <>{name}</>;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help">
            {name}
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-xs">
          {EXPANDABLE_TOOLTIP}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const FREE_FEATURES = [
  { name: "1 screen", free: true, pro: true },
  { name: "Basic media support", free: true, pro: true },
  { name: "Community support", free: true, pro: true },
  { name: EXPANDABLE_FEATURE, free: false, pro: true },
  { name: "Weather & RSS widgets", free: false, pro: true },
  { name: "4K video support", free: false, pro: true },
  { name: "Advanced scheduling", free: false, pro: true },
  { name: "Heartbeat monitoring", free: false, pro: true },
  { name: "Priority support", free: false, pro: true },
];

export default function Billing() {
  const { user, subscriptionTier, refreshSubscription, grantedProUntil, isGrantExpired } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTier = subscriptionTier;
  const loading = !user;
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [screenPackLoading, setScreenPackLoading] = useState(false);
  const [screenPacks, setScreenPacks] = useState(0);
  const [screenPacksLoading, setScreenPacksLoading] = useState(true);

  const handleScreenPackCheckout = async () => {
    setScreenPackLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("screen-pack-checkout");
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setScreenPackLoading(false);
    }
  };

  const handleRefreshSubscription = async () => {
    setRefreshing(true);
    await refreshSubscription();
    setRefreshing(false);
    toast.success("Subscription status refreshed");
  };

  // Fetch screen pack count
  useEffect(() => {
    if (!user) return;
    const fetchPacks = async () => {
      setScreenPacksLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("screen_packs")
        .eq("id", user.id)
        .single();
      setScreenPacks((data as any)?.screen_packs ?? 0);
      setScreenPacksLoading(false);
    };
    fetchPacks();
  }, [user]);

  // System Level Up animation on upgrade
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      setShowLevelUp(true);
      window.history.replaceState({}, "", "/billing");
      toast.success("Welcome to Glow Pro! 🚀", { description: "All Pro features are now unlocked." });
      setTimeout(() => setShowLevelUp(false), 1500);
    }
  }, [searchParams]);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: { tier: "pro" },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-portal");
      if (error) throw error;
      if (data?.error) {
        // Pro user without Stripe account = manually granted, show support message
        if (isPro && data.error.includes("billing account")) {
          toast.info("Your plan is managed by our team. Please contact hello@glowhub.io for billing enquiries.");
        } else {
          throw new Error(data.error);
        }
        return;
      }
      if (data?.url) window.location.href = data.url;
      else toast.info("Your plan is managed by our team. Please contact hello@glowhub.io for billing enquiries.");
    } catch (err: any) {
      toast.error(err.message || "Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const isPro = currentTier === "pro" || currentTier === "enterprise";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Level Up Flash */}
      {showLevelUp && (
        <div className="fixed inset-0 z-[100] pointer-events-none animate-[levelUpFlash_1.5s_ease-out_forwards]">
          <div className="absolute inset-0 bg-cyan-400/20" />
          <div className="absolute inset-0 bg-gradient-radial from-cyan-400/30 via-transparent to-transparent" />
        </div>
      )}

      {/* Header with status badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your Glow subscription</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshSubscription}
            disabled={refreshing}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Checking…" : "Refresh Status"}
          </Button>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
            isPro
              ? "bg-cyan-400/10 text-cyan-400 ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
              : "bg-muted text-muted-foreground ring-1 ring-border"
          }`}>
            {isPro ? <Crown className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
            {isPro ? "Glow Pro" : "Free Plan"}
          </div>
        </div>
      </div>

      {/* Expiry warning banner for granted Pro users */}
      {grantedProUntil && (() => {
        const expiryDate = new Date(grantedProUntil);
        const now = new Date();
        const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const expired = daysLeft <= 0;
        const expiringSoon = daysLeft > 0 && daysLeft <= 14;

        if (expired) {
          return (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 backdrop-blur-xl p-4 flex items-start gap-3 animate-fade-in">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Your complimentary Pro access has expired</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your granted Pro access ended on {expiryDate.toLocaleDateString()}. Upgrade below to keep all Pro features.
                </p>
              </div>
              <Button size="sm" onClick={handleCheckout} disabled={checkoutLoading} className="flex-shrink-0 bg-gradient-to-r from-[hsl(180,100%,32%)] to-[hsl(217,91%,60%)] text-white border-0">
                {checkoutLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crown className="h-3.5 w-3.5 mr-1" />}
                Subscribe
              </Button>
            </div>
          );
        }

        if (expiringSoon) {
          return (
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 backdrop-blur-xl p-4 flex items-start gap-3 animate-fade-in">
              <Clock className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Pro access expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your complimentary Pro access ends on {expiryDate.toLocaleDateString()}. Subscribe now to avoid losing Pro features.
                </p>
              </div>
              <Button size="sm" onClick={handleCheckout} disabled={checkoutLoading} variant="outline" className="flex-shrink-0 border-amber-400/30 text-amber-400 hover:bg-amber-400/10">
                {checkoutLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crown className="h-3.5 w-3.5 mr-1" />}
                Subscribe
              </Button>
            </div>
          );
        }

        return null;
      })()}

      {/* Conditional content based on tier */}
      {isPro ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Your Pro Subscription</h2>
            <p className="text-sm text-muted-foreground">
              You have access to all Glow features. Update your card, download invoices, or manage your subscription below.
            </p>
            <Button onClick={handlePortal} disabled={portalLoading} variant="outline" className="border-cyan-400/30 hover:border-cyan-400/60 hover:bg-cyan-400/5">
              {portalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
              Billing Settings
            </Button>
            <p className="text-xs text-muted-foreground">Update card, download invoices, manage subscription</p>
          </div>

          {/* Screen Pack Add-on */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-xl p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Monitor className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Need More Screens?</h3>
                <p className="text-xs text-muted-foreground">Add 5 extra screens to your account</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Running out of screen slots? Purchase an additional <span className="text-primary font-medium">5-screen pack</span> for a one-time payment of <span className="text-primary font-bold">$9</span>. Stacks with any existing packs.
            </p>
            <Button
              onClick={handleScreenPackCheckout}
              disabled={screenPackLoading}
              className="bg-gradient-to-r from-primary to-accent text-primary-foreground"
            >
              {screenPackLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Monitor className="h-4 w-4 mr-2" />}
              Add 5 Screens — $9
            </Button>
          </div>

          {/* Screen Pack Purchase History */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Screen Pack History</h3>
                <p className="text-xs text-muted-foreground">Your purchased add-ons</p>
              </div>
            </div>
            {screenPacksLoading ? (
              <div className="flex items-center gap-2 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading…</span>
              </div>
            ) : screenPacks > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-border/30 bg-card/50 p-4">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {screenPacks} Screen Pack{screenPacks !== 1 ? "s" : ""} Purchased
                      </p>
                      <p className="text-xs text-muted-foreground">
                        +{screenPacks * 5} extra screens added to your account
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">${screenPacks * 9}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>Base Pro screens: 5</span>
                  <span className="text-primary font-medium">Total capacity: {5 + screenPacks * 5} screens</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">
                No screen packs purchased yet. Each pack adds 5 additional screens for $9.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-cyan-400/20 bg-white/5 backdrop-blur-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Crown className="h-5 w-5 text-cyan-400" /> Why Go Pro?
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {["Up to 5 screens + expandable", "Weather & RSS widgets", "4K video support", "Advanced scheduling", "Priority support"].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pricing comparison table */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Free Card */}
        <div className={`rounded-2xl border p-6 space-y-4 backdrop-blur-xl transition-all ${
          !isPro ? "border-primary/40 ring-2 ring-primary/30 bg-white/5" : "border-white/10 bg-white/5"
        }`}>
          {!isPro && (
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary px-2 py-0.5 rounded-full mb-2">
              Your Plan
            </span>
          )}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Starter</h3>
              <p className="text-xs text-muted-foreground">Get started with digital signage</p>
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold text-foreground">$0</span>
            <span className="text-sm text-muted-foreground ml-1">forever</span>
          </div>
          <ul className="space-y-2">
            {FREE_FEATURES.map((f) => (
              <li key={f.name} className="flex items-center gap-2 text-sm">
                {f.free ? (
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                )}
                <span className={f.free ? "text-foreground" : "text-muted-foreground/50"}>{f.name}</span>
              </li>
            ))}
          </ul>
          {!isPro ? (
            <Button variant="secondary" className="w-full" disabled>Current Plan</Button>
          ) : (
            <Button variant="outline" className="w-full" onClick={handlePortal} disabled={portalLoading}>Downgrade</Button>
          )}
        </div>

        {/* Pro Card */}
        <div className={`rounded-2xl border p-6 space-y-4 backdrop-blur-xl transition-all relative ${
          isPro ? "border-cyan-400/40 ring-2 ring-cyan-400/30 shadow-[0_0_25px_rgba(34,211,238,0.1)] bg-white/5" : "border-cyan-400/20 bg-white/5"
        }`}>
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-cyan-400/15 text-cyan-400 px-2 py-0.5 rounded-full mb-2">
            {isPro ? "Your Plan" : "Recommended"}
          </span>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-cyan-400/10 flex items-center justify-center">
              <Crown className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Pro</h3>
              <p className="text-xs text-muted-foreground">For growing businesses — expandable screen packs</p>
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold text-foreground">$9</span>
            <span className="text-sm text-muted-foreground ml-1">/month</span>
          </div>
          <ul className="space-y-2">
            {FREE_FEATURES.map((f) => (
              <li key={f.name} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                <span className="text-foreground">{f.name}</span>
              </li>
            ))}
          </ul>
          {isPro ? (
            <Button variant="secondary" className="w-full" disabled>Current Plan</Button>
          ) : (
            <Button
              className="w-full bg-gradient-to-r from-[hsl(180,100%,32%)] to-[hsl(217,91%,60%)] hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] text-white border-0"
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Crown className="h-4 w-4 mr-2" />}
              Upgrade to Pro
            </Button>
          )}
        </div>

        {/* Enterprise Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4 backdrop-blur-xl transition-all">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-amber-400/15 text-amber-400 px-2 py-0.5 rounded-full mb-2">
            Enterprise
          </span>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-400/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Enterprise</h3>
              <p className="text-xs text-muted-foreground">For large-scale deployments</p>
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold text-foreground">Custom</span>
            <span className="text-sm text-muted-foreground ml-1">pricing</span>
          </div>
          <ul className="space-y-2">
            {[
              "Unlimited screens",
              "Dedicated account manager",
              "Custom SLA & uptime guarantee",
              "SSO & team management",
              "White-label options",
              "On-premise deployment",
              "API access & integrations",
              "24/7 priority support",
              "Custom training & onboarding",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-amber-400 flex-shrink-0" />
                <span className="text-foreground">{f}</span>
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            className="w-full border-amber-400/30 text-amber-400 hover:bg-amber-400/10 hover:border-amber-400/50"
            onClick={() => window.location.href = "/home#contact"}
          >
            <Building2 className="h-4 w-4 mr-2" /> Contact Sales
          </Button>
        </div>
      </div>

      {/* Secure Checkout Badge */}
      {!isPro && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
          <Shield className="h-3.5 w-3.5" />
          <span>256-bit SSL · Powered by Stripe</span>
        </div>
      )}

      {/* Enterprise CTA */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-cyan-400/10 flex items-center justify-center flex-shrink-0">
          <Building2 className="h-5 w-5 text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Have more than 10 locations?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Contact us for <span className="text-cyan-400 font-medium">Enterprise Glow</span> — custom pricing, dedicated support, and unlimited screens.{" "}
            <Link to="/home#contact" className="underline text-cyan-400/80 hover:text-cyan-400 transition-colors">
              Contact Us →
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes levelUpFlash {
          0% { opacity: 0; }
          15% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>;
}
