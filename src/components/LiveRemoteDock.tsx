import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Zap, Sparkles, AlertTriangle, ChevronUp, ChevronDown } from "lucide-react";

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

export function LiveRemoteDock() {
  const [expanded, setExpanded] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState<HypeType | null>(null);
  const cooldownRef = useRef(false);

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
    }, 12000); // cooldown matches takeover duration + buffer
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Collapsed trigger */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--glow-pink))] flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        style={{
          boxShadow: "0 0 20px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--glow-pink) / 0.3)",
        }}
      >
        {expanded ? (
          <ChevronDown className="w-6 h-6 text-white" />
        ) : (
          <Zap className="w-6 h-6 text-white" />
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
