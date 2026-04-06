import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MonitorPreview } from "@/components/MonitorPreview";
import { Monitor, Wifi, WifiOff, ListVideo, BarChart3, CreditCard, Loader2, Rocket, PartyPopper, Terminal } from "lucide-react";
import { SystemHealth } from "@/components/SystemHealth";
import { PlaybackInsights } from "@/components/PlaybackInsights";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pairingCode, setPairingCode] = useState("");
  const [screens, setScreens] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [subscriptionTier, setSubscriptionTier] = useState("free");
  const [portalLoading, setPortalLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [newScreenName, setNewScreenName] = useState("");
  const [mediaCount, setMediaCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [s, p, prof, m] = await Promise.all([
        supabase.from("screens").select("*").eq("user_id", user.id),
        supabase.from("playlists").select("*").eq("user_id", user.id),
        supabase.from("profiles").select("subscription_tier").eq("id", user.id).single(),
        supabase.from("media").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      if (s.data) setScreens(s.data);
      if (p.data) setPlaylists(p.data);
      if (prof.data) setSubscriptionTier(prof.data.subscription_tier);
      setMediaCount(m.count ?? 0);
    };
    fetchData();
  }, [user]);

  const playCelebrationSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.5);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.5);
      });
    } catch {}
  }, []);

  const triggerCelebration = useCallback((screenName?: string) => {
    setNewScreenName(screenName || "Your screen");
    const showConfetti = localStorage.getItem("glowhub_pair_confetti") !== "false";
    const playSound = localStorage.getItem("glowhub_pair_sound") !== "false";
    if (showConfetti) setConfettiActive(true);
    setShowCelebration(true);
    if (playSound) playCelebrationSound();
    if (showConfetti) setTimeout(() => setConfettiActive(false), 4000);
  }, [playCelebrationSound]);

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
    if (!pairing.screen_id) {
      toast.error("No screen associated with this code.");
      setPairingCode("");
      return;
    }
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
    setPairingCode("");
  };

  const onlineCount = screens.filter((s) => s.status === "online").length;
  const offlineCount = screens.filter((s) => s.status === "offline").length;

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
    <div className="space-y-5 animate-fade-in relative">
      {/* Confetti burst */}
      {confettiActive && (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-sm"
              style={{
                width: `${Math.random() * 8 + 4}px`,
                height: `${Math.random() * 12 + 6}px`,
                left: `${Math.random() * 100}%`,
                top: "-5%",
                background: [
                  "hsl(180, 100%, 45%)",
                  "hsl(220, 80%, 55%)",
                  "hsl(280, 80%, 60%)",
                  "hsl(45, 100%, 60%)",
                  "hsl(330, 80%, 60%)",
                  "hsl(150, 70%, 50%)",
                ][i % 6],
                animation: `confettiFall ${2 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
          <style>{`
            @keyframes confettiFall {
              0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg) scale(0.5); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* Celebration Modal */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="glass-strong border-primary/20 sm:max-w-md text-center">
          <DialogHeader className="items-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: "hsla(180, 100%, 45%, 0.08)",
                backdropFilter: "blur(20px)",
                border: "1px solid hsla(180, 100%, 45%, 0.2)",
                boxShadow: "0 0 30px hsla(180, 100%, 45%, 0.15), 0 0 60px hsla(180, 100%, 45%, 0.08)",
                animation: "celebPulse 2s ease-in-out infinite",
              }}
            >
              <PartyPopper className="h-10 w-10 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground tracking-wide">
              Your screen is now Glowing! 🚀
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-base mt-2">
              <span className="font-medium text-foreground">{newScreenName}</span> has been successfully paired and is ready to display content.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={() => { setShowCelebration(false); navigate("/playlists"); }}
              className="bg-gradient-to-r from-primary to-glow-blue text-primary-foreground magnetic-btn w-full gap-2"
            >
              <Rocket className="h-4 w-4" />
              Create your first Playlist
            </Button>
            <Button variant="ghost" onClick={() => setShowCelebration(false)} className="text-muted-foreground">
              I'll do this later
            </Button>
          </div>
          <style>{`
            @keyframes celebPulse {
              0%, 100% { box-shadow: 0 0 30px hsla(180,100%,45%,0.15), 0 0 60px hsla(180,100%,45%,0.08); }
              50% { box-shadow: 0 0 40px hsla(180,100%,45%,0.3), 0 0 80px hsla(180,100%,45%,0.15); }
            }
          `}</style>
        </DialogContent>
      </Dialog>

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
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
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
          <h3 className="text-[11px] font-semibold text-muted-foreground tracking-[0.2em] uppercase mb-3">Screens</h3>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 heartbeat-pulse" />
              </div>
              <span className="text-2xl font-bold text-foreground tabular-nums">{onlineCount}</span>
              <span className="text-[11px] text-muted-foreground tracking-wider uppercase">Online</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
              <span className="text-2xl font-bold text-foreground tabular-nums">{offlineCount}</span>
              <span className="text-[11px] text-muted-foreground tracking-wider uppercase">Offline</span>
            </div>
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

      {/* System Boot Sequence (Onboarding) */}
      <OnboardingChecklist screens={screens} playlists={playlists} mediaCount={mediaCount} />

      {/* System Health */}
      <SystemHealth />

      {/* Tabs: Preview / Insights */}
      <Tabs defaultValue="preview">
        <TabsList className="glass rounded-xl p-1">
          <TabsTrigger value="preview" className="gap-1.5 rounded-lg text-xs tracking-wider data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Monitor className="h-3.5 w-3.5" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5 rounded-lg text-xs tracking-wider data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <BarChart3 className="h-3.5 w-3.5" />
            Insights
            <span className="pro-badge">PRO</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview">
          <div className="glass glass-spotlight rounded-2xl overflow-hidden p-5 mt-3">
            <h3 className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground tracking-[0.2em] uppercase mb-4">
              <Monitor className="h-3.5 w-3.5" />
              Signage Preview
            </h3>
            <MonitorPreview />
          </div>
        </TabsContent>

        <TabsContent value="insights" className="mt-3">
          <PlaybackInsights />
        </TabsContent>
      </Tabs>
    </div>
  );
}
