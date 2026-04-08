import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GHLoader } from "@/components/GHLoader";
import {
  Sun, Cloud, CloudRain, Snowflake, CloudLightning,
  Clock, Rss, Timer, Newspaper, Image, Video, Type, Zap,
} from "lucide-react";

/* ───── types (mirrors Studio) ───── */
interface CanvasElement {
  id: string;
  type: "image" | "video" | "text" | "widget-weather" | "widget-rss" | "widget-clock" | "widget-countdown" | "widget-neon-label" | "widget-ticker";
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style: Record<string, string>;
  animation?: string;
  proOnly?: boolean;
}

interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  icon: "sun" | "cloud" | "rain" | "snow" | "storm";
  isNight: boolean;
}

/* ───── weather helpers ───── */
const getWeatherNeonIcon = (icon: string) => {
  switch (icon) {
    case "sun":
      return <Sun className="h-12 w-12" style={{ color: "#FFB020", filter: "drop-shadow(0 0 14px #FFB020) drop-shadow(0 0 28px #FFB02080)", animation: "weatherSunPulse 3s ease-in-out infinite" }} />;
    case "rain":
      return <CloudRain className="h-12 w-12" style={{ color: "hsl(var(--primary))", filter: "drop-shadow(0 0 12px hsl(var(--primary))) drop-shadow(0 0 24px hsl(var(--primary) / 0.5))", animation: "weatherRainDrop 2s ease-in-out infinite" }} />;
    case "snow":
      return <Snowflake className="h-12 w-12" style={{ color: "#93C5FD", filter: "drop-shadow(0 0 12px #93C5FD)" }} />;
    case "storm":
      return <CloudLightning className="h-12 w-12" style={{ color: "#A78BFA", filter: "drop-shadow(0 0 14px #A78BFA)", animation: "weatherSunPulse 1.5s ease-in-out infinite" }} />;
    default:
      return <Cloud className="h-12 w-12" style={{ color: "#94A3B8", filter: "drop-shadow(0 0 10px #94A3B8)" }} />;
  }
};

const getAuroraGradient = (icon: string, isNight: boolean) => {
  if (isNight) return "from-indigo-600/20 to-violet-900/10";
  switch (icon) {
    case "sun": return "from-amber-500/20 to-orange-400/10";
    case "rain": case "storm": return "from-blue-500/15 to-purple-500/10";
    default: return "from-blue-500/10 to-slate-500/10";
  }
};

