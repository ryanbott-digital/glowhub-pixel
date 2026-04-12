import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Zap, AlertTriangle } from "lucide-react";

type HypeType = "mega-deal" | "showtime" | "alert";

interface HypePayload {
  type: HypeType;
  message: string | null;
  duration: number;
  triggered_at: string;
}

const TYPE_CONFIG: Record<HypeType, {
  bg: string;
  textColor: string;
  icon: typeof Zap;
  defaultText: string;
  scanColor: string;
}> = {
  "mega-deal": {
    bg: "radial-gradient(ellipse at center, hsl(330 80% 15%) 0%, hsl(330 90% 5%) 70%, #000 100%)",
    textColor: "hsl(330, 80%, 65%)",
    icon: Sparkles,
    defaultText: "MEGA DEAL",
    scanColor: "hsl(330, 80%, 60%)",
  },
  showtime: {
    bg: "radial-gradient(ellipse at center, hsl(180 100% 12%) 0%, hsl(180 100% 3%) 70%, #000 100%)",
    textColor: "hsl(180, 100%, 50%)",
    icon: Zap,
    defaultText: "SHOWTIME",
    scanColor: "hsl(180, 100%, 45%)",
  },
  alert: {
    bg: "radial-gradient(ellipse at center, hsl(0 84% 15%) 0%, hsl(0 84% 5%) 70%, #000 100%)",
    textColor: "hsl(0, 84%, 65%)",
    icon: AlertTriangle,
    defaultText: "⚠ ALERT",
    scanColor: "hsl(0, 84%, 55%)",
  },
};

export function HypeTakeover() {
  const [active, setActive] = useState(false);
  const [payload, setPayload] = useState<HypePayload | null>(null);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const progressRef = useRef<ReturnType<typeof setInterval>>();

  const startTakeover = useCallback((p: HypePayload) => {
    setPayload(p);
    setActive(true);
    setFadeOut(false);
    setProgress(0);

    const dur = p.duration || 10000;

    // Progress bar
    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min(elapsed / dur, 1));
    }, 50);

    // Auto-revert with crossfade
    timerRef.current = setTimeout(() => {
      clearInterval(progressRef.current);
      setFadeOut(true);
      setTimeout(() => {
        setActive(false);
        setPayload(null);
        setProgress(0);
        setFadeOut(false);
      }, 800); // crossfade duration
    }, dur);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("screen-alerts")
      .on("broadcast", { event: "hype-takeover" }, ({ payload: p }) => {
        if (p) startTakeover(p as HypePayload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(timerRef.current);
      clearInterval(progressRef.current);
    };
  }, [startTakeover]);

  if (!active || !payload) return null;

  const config = TYPE_CONFIG[payload.type] || TYPE_CONFIG.showtime;
  const Icon = config.icon;
  const displayText = payload.message || config.defaultText;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{
        zIndex: 9998,
        background: config.bg,
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.8s ease-in-out",
      }}
    >
      {/* Animated scanlines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${config.scanColor}10 2px, ${config.scanColor}10 4px)`,
        animation: "hypeScanlines 0.1s steps(2) infinite",
      }} />

      {/* Central radial pulse */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(circle at 50% 50%, ${config.scanColor}30 0%, transparent 60%)`,
        animation: "hypeRadialPulse 1.5s ease-in-out infinite",
      }} />

      {/* Icon */}
      <div style={{ animation: "hypeIconBounce 0.8s ease-out" }}>
        <Icon
          className="w-20 h-20 md:w-28 md:h-28 mb-6"
          style={{ color: config.textColor, filter: `drop-shadow(0 0 20px ${config.textColor})` }}
        />
      </div>

      {/* Glitch text */}
      <div className="relative px-6 text-center" style={{ animation: "hypeTextReveal 0.6s ease-out 0.2s both" }}>
        <h1
          className="text-5xl md:text-8xl lg:text-9xl font-black tracking-tight leading-none"
          style={{
            color: config.textColor,
            textShadow: `0 0 40px ${config.textColor}, 0 0 80px ${config.scanColor}80`,
            animation: "hypeGlitch 3s ease-in-out infinite",
          }}
        >
          {displayText}
        </h1>
        {/* Glitch clone layers */}
        <h1
          className="absolute inset-0 text-5xl md:text-8xl lg:text-9xl font-black tracking-tight leading-none text-center px-6 pointer-events-none"
          aria-hidden
          style={{
            color: "hsl(180, 100%, 60%)",
            opacity: 0.3,
            animation: "hypeGlitchClip1 3s ease-in-out infinite",
          }}
        >
          {displayText}
        </h1>
        <h1
          className="absolute inset-0 text-5xl md:text-8xl lg:text-9xl font-black tracking-tight leading-none text-center px-6 pointer-events-none"
          aria-hidden
          style={{
            color: "hsl(330, 80%, 60%)",
            opacity: 0.3,
            animation: "hypeGlitchClip2 3s ease-in-out infinite",
          }}
        >
          {displayText}
        </h1>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1">
        <div
          className="h-full transition-all duration-100"
          style={{
            width: `${progress * 100}%`,
            background: `linear-gradient(90deg, ${config.textColor}, ${config.scanColor})`,
            boxShadow: `0 0 10px ${config.textColor}`,
          }}
        />
      </div>

      <style>{`
        @keyframes hypeScanlines {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }
        @keyframes hypeRadialPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 0.8; }
        }
        @keyframes hypeIconBounce {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          60% { transform: scale(1.2) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes hypeTextReveal {
          0% { transform: translateY(40px) scaleY(0.3); opacity: 0; }
          100% { transform: translateY(0) scaleY(1); opacity: 1; }
        }
        @keyframes hypeGlitch {
          0%, 90%, 100% { transform: none; }
          92% { transform: translate(-3px, 2px) skewX(-2deg); }
          94% { transform: translate(3px, -1px) skewX(1deg); }
          96% { transform: translate(-2px, 1px); }
          98% { transform: translate(2px, -2px) skewX(2deg); }
        }
        @keyframes hypeGlitchClip1 {
          0%, 88%, 100% { clip-path: inset(0 0 100% 0); }
          90% { clip-path: inset(20% 0 40% 0); transform: translate(-4px, 0); }
          92% { clip-path: inset(60% 0 10% 0); transform: translate(3px, 0); }
          94% { clip-path: inset(0 0 100% 0); }
        }
        @keyframes hypeGlitchClip2 {
          0%, 90%, 100% { clip-path: inset(0 0 100% 0); }
          92% { clip-path: inset(40% 0 20% 0); transform: translate(5px, 0); }
          94% { clip-path: inset(10% 0 60% 0); transform: translate(-3px, 0); }
          96% { clip-path: inset(0 0 100% 0); }
        }
      `}</style>
    </div>
  );
}
