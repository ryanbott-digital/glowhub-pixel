import { Monitor, Heart, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface ScreenNodeData {
  id: string;
  name: string;
  status: string;
  syncHealth: "synced" | "lagging" | "offline";
  groupId: string | null;
  groupName: string | null;
  position: { x: number; y: number };
  lastPing: string | null;
}

interface ScreenNodeProps {
  data: ScreenNodeData;
  isDragging: boolean;
  isSelected: boolean;
  onDragStart: (e: React.MouseEvent) => void;
  width: number;
  height: number;
}

const HEALTH_STYLES = {
  synced: {
    border: "hsla(160, 100%, 40%, 0.6)",
    glow: "0 0 20px hsla(160, 100%, 40%, 0.3), 0 0 40px hsla(160, 100%, 40%, 0.1)",
    dot: "bg-emerald-400",
    label: "IN SYNC",
    labelColor: "text-emerald-400",
    animation: "",
  },
  lagging: {
    border: "hsla(45, 100%, 50%, 0.6)",
    glow: "0 0 20px hsla(45, 100%, 50%, 0.3), 0 0 40px hsla(45, 100%, 50%, 0.1)",
    dot: "bg-amber-400",
    label: "LAGGING",
    labelColor: "text-amber-400",
    animation: "syncNodeLag 2s ease-in-out infinite",
  },
  offline: {
    border: "hsla(0, 100%, 50%, 0.4)",
    glow: "0 0 15px hsla(0, 100%, 50%, 0.2), 0 0 30px hsla(0, 100%, 50%, 0.1)",
    dot: "bg-red-500",
    label: "OFFLINE",
    labelColor: "text-red-400",
    animation: "syncNodeOffline 3s ease-in-out infinite",
  },
};

export function ScreenNode({ data, isDragging, isSelected, onDragStart, width, height }: ScreenNodeProps) {
  const health = HEALTH_STYLES[data.syncHealth];

  return (
    <div
      className="absolute select-none"
      style={{
        left: data.position.x,
        top: data.position.y,
        width,
        height,
        zIndex: isDragging ? 50 : 10,
        opacity: isDragging ? 0.85 : 1,
        transition: isDragging ? "none" : "box-shadow 0.3s",
      }}
      onMouseDown={onDragStart}
    >
      <div
        className="w-full h-full rounded-xl overflow-hidden relative cursor-grab active:cursor-grabbing"
        style={{
          background: "hsla(var(--card), 0.9)",
          backdropFilter: "blur(16px)",
          border: `2px solid ${health.border}`,
          boxShadow: `${health.glow}${isSelected ? ", 0 0 30px hsla(180, 100%, 32%, 0.4)" : ""}`,
          animation: health.animation || undefined,
        }}
      >
        {/* Scanline effect */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsla(180, 100%, 32%, 0.5) 2px, hsla(180, 100%, 32%, 0.5) 4px)",
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between p-3 pb-2 relative z-10">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Monitor className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{data.name}</p>
              {data.groupName && (
                <p className="text-[9px] text-muted-foreground tracking-widest uppercase truncate">{data.groupName}</p>
              )}
            </div>
          </div>
          {data.syncHealth === "synced" && data.groupId && (
            <Heart className="h-3.5 w-3.5 text-primary animate-pulse shrink-0" />
          )}
        </div>

        {/* Simulated screen */}
        <div className="mx-3 rounded-md overflow-hidden border border-border/30 relative" style={{ height: "60px" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center">
            <div className="flex items-center gap-2">
              {data.syncHealth === "synced" ? (
                <Wifi className="h-4 w-4 text-emerald-400/60" />
              ) : data.syncHealth === "lagging" ? (
                <AlertTriangle className="h-4 w-4 text-amber-400/60" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-400/60" />
              )}
              <span className="text-[9px] font-mono text-muted-foreground/60 tracking-wider">
                {data.status === "online" ? "RECEIVING SIGNAL" : "NO SIGNAL"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 pt-2 pb-2 relative z-10">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${health.dot}`} />
            <span className={`text-[10px] font-bold tracking-widest ${health.labelColor}`}>
              {health.label}
            </span>
          </div>
          {data.lastPing && (
            <span className="text-[9px] text-muted-foreground">
              {formatDistanceToNow(new Date(data.lastPing), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
