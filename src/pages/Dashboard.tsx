import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { isProTier } from "@/lib/subscription";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MonitorPreview } from "@/components/MonitorPreview";
import { Badge } from "@/components/ui/badge";
import { Monitor, ListVideo, BarChart3, CreditCard, Loader2, Terminal, Crown, Lock, Siren, Shield, ShieldCheck, ShieldAlert, Megaphone } from "lucide-react";
import { SystemHealth } from "@/components/SystemHealth";
import { PlaybackInsights } from "@/components/PlaybackInsights";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { PairSuccessModal } from "@/components/PairSuccessModal";
import { LiveRemoteDock } from "@/components/LiveRemoteDock";
import { ProGuard } from "@/components/ProGuard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pairingCode, setPairingCode] = useState("");
  const [screens, setScreens] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const subscriptionTier = useAuth().subscriptionTier;
  const [portalLoading, setPortalLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [newScreenName, setNewScreenName] = useState("");
  const [onlineFlash, setOnlineFlash] = useState(false);
  const [mediaCount, setMediaCount] = useState(0);
  const [broadcasts, setBroadcasts] = useState<{ id: string; message: string; broadcast_type: string; duration_seconds: number; created_at: string }[]>([]);
  const [broadcastsHasMore, setBroadcastsHasMore] = useState(false);
  const [broadcastsLoading, setBroadcastsLoading] = useState(false);
  const BROADCAST_PAGE_SIZE = 10;

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [s, p, m, b] = await Promise.all([
        supabase.from("screens").select("*").eq("user_id", user.id),
        supabase.from("playlists").select("*").eq("user_id", user.id),
        supabase.from("media").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("screen_broadcasts").select("id, message, broadcast_type, duration_seconds, created_at")
          .eq("target_user_id", user.id).order("created_at", { ascending: false }).limit(BROADCAST_PAGE_SIZE + 1),
      ]);
      if (s.data) setScreens(s.data);
      if (p.data) setPlaylists(p.data);
      setMediaCount(m.count ?? 0);
      if (b.data) {
        setBroadcastsHasMore(b.data.length > BROADCAST_PAGE_SIZE);
        setBroadcasts((b.data as any).slice(0, BROADCAST_PAGE_SIZE));
      }
    };
    fetchData();
  }, [user]);

  const triggerCelebration = useCallback((screenName?: string) => {
    setNewScreenName(screenName || "Your screen");
    setShowCelebration(true);
    setOnlineFlash(true);
    setTimeout(() => setOnlineFlash(false), 1500);
  }, []);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("dashboard-screens")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "screens", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newScreen = payload.new as any;
          setScreens((prev) => [...prev, newScreen]);
          triggerCelebration(newScreen.name);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "screens", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setScreens((prev) => prev.map((s) => (s.id === (payload.new as any).id ? payload.new : s)));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, triggerCelebration]);

  const handlePair = async () => {
    if (pairingCode.length !== 6) {
      toast.error("Please enter a 6-digit pairing code");
      return;
    }
    const { data: pairing, error: pairingErr } = await supabase
      .from("pairings")
      .select("id, screen_id, expires_at")
      .eq("pairing_code", pairingCode)
      .maybeSingle();

    if (pairingErr || !pairing) {
      toast.error("Invalid pairing code. Please try again.");
      setPairingCode("");
      return;
    }
    if (new Date(pairing.expires_at) < new Date()) {
      toast.error("This pairing code has expired. Generate a new one on the TV.");
      setPairingCode("");
      return;
    }

    if (pairing.screen_id) {
      // Legacy flow: screen already exists, just claim it
      const { error: claimErr } = await supabase
        .from("screens")
        .update({ user_id: user!.id, status: "online", pairing_code: null })
        .eq("id", pairing.screen_id);

      if (claimErr) {
        toast.error("Failed to pair screen. " + claimErr.message);
      } else {
        await supabase.from("pairings").delete().eq("id", pairing.id);
        triggerCelebration();
      }
    } else {
      // New flow: create screen and link to pairing
      const { data: newScreen, error: createErr } = await supabase
        .from("screens")
        .insert({ user_id: user!.id, name: "New Screen", status: "online" })
        .select("id, name")
        .single();

      if (createErr || !newScreen) {
        toast.error("Failed to create screen. " + (createErr?.message || ""));
      } else {
        // Update pairings record with screen_id so the Player can detect it
        await supabase.from("pairings").update({ screen_id: newScreen.id }).eq("id", pairing.id);
        triggerCelebration(newScreen.name);
      }
    }
    setPairingCode("");
  };

  const isScreenOnline = (s: any) => {
    if (!s.last_ping) return s.status === "online"; // just paired, no heartbeat yet
    return Date.now() - new Date(s.last_ping).getTime() < 90_000; // 90s heartbeat window
  };
  const onlineCount = screens.filter(isScreenOnline).length;
  const offlineCount = screens.length - onlineCount;
  const liveCount = screens.filter((s) => isScreenOnline(s) && s.current_playlist_id).length;
  const activeCount = screens.filter((s) => s.current_playlist_id).length;

  // Watchdog status: find the most recent heartbeat across all screens
  const watchdogStatus = useMemo(() => {
    if (screens.length === 0) return null;
    const pings = screens
      .filter((s: any) => s.last_ping)
      .map((s: any) => new Date(s.last_ping).getTime());
    const lastCheck = pings.length > 0 ? new Date(Math.max(...pings)) : null;
    const monitored = screens.length;
    const allHealthy = offlineCount === 0;
    return { lastCheck, monitored, allHealthy, offlineCount };
  }, [screens, offlineCount]);

  const loadMoreBroadcasts = async () => {
    if (!user || broadcastsLoading) return;
    setBroadcastsLoading(true);
    const { data } = await supabase
      .from("screen_broadcasts")
      .select("id, message, broadcast_type, duration_seconds, created_at")
      .eq("target_user_id", user.id)
      .order("created_at", { ascending: false })
      .range(broadcasts.length, broadcasts.length + BROADCAST_PAGE_SIZE);
    if (data) {
      setBroadcastsHasMore(data.length === BROADCAST_PAGE_SIZE + 1);
      setBroadcasts((prev) => [...prev, ...(data as any).slice(0, BROADCAST_PAGE_SIZE)]);
    }
    setBroadcastsLoading(false);
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-portal");
      if (error) throw error;
      if (data?.url) { window.location.href = data.url; }
    } catch (err: any) {
      toast.error(err.message || "Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in relative min-w-0">
      {/* Success Modal */}
      <PairSuccessModal open={showCelebration} onOpenChange={setShowCelebration} screenName={newScreenName} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-wide">Dashboard</h1>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mt-0.5">Command Center</p>
        </div>
        {subscriptionTier !== "free" && (
          <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={portalLoading} className="glass text-xs tracking-wider">
            {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <CreditCard className="h-3.5 w-3.5 mr-1.5" />}
            Billing
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 min-w-0">
        {/* Holographic Quick Pair Terminal */}
        <div className="glass glass-spotlight rounded-2xl p-5 sm:col-span-1 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-[11px] font-semibold text-muted-foreground tracking-[0.2em] uppercase">Quick Pair</h3>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="000000"
              value={pairingCode}
              onChange={(e) => setPairingCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              className="holo-input font-mono text-lg tracking-[0.3em] bg-transparent border-primary/15 rounded-xl h-11"
            />
            <Button
              onClick={handlePair}
              size="sm"
              className="neon-pulse-btn bg-gradient-to-r from-primary to-glow-blue text-primary-foreground rounded-xl h-11 px-5 font-semibold tracking-wider"
            >
              Pair
            </Button>
          </div>
          {/* Scan line effect */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>

        {/* Screens Status */}
        <div className="glass glass-spotlight rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-semibold text-muted-foreground tracking-[0.2em] uppercase">Screens</h3>
            {liveCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase" style={{ color: "hsl(0, 84%, 60%)" }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "hsl(0, 84%, 60%)" }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "hsl(0, 84%, 60%)" }} />
                </span>
                LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2.5 transition-all duration-500 ${onlineFlash ? "neon-online-flash" : ""}`}>
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 heartbeat-pulse" />
              </div>
              <span className={`text-2xl font-bold tabular-nums transition-all duration-500 ${onlineFlash ? "text-emerald-400" : "text-foreground"}`} style={onlineFlash ? { textShadow: "0 0 12px hsl(150, 100%, 50%)" } : {}}>{onlineCount}</span>
              <span className="text-[11px] text-muted-foreground tracking-wider uppercase">Online</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
              <span className="text-2xl font-bold text-foreground tabular-nums">{offlineCount}</span>
              <span className="text-[11px] text-muted-foreground tracking-wider uppercase">Offline</span>
            </div>
          </div>
          {/* Active screens count */}
          <div className={`mt-2 flex items-center gap-1.5 transition-all duration-700 ${onlineFlash ? "animate-scale-in" : ""}`}>
            <span className={`text-[10px] font-bold tracking-widest uppercase ${activeCount > 0 ? "text-emerald-400" : "text-muted-foreground/50"}`}
              style={activeCount > 0 && onlineFlash ? { textShadow: "0 0 10px hsl(150, 100%, 50%)" } : {}}>
              {activeCount} {activeCount === 1 ? "Screen" : "Screens"} Active
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />
        </div>

        {/* Playlists */}
        <div className="glass glass-spotlight rounded-2xl p-5 relative overflow-hidden">
          <h3 className="text-[11px] font-semibold text-muted-foreground tracking-[0.2em] uppercase mb-3">Playlists</h3>
          <div className="flex items-center gap-2.5">
            <ListVideo className="h-4 w-4 text-accent" />
            <span className="text-2xl font-bold text-foreground tabular-nums">{playlists.length}</span>
            <span className="text-[11px] text-muted-foreground tracking-wider uppercase">Total</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
        </div>
      </div>

      {/* Watchdog Status Indicator */}
      {watchdogStatus && (
        <div
          className="glass rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:border-primary/30 transition-colors min-w-0"
          onClick={() => navigate(watchdogStatus.allHealthy ? "/screens" : "/screens?filter=offline")}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter") navigate(watchdogStatus.allHealthy ? "/screens" : "/screens?filter=offline"); }}
          style={{
            borderColor: watchdogStatus.allHealthy
              ? "hsla(180, 100%, 32%, 0.15)"
              : "hsla(348, 100%, 50%, 0.2)",
          }}
        >
          <div className="flex items-center gap-2.5">
            {watchdogStatus.allHealthy ? (
              <ShieldCheck className="h-4 w-4" style={{ color: "hsl(180, 100%, 40%)" }} />
            ) : (
              <ShieldAlert className="h-4 w-4 badge-flicker" style={{ color: "hsl(348, 100%, 55%)" }} />
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-semibold tracking-wider uppercase truncate" style={{
                color: watchdogStatus.allHealthy ? "hsl(180, 100%, 40%)" : "hsl(348, 100%, 60%)",
              }}>
                {watchdogStatus.allHealthy ? "Watchdog — All Clear" : `Watchdog — ${watchdogStatus.offlineCount} Alert${watchdogStatus.offlineCount !== 1 ? "s" : ""}`}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                Monitoring {watchdogStatus.monitored} screen{watchdogStatus.monitored !== 1 ? "s" : ""}
                {watchdogStatus.lastCheck && (
                  <> · Last check {formatDistanceToNow(watchdogStatus.lastCheck, { addSuffix: true })}</>
                )}
                <span className="ml-1 text-primary/70">→ View</span>
              </span>
            </div>
          </div>
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: watchdogStatus.allHealthy ? "hsl(150, 70%, 50%)" : "hsl(348, 100%, 50%)",
              boxShadow: watchdogStatus.allHealthy
                ? "0 0 6px hsla(150, 70%, 50%, 0.5)"
                : "0 0 6px hsla(348, 100%, 50%, 0.5)",
              animation: watchdogStatus.allHealthy ? "none" : "badgeFlicker 3s ease-in-out infinite",
            }}
          />
        </div>
      )}

      {/* Billing Quick-Link */}
      <button
        onClick={() => navigate("/billing")}
        className="w-full glass glass-spotlight rounded-2xl p-5 relative overflow-hidden text-left group transition-all hover:border-primary/20 hover:shadow-[0_0_20px_hsl(var(--primary)/0.08)]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Billing</h3>
              <p className="text-[11px] text-muted-foreground tracking-wider">
                {isProTier(subscriptionTier) ? (
                  <span className="inline-flex items-center gap-1">
                    <Crown className="h-3 w-3 text-primary" /> Pro Plan Active
                  </span>
                ) : (
                  "Free Plan — Upgrade to unlock more"
                )}
              </p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
            Manage →
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </button>

      {/* Broadcast History */}
      {broadcasts.length > 0 && (
        <div className="glass glass-spotlight rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-[11px] font-semibold text-muted-foreground tracking-[0.2em] uppercase">Broadcast History</h3>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-auto">{broadcasts.length}</Badge>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {broadcasts.map((b) => (
              <div key={b.id} className="rounded-lg border border-border/50 bg-card/50 px-3 py-2 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {b.broadcast_type === "alert" ? "🚨" : b.broadcast_type === "warning" ? "⚠️" : "ℹ️"} {b.broadcast_type}
                  </Badge>
                  <span className="text-muted-foreground text-[10px] shrink-0">
                    {new Date(b.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-foreground leading-snug">{b.message}</p>
                <span className="text-muted-foreground/60 text-[10px]">{b.duration_seconds}s display</span>
              </div>
            ))}
          </div>
          {broadcastsHasMore && (
            <div className="pt-2 text-center">
              <Button variant="ghost" size="sm" onClick={loadMoreBroadcasts} disabled={broadcastsLoading} className="text-xs text-muted-foreground hover:text-foreground">
                {broadcastsLoading ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Loading...</> : "Load more"}
              </Button>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>
      )}

      {/* System Boot Sequence (Onboarding) */}
      <OnboardingChecklist screens={screens} playlists={playlists} mediaCount={mediaCount} />

      {/* System Health */}
      <SystemHealth />

      {/* Tabs: Preview / Insights */}
      <Tabs defaultValue={localStorage.getItem("glowhub_default_tab") || "preview"} onValueChange={(v) => {
        if (v === "insights" && !isProTier(subscriptionTier)) {
          toast("Upgrade to Pro to unlock Playback Insights", { action: { label: "Upgrade", onClick: () => navigate("/subscription") } });
          return;
        }
      }}>
        <TabsList className="glass rounded-xl p-1">
          <TabsTrigger value="preview" className="gap-1.5 rounded-lg text-xs tracking-wider data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Monitor className="h-3.5 w-3.5" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="insights" className={`gap-1.5 rounded-lg text-xs tracking-wider data-[state=active]:bg-primary/10 data-[state=active]:text-primary ${!isProTier(subscriptionTier) ? "opacity-60" : ""}`}>
            <BarChart3 className="h-3.5 w-3.5" />
            Insights
            {!isProTier(subscriptionTier) && <Lock className="h-3 w-3 ml-0.5 text-muted-foreground" />}
            {!isProTier(subscriptionTier) && <span className="pro-badge">PRO</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview">
          <div className="glass glass-spotlight rounded-2xl overflow-hidden p-5 mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground tracking-[0.2em] uppercase">
                <Monitor className="h-3.5 w-3.5" />
                Signage Preview
              </h3>
              {isProTier(subscriptionTier) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-[10px] tracking-wider font-semibold border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-1.5"
                  onClick={async () => {
                    const channel = supabase.channel("screen-alerts");
                    await channel.send({
                      type: "broadcast",
                      event: "flash-alert",
                      payload: { user_id: user!.id, triggered_at: new Date().toISOString() },
                    });
                    supabase.removeChannel(channel);
                    toast.success("⚡ Alert triggered on all screens");
                  }}
                >
                  <Siren className="h-3 w-3" />
                  Trigger Alert
                </Button>
              )}
            </div>
            <MonitorPreview />
          </div>
        </TabsContent>

        {isProTier(subscriptionTier) ? (
          <TabsContent value="insights" className="mt-3">
            <ProGuard featureName="Playback Insights" showUpgradePrompt>
              <PlaybackInsights />
            </ProGuard>
          </TabsContent>
        ) : (
          <TabsContent value="insights" className="mt-3">
            <div className="glass rounded-2xl p-8 text-center space-y-4" data-paywall="true">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Playback Insights requires Pro</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Upgrade to Pro to unlock playback analytics and insights.
              </p>
              <Button
                onClick={() => navigate("/billing")}
                className="bg-gradient-to-r from-primary to-glow-blue text-primary-foreground"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          </TabsContent>
        )}
      </Tabs>
      <LiveRemoteDock />
    </div>
  );
}
