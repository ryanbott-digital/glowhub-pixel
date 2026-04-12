import { useState, useEffect, useRef } from "react";
import { Heart, Wifi, WifiOff, AlertTriangle, Crown, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ScreenNodeData } from "./ScreenNode";

interface SyncGroup {
  id: string;
  name: string;
  screens: { id: string; screen_id: string; position: number }[];
}

interface DriftEntry {
  screenId: string;
  driftMs: number;
  lastUpdate: number;
}

interface MasterInfo {
  groupId: string;
  screenId: string | null;
  lastTick: number;
}

interface SyncHealthPanelProps {
  nodes: ScreenNodeData[];
  syncGroups: SyncGroup[];
  screens?: { id: string; name: string }[];
}

export function SyncHealthPanel({ nodes, syncGroups, screens = [] }: SyncHealthPanelProps) {
  const synced = nodes.filter(n => n.syncHealth === "synced" && n.groupId).length;
  const lagging = nodes.filter(n => n.syncHealth === "lagging").length;
  const offline = nodes.filter(n => n.syncHealth === "offline").length;
  const grouped = nodes.filter(n => n.groupId).length;

  // Live drift tracking from realtime channels
  const [masters, setMasters] = useState<Record<string, MasterInfo>>({});
  const [drifts, setDrifts] = useState<Record<string, DriftEntry>>({});
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);

  const getScreenName = (screenId: string) => {
    const screen = screens.find(s => s.id === screenId);
    if (screen) return screen.name;
    const node = nodes.find(n => n.id === screenId);
    return node?.name || screenId.slice(0, 8);
  };

  useEffect(() => {
    // Clean up old channels
    channelsRef.current.forEach(ch => supabase.removeChannel(ch));
    channelsRef.current = [];

    if (syncGroups.length === 0) return;

    syncGroups.forEach(group => {
      const channelName = `sync-heartbeat-${group.id}`;
      const channel = supabase
        .channel(`dashboard-${channelName}`)
        .on("broadcast", { event: "sync-tick" }, ({ payload }) => {
          // The screen broadcasting ticks is the master
          // We identify the master by the fact it's the one sending sync-tick
          // The payload has { t, index, ts } — ts is the master's Date.now()
          setMasters(prev => ({
            ...prev,
            [group.id]: {
              groupId: group.id,
              screenId: null, // We can't directly know the screen_id from sync-tick
              lastTick: Date.now(),
            },
          }));
        })
        .on("broadcast", { event: "sync-drift" }, ({ payload }) => {
          const { screen_id, drift_ms } = payload as { screen_id: string; drift_ms: number; ts: number };
          if (!screen_id) return;
          setDrifts(prev => ({
            ...prev,
            [screen_id]: { screenId: screen_id, driftMs: drift_ms, lastUpdate: Date.now() },
          }));

          // If we see a drift report, the sender is a follower — deduce master
          setMasters(prev => {
            const current = prev[group.id];
            if (!current) return prev;
            // The master is the screen NOT sending drift reports
            // Find screens in this group that haven't sent drift
            return prev;
          });
        })
        .subscribe();

      channelsRef.current.push(channel);
    });

    return () => {
      channelsRef.current.forEach(ch => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [syncGroups]);

  // Determine master per group: the screen in the group that is NOT reporting drift (i.e., not a follower)
  const getMasterForGroup = (group: SyncGroup): string | null => {
    const groupScreenIds = group.screens.map(s => s.screen_id);
    const followerIds = new Set(
      Object.values(drifts)
        .filter(d => groupScreenIds.includes(d.screenId) && Date.now() - d.lastUpdate < 10_000)
        .map(d => d.screenId)
    );
    // Master is the online screen NOT in the follower set
    const masterCandidates = groupScreenIds.filter(id => {
      const node = nodes.find(n => n.id === id);
      return node && node.syncHealth !== "offline" && !followerIds.has(id);
    });
    return masterCandidates[0] || null;
  };

  // Check if any group has live data
  const hasLiveData = Object.keys(drifts).length > 0 || Object.keys(masters).length > 0;

  return (
    <div className="absolute bottom-4 left-4 z-40 pointer-events-auto">
      <div className="glass rounded-xl px-4 py-3 backdrop-blur-xl border border-border/30 space-y-2 min-w-[220px] max-w-[300px]">
        <div className="flex items-center gap-2 mb-1">
          <Heart className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-primary">Sync Health</span>
        </div>

        {/* Summary counts */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Wifi className="h-3 w-3 text-emerald-400" />
              <span className="text-muted-foreground">In Sync</span>
            </div>
            <span className="font-mono font-bold text-emerald-400">{synced}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 text-amber-400" />
              <span className="text-muted-foreground">Lagging</span>
            </div>
            <span className="font-mono font-bold text-amber-400">{lagging}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <WifiOff className="h-3 w-3 text-red-400" />
              <span className="text-muted-foreground">Offline</span>
            </div>
            <span className="font-mono font-bold text-red-400">{offline}</span>
          </div>
        </div>

        {/* Per-group live drift section */}
        {syncGroups.length > 0 && (
          <div className="border-t border-border/30 pt-2 space-y-2">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-primary" />
              <span className="text-[9px] font-bold tracking-widest uppercase text-primary/70">Live Drift</span>
              {!hasLiveData && (
                <span className="text-[8px] text-muted-foreground/50 ml-auto">waiting…</span>
              )}
            </div>

            {syncGroups.map(group => {
              const masterId = getMasterForGroup(group);
              const groupScreenIds = group.screens.map(s => s.screen_id);
              const followerDrifts = Object.values(drifts)
                .filter(d => groupScreenIds.includes(d.screenId) && Date.now() - d.lastUpdate < 10_000);

              if (groupScreenIds.length === 0) return null;

              return (
                <div key={group.id} className="space-y-1">
                  <p className="text-[9px] text-muted-foreground tracking-wider truncate">{group.name}</p>

                  {groupScreenIds.map(screenId => {
                    const isMaster = screenId === masterId;
                    const drift = drifts[screenId];
                    const node = nodes.find(n => n.id === screenId);
                    const isOnline = node && node.syncHealth !== "offline";
                    const driftVal = drift && Date.now() - drift.lastUpdate < 10_000 ? drift.driftMs : null;
                    const absDrift = driftVal !== null ? Math.abs(driftVal) : null;

                    return (
                      <div key={screenId} className="flex items-center gap-1.5 text-[10px]">
                        {/* Role badge */}
                        {isMaster ? (
                          <Crown className="h-3 w-3 text-amber-400 shrink-0" />
                        ) : (
                          <div
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              background: !isOnline
                                ? "hsl(var(--muted-foreground))"
                                : absDrift === null
                                  ? "hsl(var(--muted-foreground))"
                                  : absDrift <= 50
                                    ? "#10b981"
                                    : absDrift <= 500
                                      ? "#f59e0b"
                                      : "#ef4444",
                            }}
                          />
                        )}

                        {/* Screen name */}
                        <span className="text-muted-foreground truncate min-w-0 flex-1">
                          {getScreenName(screenId)}
                        </span>

                        {/* Status / drift value */}
                        {isMaster ? (
                          <span className="text-[9px] font-bold tracking-wider text-amber-400 shrink-0">
                            MASTER
                          </span>
                        ) : !isOnline ? (
                          <span className="text-[9px] text-muted-foreground/50 shrink-0">offline</span>
                        ) : driftVal !== null ? (
                          <span
                            className="font-mono font-bold tabular-nums shrink-0"
                            style={{
                              color: absDrift! <= 50 ? "#10b981" : absDrift! <= 500 ? "#f59e0b" : "#ef4444",
                            }}
                          >
                            {driftVal > 0 ? "+" : ""}{driftVal}ms
                          </span>
                        ) : (
                          <span className="text-[9px] text-muted-foreground/50 shrink-0">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        <div className="border-t border-border/30 pt-1.5">
          <p className="text-[9px] text-muted-foreground tracking-wider">
            {syncGroups.length} group{syncGroups.length !== 1 ? "s" : ""} · {grouped} screen{grouped !== 1 ? "s" : ""} linked
          </p>
        </div>
      </div>
    </div>
  );
}
