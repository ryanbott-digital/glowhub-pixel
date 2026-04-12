import { Heart, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import type { ScreenNodeData } from "./ScreenNode";

interface SyncGroup {
  id: string;
  name: string;
  screens: { id: string; screen_id: string; position: number }[];
}

interface SyncHealthPanelProps {
  nodes: ScreenNodeData[];
  syncGroups: SyncGroup[];
}

export function SyncHealthPanel({ nodes, syncGroups }: SyncHealthPanelProps) {
  const synced = nodes.filter(n => n.syncHealth === "synced" && n.groupId).length;
  const lagging = nodes.filter(n => n.syncHealth === "lagging").length;
  const offline = nodes.filter(n => n.syncHealth === "offline").length;
  const grouped = nodes.filter(n => n.groupId).length;

  return (
    <div className="absolute bottom-4 left-4 z-40 pointer-events-auto">
      <div className="glass rounded-xl px-4 py-3 backdrop-blur-xl border border-border/30 space-y-2 min-w-[180px]">
        <div className="flex items-center gap-2 mb-1">
          <Heart className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-primary">Sync Health</span>
        </div>

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

        <div className="border-t border-border/30 pt-1.5">
          <p className="text-[9px] text-muted-foreground tracking-wider">
            {syncGroups.length} group{syncGroups.length !== 1 ? "s" : ""} · {grouped} screen{grouped !== 1 ? "s" : ""} linked
          </p>
        </div>
      </div>
    </div>
  );
}