export default function StudioPreview() {
  const { layoutId } = useParams<{ layoutId: string }>();
  const navigate = useNavigate();
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [clockTime, setClockTime] = useState(new Date());
  const [rssHeadlines, setRssHeadlines] = useState<Record<string, string[]>>({});

  /* ── load layout ── */
  useEffect(() => {
    if (!layoutId) return;
    (async () => {
      const { data, error } = await supabase
        .from("studio_layouts")
        .select("canvas_data")
        .eq("id", layoutId)
        .single();
      if (error || !data) {
        navigate("/studio");
        return;
      }
      setElements((data.canvas_data as any)?.elements || []);
      setLoading(false);
    })();
  }, [layoutId, navigate]);

  /* ── live clock ── */
  useEffect(() => {
    const t = setInterval(() => setClockTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── weather fetch ── */
  useEffect(() => {
    const hasWeather = elements.some((e) => e.type === "widget-weather");
    if (!hasWeather) return;
    (async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/weather-proxy`);
        const d = await res.json();
        setWeather(d);
      } catch {
        setWeather({ city: "London", temp: 18, condition: "Partly Cloudy", icon: "cloud", isNight: false });
      }
    })();
  }, [elements]);

  /* ── RSS feed fetch ── */
  useEffect(() => {
    const feedUrls = new Set<string>();
    elements.forEach((el) => {
      if (el.type !== "widget-ticker") return;
      try {
        const cfg = JSON.parse(el.content);
        if (cfg.source === "rss" && cfg.feedUrl) feedUrls.add(cfg.feedUrl);
      } catch {}
    });
    feedUrls.forEach(async (url) => {
      if (rssHeadlines[url]) return;
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/rss-proxy?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (data.headlines?.length) {
          setRssHeadlines((prev) => ({ ...prev, [url]: data.headlines }));
        }
      } catch {}
    });
  }, [elements]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate("/studio");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  /* ── cursor auto-hide ── */
  const [cursorVisible, setCursorVisible] = useState(true);
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleMove = () => {
      setCursorVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setCursorVisible(false), 3000);
    };
    window.addEventListener("mousemove", handleMove);
    timeout = setTimeout(() => setCursorVisible(false), 3000);
    return () => { window.removeEventListener("mousemove", handleMove); clearTimeout(timeout); };
  }, []);

  const renderElement = useCallback((el: CanvasElement, scale: number, offsetX: number, offsetY: number) => {
    const animClass = el.animation === "pulse" ? "animate-pulse"
      : el.animation === "neon-flicker" ? "studio-neon-flicker"
      : el.animation === "glow-breathe" ? "studio-glow-breathe"
      : "";

    const left = offsetX + el.x * scale;
    const top = offsetY + el.y * scale;
    const width = el.width * scale;
    const height = el.height * scale;

    return (
      <div key={el.id} className={`absolute ${animClass}`} style={{ left, top, width, height, ...el.style }}>
        {el.type === "text" && (
          <div className="w-full h-full flex items-center justify-center text-foreground font-['Satoshi',sans-serif] p-2 overflow-hidden"
            style={{ fontSize: `${parseInt(el.style.fontSize || "14") * scale}px` }}>
            {el.content}
          </div>
        )}
        {el.type === "image" && el.content && (
          <img src={el.content} alt="" className="w-full h-full object-cover rounded" />
        )}
        {el.type === "image" && !el.content && (
          <div className="w-full h-full rounded bg-muted/30 border border-dashed border-muted-foreground/20 flex items-center justify-center">
            <Image className="h-6 w-6 text-muted-foreground/40" />
          </div>
        )}
        {el.type === "video" && (
          <div className="w-full h-full rounded bg-gradient-to-br from-primary/10 to-glow-blue/10 flex items-center justify-center border border-primary/20">
            <Video className="h-6 w-6 text-primary/60" />
          </div>
        )}
        {el.type === "widget-clock" && (
          <div className="w-full h-full rounded-lg bg-muted/20 border border-border/30 flex flex-col items-center justify-center gap-1">
            <Clock className="text-primary" style={{ width: 20 * scale, height: 20 * scale }} />
            <span className="font-mono text-foreground" style={{ fontSize: `${14 * scale}px`, textShadow: "0 0 8px hsla(180,100%,32%,0.4)" }}>
              {clockTime.toLocaleTimeString()}
            </span>
          </div>
        )}
        {el.type === "widget-weather" && (() => {
          const wp = weather || { city: "London", temp: 18, condition: "Partly Cloudy", icon: "cloud" as const, isNight: false };
          const auroraGrad = getAuroraGradient(wp.icon, wp.isNight);
          return (
            <div className="w-full h-full rounded-2xl overflow-hidden relative border border-primary/30 shadow-[0_0_16px_hsla(180,100%,32%,0.2)]" style={{ backdropFilter: "blur(24px)", background: "rgba(255,255,255,0.03)" }}>
              <div className={`absolute inset-0 bg-gradient-to-br ${auroraGrad} pointer-events-none`} style={{ animation: "weatherAuroraShift 8s ease-in-out infinite" }} />
              <div className="relative z-10 flex flex-col items-center justify-center h-full gap-1 p-3">
                {getWeatherNeonIcon(wp.icon)}
                <span className="font-bold text-foreground font-['Satoshi',sans-serif]" style={{ fontSize: `${24 * scale}px`, textShadow: "0 0 10px hsla(180,100%,32%,0.3)" }}>{wp.temp}°C</span>
                <span className="font-mono uppercase tracking-[0.15em] text-muted-foreground" style={{ fontSize: `${9 * scale}px` }}>{wp.city}</span>
                <span className="font-mono text-muted-foreground/60 tracking-wider" style={{ fontSize: `${8 * scale}px` }}>{wp.condition}</span>
              </div>
            </div>
          );
        })()}
        {el.type === "widget-countdown" && (
          <div className="w-full h-full rounded-lg bg-muted/20 border border-primary/20 flex items-center justify-center gap-3 p-2">
            {["12", "34", "56"].map((v, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="font-mono font-bold text-foreground" style={{ fontSize: `${18 * scale}px`, textShadow: "0 0 8px hsla(180,100%,32%,0.4)" }}>{v}</span>
                <span className="text-muted-foreground/60 uppercase tracking-widest" style={{ fontSize: `${7 * scale}px` }}>{["HRS", "MIN", "SEC"][i]}</span>
              </div>
            ))}
          </div>
        )}
        {el.type === "widget-neon-label" && (
          <div className="w-full h-full rounded-lg flex items-center justify-center p-2 studio-neon-flicker">
            <span className="font-bold text-primary font-['Satoshi',sans-serif] tracking-widest uppercase" style={{ fontSize: `${(parseInt(el.style.fontSize || "18")) * scale}px`, textShadow: "0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--primary))" }}>
              {el.content || "GLOW"}
            </span>
          </div>
        )}
        {el.type === "widget-rss" && (
          <div className="w-full h-full rounded-lg bg-gradient-to-br from-accent/5 to-primary/5 border border-accent/20 flex items-center justify-center gap-1 p-2">
            <Rss className="text-accent" style={{ width: 16 * scale, height: 16 * scale }} />
            <span className="text-muted-foreground font-['Satoshi',sans-serif]" style={{ fontSize: `${10 * scale}px` }}>RSS Feed</span>
          </div>
        )}
        {el.type === "widget-ticker" && (() => {
          let cfg: any = { messages: "Breaking News · Welcome to GLOW · Stay tuned", speed: "normal", color: "teal", alertMode: false, source: "manual", feedUrl: "" };
          try { cfg = { ...cfg, ...JSON.parse(el.content) }; } catch {}
          const isAlert = cfg.alertMode;
          const speedMap: Record<string, string> = { slow: "30s", normal: "18s", fast: "10s" };
          const duration = speedMap[cfg.speed] || "18s";
          const textColor = isAlert ? "text-white uppercase font-extrabold" : (cfg.color === "white" ? "text-white" : "text-primary");
          const displayText = cfg.source === "rss" && cfg.feedUrl && rssHeadlines[cfg.feedUrl]
            ? rssHeadlines[cfg.feedUrl].join(" · ")
            : cfg.messages;
          return (
            <div
              className={`w-full h-full rounded-lg backdrop-blur-[25px] flex items-center overflow-hidden ${isAlert ? "alert-glitch-in" : ""}`}
              style={{
                background: isAlert ? "#FF0033" : "rgba(255,255,255,0.05)",
                borderTop: isAlert ? "2px solid #FF0033" : "2px solid hsl(var(--primary))",
                boxShadow: isAlert ? "0 -20px 60px rgba(255,0,51,0.4)" : "0 -2px 15px hsla(180,100%,32%,0.3)",
                animation: isAlert ? "alertGlowSpill 2s ease-in-out infinite" : undefined,
              }}
            >
              <div className={`shrink-0 px-2.5 py-1 flex items-center gap-1.5 h-full ${isAlert ? "bg-black/30" : "bg-red-500"}`}>
                <div className={`w-2 h-2 rounded-full bg-white ${isAlert ? "alert-live-flash" : "animate-pulse"}`} />
                <span className="font-bold text-white tracking-widest font-mono" style={{ fontSize: `${10 * scale}px` }}>LIVE</span>
              </div>
              <div className="flex-1 overflow-hidden h-full flex items-center">
                <span
                  className={`inline-block whitespace-nowrap font-mono tracking-wider ${textColor}`}
                  style={{
                    animation: `tickerScroll ${duration} linear infinite`,
                    willChange: "transform",
                    fontSize: `${(isAlert ? 16 : 14) * scale}px`,
                    textShadow: isAlert ? "0 0 10px rgba(255,255,255,0.6)" : (cfg.color === "teal" ? "0 0 8px hsla(180,100%,32%,0.5)" : "none"),
                  }}
                >
                  {displayText}
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }, [clockTime, weather]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <GHLoader />
      </div>
    );
  }

  const scaleX = window.innerWidth / 960;
  const scaleY = window.innerHeight / 540;
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (window.innerWidth - 960 * scale) / 2;
  const offsetY = (window.innerHeight - 540 * scale) / 2;

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden"
      style={{ cursor: cursorVisible ? "default" : "none" }}
    >
      {/* Canvas background scaled area */}
      <div
        className="absolute bg-card"
        style={{
          left: offsetX,
          top: offsetY,
          width: 960 * scale,
          height: 540 * scale,
        }}
      />

      {/* Elements */}
      {elements.map((el) => renderElement(el, scale, offsetX, offsetY))}

      {/* Exit hint — fades out */}
      {cursorVisible && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-card/60 backdrop-blur-sm border border-border/30 text-xs text-muted-foreground font-['Satoshi',sans-serif] tracking-wider animate-fade-in z-50">
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted/30 text-foreground font-mono text-[10px]">ESC</kbd> to exit
        </div>
      )}

      <style>{`
        @keyframes studioNeonFlicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; text-shadow: 0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary)); }
          20%, 24%, 55% { opacity: 0.6; text-shadow: none; }
        }
        @keyframes studioGlowBreathe {
          0%, 100% { box-shadow: 0 0 8px hsla(180,100%,32%,0.2); }
          50% { box-shadow: 0 0 20px hsla(180,100%,32%,0.5), 0 0 40px hsla(180,100%,32%,0.15); }
        }
        .studio-neon-flicker { animation: studioNeonFlicker 2s infinite; }
        .studio-glow-breathe { animation: studioGlowBreathe 3s ease-in-out infinite; }
        @keyframes tickerScroll { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        @keyframes weatherSunPulse {
          0%, 100% { filter: drop-shadow(0 0 12px #FFB020) drop-shadow(0 0 24px #FFB02080); transform: scale(1); }
          50% { filter: drop-shadow(0 0 20px #FFB020) drop-shadow(0 0 40px #FFB020AA); transform: scale(1.08); }
        }
        @keyframes weatherRainDrop { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(3px); } }
        @keyframes weatherAuroraShift { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes alertGlitchIn { 0% { opacity:0; background:white; } 25% { opacity:1; background:#FF0033; } 50% { opacity:.3; background:white; } 100% { opacity:1; background:#FF0033; } }
        @keyframes alertLiveFlash { 0%,100% { opacity:1; } 50% { opacity:0.2; } }
        @keyframes alertGlowSpill { 0%,100% { box-shadow:0 -20px 60px rgba(255,0,51,.3); } 50% { box-shadow:0 -30px 80px rgba(255,0,51,.5); } }
        .alert-glitch-in { animation: alertGlitchIn .2s ease-out; }
        .alert-live-flash { animation: alertLiveFlash .5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
