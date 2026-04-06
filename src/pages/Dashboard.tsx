import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MonitorPreview } from "@/components/MonitorPreview";
import { Monitor, Wifi, WifiOff, ListVideo, BarChart3, CreditCard, Loader2, Rocket, PartyPopper } from "lucide-react";
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
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
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
    setConfettiActive(true);
    setShowCelebration(true);
    playCelebrationSound();
    setTimeout(() => setConfettiActive(false), 4000);
  }, [playCelebrationSound]);

  // Realtime: listen for new screens being paired to this user
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
    // Attempt to claim the pairing code
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
    // Claim the screen
    const { error: claimErr } = await supabase
      .from("screens")
      .update({ user_id: user!.id, status: "online", pairing_code: null })
      .eq("id", pairing.screen_id);

    if (claimErr) {
      toast.error("Failed to pair screen. " + claimErr.message);
    } else {
      // Delete used pairing
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
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
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
                  "hsl(var(--primary))",
                  "hsl(var(--accent))",
                  "hsl(180, 100%, 45%)",
                  "hsl(280, 80%, 60%)",
                  "hsl(45, 100%, 60%)",
                  "hsl(330, 80%, 60%)",
                ][i % 6],
                animation: `confettiFall ${2 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
          <style>{`
            @keyframes confettiFall {
              0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
              100% { transform: translateY(100vh) rotate(${720}deg) scale(0.5); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* Celebration Modal */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="glass border-primary/20 sm:max-w-md text-center">
          <DialogHeader className="items-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: "rgba(0,163,163,0.1)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(0,163,163,0.3)",
                boxShadow: "0 0 30px rgba(0,163,163,0.2), 0 0 60px rgba(0,163,163,0.1)",
                animation: "celebPulse 2s ease-in-out infinite",
              }}
            >
              <PartyPopper className="h-10 w-10 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground">
              Your screen is now Glowing! 🚀
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-base mt-2">
              <span className="font-medium text-foreground">{newScreenName}</span> has been successfully paired and is ready to display content.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={() => {
                setShowCelebration(false);
                navigate("/playlists");
              }}
              className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--glow-blue))] text-primary-foreground magnetic-btn w-full gap-2"
            >
              <Rocket className="h-4 w-4" />
              Create your first Playlist
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowCelebration(false)}
              className="text-muted-foreground"
            >
              I'll do this later
            </Button>
          </div>
          <style>{`
            @keyframes celebPulse {
              0%, 100% { box-shadow: 0 0 30px rgba(0,163,163,0.2), 0 0 60px rgba(0,163,163,0.1); }
              50% { box-shadow: 0 0 40px rgba(0,163,163,0.35), 0 0 80px rgba(0,163,163,0.2); }
            }
          `}</style>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
        {subscriptionTier !== "free" && (
          <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={portalLoading} className="glass">
            {portalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
            Manage Subscription
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Quick Pair */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Pair</h3>
          <div className="flex gap-2">
            <Input
              placeholder="6-digit code"
              value={pairingCode}
              onChange={(e) => setPairingCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              className="font-mono text-lg tracking-widest glow-focus"
            />
            <Button onClick={handlePair} size="sm" className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--glow-blue))] text-primary-foreground magnetic-btn">
              Pair
            </Button>
          </div>
        </div>

        {/* Screen Status */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Screens</h3>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold text-foreground">{onlineCount}</span>
              <span className="text-sm text-muted-foreground">Online</span>
            </div>
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold text-foreground">{offlineCount}</span>
              <span className="text-sm text-muted-foreground">Offline</span>
            </div>
          </div>
        </div>

        {/* Playlists */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Playlists</h3>
          <div className="flex items-center gap-2">
            <ListVideo className="h-4 w-4 text-accent" />
            <span className="text-2xl font-bold text-foreground">{playlists.length}</span>
            <span className="text-sm text-muted-foreground">Total</span>
          </div>
        </div>
      </div>

      {/* Onboarding Checklist */}
      <OnboardingChecklist screens={screens} playlists={playlists} mediaCount={mediaCount} />

      {/* System Health */}
      <SystemHealth />

      {/* Tabs: Preview / Insights */}
      <Tabs defaultValue="preview">
        <TabsList className="glass">
          <TabsTrigger value="preview" className="gap-1.5">
            <Monitor className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Insights
            <span className="pro-badge">PRO</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview">
          <div className="glass rounded-2xl overflow-hidden p-5">
            <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
              <Monitor className="h-4 w-4" />
              Signage Preview
            </h3>
            <MonitorPreview />
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <PlaybackInsights />
        </TabsContent>
      </Tabs>
    </div>
  );
}
