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

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [s, p, prof] = await Promise.all([
        supabase.from("screens").select("*").eq("user_id", user.id),
        supabase.from("playlists").select("*").eq("user_id", user.id),
        supabase.from("profiles").select("subscription_tier").eq("id", user.id).single(),
      ]);
      if (s.data) setScreens(s.data);
      if (p.data) setPlaylists(p.data);
      if (prof.data) setSubscriptionTier(prof.data.subscription_tier);
    };
    fetchData();
  }, [user]);

  const handlePair = async () => {
    if (pairingCode.length !== 6) {
      toast.error("Please enter a 6-digit pairing code");
      return;
    }
    toast.info("Pairing feature coming soon!");
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
    <div className="space-y-6 animate-fade-in">
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
