import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MonitorPreview } from "@/components/MonitorPreview";
import { Monitor, Wifi, WifiOff, ListVideo } from "lucide-react";
import { SystemHealth } from "@/components/SystemHealth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Dashboard() {
  const { user } = useAuth();
  const [pairingCode, setPairingCode] = useState("");
  const [screens, setScreens] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [s, p] = await Promise.all([
        supabase.from("screens").select("*").eq("user_id", user.id),
        supabase.from("playlists").select("*").eq("user_id", user.id),
      ]);
      if (s.data) setScreens(s.data);
      if (p.data) setPlaylists(p.data);
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

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Quick Pair */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quick Pair</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="6-digit code"
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="font-mono text-lg tracking-widest"
              />
              <Button onClick={handlePair} size="sm">
                Pair
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Screen Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Screens</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Playlists */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Playlists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ListVideo className="h-4 w-4 text-accent" />
              <span className="text-2xl font-bold text-foreground">{playlists.length}</span>
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <SystemHealth />

      {/* Monitor Preview */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Monitor className="h-4 w-4" />
            Signage Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MonitorPreview />
        </CardContent>
      </Card>
    </div>
  );
}
