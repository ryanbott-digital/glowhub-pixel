import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Activity, RefreshCw, Monitor } from "lucide-react";

interface Screen {
  id: string;
  name: string;
  status: string;
  last_ping: string | null;
  current_playlist_id: string | null;
}

function timeAgo(date: string | null): string {
  if (!date) return "Never";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function isOffline(lastPing: string | null): boolean {
  if (!lastPing) return true;
  return Date.now() - new Date(lastPing).getTime() > 5 * 60 * 1000;
}

export function SystemHealth() {
  const { user } = useAuth();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const fetchScreens = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("screens")
      .select("id, name, status, last_ping, current_playlist_id")
      .eq("user_id", user.id);
    if (data) setScreens(data);
  };

  useEffect(() => {
    fetchScreens();
    const interval = setInterval(fetchScreens, 15_000);
    return () => clearInterval(interval);
  }, [user]);

  const handleRemoteRefresh = async (screenId: string) => {
    setRefreshingId(screenId);
    const channel = supabase.channel(`remote-refresh-${screenId}`);
    await channel.subscribe();
    await channel.send({
      type: "broadcast",
      event: "remote-refresh",
      payload: {},
    });
    supabase.removeChannel(channel);
    toast.success("Remote refresh signal sent");
    setTimeout(() => setRefreshingId(null), 2000);
  };

  if (screens.length === 0) return null;

  const onlineScreens = screens.filter((s) => !isOffline(s.last_ping));
  const offlineScreens = screens.filter((s) => isOffline(s.last_ping));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Activity className="h-4 w-4" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {screens.map((screen) => {
            const offline = isOffline(screen.last_ping);
            return (
              <div
                key={screen.id}
                className="flex items-center justify-between rounded-lg border p-3 transition-all"
                style={{
                  borderColor: offline
                    ? "hsl(0, 70%, 50%)"
                    : "hsl(180, 100%, 40%)",
                  boxShadow: offline
                    ? "0 0 12px hsla(0, 70%, 50%, 0.25), inset 0 0 8px hsla(0, 70%, 50%, 0.06)"
                    : "0 0 12px hsla(180, 100%, 40%, 0.2), inset 0 0 8px hsla(180, 100%, 40%, 0.04)",
                }}
              >
                <div className="flex items-center gap-3">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{screen.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Last ping: {timeAgo(screen.last_ping)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={offline ? "destructive" : "default"}
                    className={
                      offline
                        ? "animate-pulse"
                        : "bg-primary/15 text-primary hover:bg-primary/20"
                    }
                  >
                    {offline ? "Offline" : "Online"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRemoteRefresh(screen.id)}
                    disabled={refreshingId === screen.id}
                    title="Remote Refresh"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${refreshingId === screen.id ? "animate-spin text-primary" : "text-muted-foreground"}`}
                    />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-primary" />
            {onlineScreens.length} online
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-destructive animate-pulse" />
            {offlineScreens.length} offline
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
