import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Zap, Sparkles, AlertTriangle, ChevronDown } from "lucide-react";

type HypeType = "mega-deal" | "showtime" | "alert";

const HYPE_BUTTONS: { type: HypeType; label: string; icon: typeof Zap; colorClass: string; glowColor: string }[] = [
  {
    type: "mega-deal",
    label: "MEGA DEAL",
    icon: Sparkles,
    colorClass: "from-[hsl(330,80%,60%)] to-[hsl(340,90%,50%)]",
    glowColor: "hsl(330,80%,60%)",
  },
  {
    type: "showtime",
    label: "SHOWTIME",
    icon: Zap,
    colorClass: "from-[hsl(var(--primary))] to-[hsl(180,100%,45%)]",
    glowColor: "hsl(var(--primary))",
  },
  {
    type: "alert",
    label: "ALERT",
    icon: AlertTriangle,
    colorClass: "from-[hsl(var(--destructive))] to-[hsl(15,90%,50%)]",
    glowColor: "hsl(var(--destructive))",
  },
];

const STORAGE_KEY = "glowhub_fab_position";

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export function LiveRemoteDock() {
  const [expanded, setExpanded] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState<HypeType | null>(null);
  const cooldownRef = useRef(false);

  // Draggable state — stored as bottom/right to stay anchored
  const [pos, setPos] = useState<{ bottom: number; right: number }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { bottom: 24, right: 24 };
  });

  const dragging = useRef(false);
  const dragMoved = useRef(false);
  const startTouch = useRef<{ x: number; y: number; bottom: number; right: number } | null>(null);
  const fabRef = useRef<HTMLDivElement>(null);

  // Save position on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  }, [pos]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    dragMoved.current = false;
    startTouch.current = {
      x: e.clientX,
      y: e.clientY,
      bottom: pos.bottom,
      right: pos.right,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !startTouch.current) return;

    const dx = e.clientX - startTouch.current.x;
    const dy = e.clientY - startTouch.current.y;

    // Only start treating as drag after 5px movement
    if (!dragMoved.current && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
    dragMoved.current = true;

    const fabSize = 56;
    const maxRight = window.innerWidth - fabSize;
    const maxBottom = window.innerHeight - fabSize;

    setPos({
      right: clamp(startTouch.current.right - dx, 8, maxRight),
      bottom: clamp(startTouch.current.bottom + dy, 8, maxBottom),
    });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    dragging.current = false;
    startTouch.current = null;
    // Only toggle expanded if it wasn't a drag
    if (!dragMoved.current) {
      setExpanded((v) => !v);
    }
  }, []);

  const triggerHype = async (type: HypeType) => {
    if (cooldownRef.current) {
      toast.info("Cooldown active — wait a moment");
      return;
    }

    cooldownRef.current = true;
    setSending(type);

    try {
      const channel = supabase.channel("screen-alerts");
      await channel.subscribe();
      await channel.send({
        type: "broadcast",
        event: "hype-takeover",
        payload: {
          type,
          message: customMessage.trim() || null,
          duration: 10000,
          triggered_at: new Date().toISOString(),
        },
      });
      supabase.removeChannel(channel);

      toast.success(`${type.toUpperCase().replace("-", " ")} triggered on all screens!`);
    } catch (err) {
      toast.error("Failed to send trigger");
    }

    setSending(null);
    setTimeout(() => {
      cooldownRef.current = false;
    }, 12000);
  };

  return (
    <div
      ref={fabRef}
      className="fixed z-50"
      style={{
        bottom: `${pos.bottom}px`,
        right: `${pos.right}px`,
      }}
    >
      {/* Draggable FAB button */}
      <button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--glow-pink))] flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform touch-none select-none"
        style={{
          boxShadow: "0 0 20px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--glow-pink) / 0.3)",
          cursor: dragging.current ? "grabbing" : "grab",
        }}
      >
        {expanded ? (
          <ChevronDown className="w-6 h-6 text-white pointer-events-none" />
        ) : (
          <Zap className="w-6 h-6 text-white pointer-events-none" />
        )}
      </button>

      {/* Expanded dock */}
      {expanded && (
        <div
          className="absolute bottom-16 right-0 w-72 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl p-4 space-y-3 shadow-2xl"
          style={{
            animation: "fade-in 0.2s ease-out",
            boxShadow: "0 0 30px hsl(var(--primary) / 0.15)",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold tracking-widest uppercase text-primary">Live Remote</span>
          </div>

          {/* Custom message input */}
          <Input
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Custom message (optional)"
            className="text-sm h-9 bg-muted/50 border-border/30"
            maxLength={80}
          />

          {/* Trigger buttons */}
          <div className="space-y-2">
            {HYPE_BUTTONS.map((btn) => {
              const Icon = btn.icon;
              const isActive = sending === btn.type;
              return (
                <button
                  key={btn.type}
                  onClick={() => triggerHype(btn.type)}
                  disabled={!!sending}
                  className={`w-full h-12 rounded-xl bg-gradient-to-r ${btn.colorClass} text-white font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{
                    boxShadow: `0 0 15px ${btn.glowColor}40, 0 0 30px ${btn.glowColor}20`,
                    animation: isActive ? "none" : `hypeButtonPulse_${btn.type} 2s ease-in-out infinite`,
                  }}
                >
                  <Icon className="w-5 h-5" />
                  {isActive ? "Sending…" : btn.label}
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            Triggers a 10s takeover on all connected screens
          </p>
        </div>
      )}

      <style>{`
        @keyframes hypeButtonPulse_mega-deal {
          0%, 100% { box-shadow: 0 0 15px hsl(330 80% 60% / 0.4), 0 0 30px hsl(330 80% 60% / 0.2); }
          50% { box-shadow: 0 0 25px hsl(330 80% 60% / 0.6), 0 0 50px hsl(330 80% 60% / 0.3); }
        }
        @keyframes hypeButtonPulse_showtime {
          0%, 100% { box-shadow: 0 0 15px hsl(180 100% 32% / 0.4), 0 0 30px hsl(180 100% 32% / 0.2); }
          50% { box-shadow: 0 0 25px hsl(180 100% 32% / 0.6), 0 0 50px hsl(180 100% 32% / 0.3); }
        }
        @keyframes hypeButtonPulse_alert {
          0%, 100% { box-shadow: 0 0 15px hsl(0 84% 60% / 0.4), 0 0 30px hsl(0 84% 60% / 0.2); }
          50% { box-shadow: 0 0 25px hsl(0 84% 60% / 0.6), 0 0 50px hsl(0 84% 60% / 0.3); }
        }
      `}</style>
    </div>
  );
}
