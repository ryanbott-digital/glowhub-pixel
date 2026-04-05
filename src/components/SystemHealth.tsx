import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Activity, RefreshCw, Monitor, Camera, ExternalLink, ArrowUpCircle } from "lucide-react";

interface Screen {
  id: string;
  name: string;
  status: string;
  last_ping: string | null;
  current_playlist_id: string | null;
  last_screenshot_url?: string | null;
  current_media_id?: string | null;
}

interface MediaInfo {
  id: string;
  name: string;
  type: string;
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
  return Date.now() - new Date(lastPing).getTime() > 90_000;
}

/** Calculate uptime % from playback_logs: % of 5-min slots in last 24h with activity. */
async function calcUptime(screenId: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("playback_logs")
    .select("played_at")
    .eq("screen_id", screenId)
    .gte("played_at", since)
    .order("played_at");

  if (!data || data.length === 0) return 0;

  // Count distinct 5-min buckets with activity
  const buckets = new Set<number>();
  const slotMs = 5 * 60 * 1000;
  for (const row of data) {
    buckets.add(Math.floor(new Date(row.played_at).getTime() / slotMs));
  }
  const totalSlots = 24 * 12; // 288 five-minute slots in 24h
  return Math.min(100, Math.round((buckets.size / totalSlots) * 100));
}

export function SystemHealth() {
  const { user } = useAuth();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [mediaMap, setMediaMap] = useState<Record<string, MediaInfo>>({});
  const [uptimeMap, setUptimeMap] = useState<Record<string, number>>({});
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [screenshottingId, setScreenshottingId] = useState<string | null>(null);

  const fetchScreens = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("screens")
      .select("id, name, status, last_ping, current_playlist_id, last_screenshot_url, current_media_id")
      .eq("user_id", user.id);
    if (data) {
      setScreens(data as Screen[]);

      // Fetch current media names
      const mediaIds = data.map((s: any) => s.current_media_id).filter(Boolean);
      if (mediaIds.length > 0) {
        const { data: mediaData } = await supabase
          .from("media")
          .select("id, name, type")
          .in("id", mediaIds);
        if (mediaData) {
          const map: Record<string, MediaInfo> = {};
          mediaData.forEach((m: any) => { map[m.id] = m; });
          setMediaMap(map);
        }
      }

      // Calculate uptime for each screen
      const uptimes: Record<string, number> = {};
      await Promise.all(
        data.map(async (s: any) => {
          uptimes[s.id] = await calcUptime(s.id);
        })
      );
      setUptimeMap(uptimes);
    }
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

  const handleScreenshot = async (screenId: string) => {
    setScreenshottingId(screenId);
    const channel = supabase.channel(`screenshot-${screenId}`);
    await channel.subscribe();
    await channel.send({
      type: "broadcast",
      event: "take-screenshot",
      payload: {},
    });
    supabase.removeChannel(channel);
    toast.info("Screenshot requested — waiting for device…");
    // Poll for the screenshot to appear (max 10s)
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      const { data } = await supabase
        .from("screens")
        .select("last_screenshot_url")
        .eq("id", screenId)
        .single();
      const currentScreen = screens.find((s) => s.id === screenId);
      if (data?.last_screenshot_url && data.last_screenshot_url !== currentScreen?.last_screenshot_url) {
        clearInterval(poll);
        setScreenshottingId(null);
        toast.success("Screenshot captured!");
        fetchScreens();
      }
      if (attempts > 10) {
        clearInterval(poll);
        setScreenshottingId(null);
        toast.error("Screenshot timed out — device may be offline");
      }
    }, 1000);
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
            const currentMedia = screen.current_media_id ? mediaMap[screen.current_media_id] : null;
            return (
              <div key={screen.id} className="space-y-2">
                <div
                  className="flex items-center justify-between rounded-lg border p-3 transition-all"
                  style={{
                    borderColor: offline ? "hsl(0, 70%, 50%)" : "hsl(var(--primary))",
                    boxShadow: offline
                      ? "0 0 12px hsla(0, 70%, 50%, 0.25), inset 0 0 8px hsla(0, 70%, 50%, 0.06)"
                      : "0 0 12px hsl(var(--primary) / 0.2), inset 0 0 8px hsl(var(--primary) / 0.04)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{screen.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Last ping: {timeAgo(screen.last_ping)}
                        {currentMedia && (
                          <span className="ml-2">
                            · Playing: <span className="text-foreground/70">{currentMedia.name}</span>
                          </span>
                        )}
                      </p>
                      {/* Uptime metric */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <ArrowUpCircle className="h-3 w-3 text-muted-foreground" />
                        <Progress
                          value={uptimeMap[screen.id] ?? 0}
                          className="h-1.5 w-20"
                        />
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {uptimeMap[screen.id] ?? 0}% uptime
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">24h</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
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
                      onClick={() => handleScreenshot(screen.id)}
                      disabled={screenshottingId === screen.id || offline}
                      title="Take Screenshot"
                    >
                      <Camera
                        className={`h-4 w-4 ${screenshottingId === screen.id ? "animate-pulse text-primary" : "text-muted-foreground"}`}
                      />
                    </Button>
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

                {/* Screenshot preview */}
                {screen.last_screenshot_url && (
                  <div className="ml-7 flex items-center gap-2">
                    <a
                      href={screen.last_screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block w-32 aspect-video rounded-md overflow-hidden border border-border/50 hover:border-primary/40 transition-colors"
                    >
                      <img
                        src={screen.last_screenshot_url}
                        alt="Screen snapshot"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <ExternalLink className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </a>
                    <span className="text-xs text-muted-foreground">Latest snapshot</span>
                  </div>
                )}
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
