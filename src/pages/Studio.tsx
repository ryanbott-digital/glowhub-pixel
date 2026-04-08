import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { isProTier } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Image, Video, Type, Cloud, Rss, Sparkles, Crown, Lock,
  Save, Trash2, Move, GripVertical, Plus, Layers, Palette,
  Clock, MousePointer, Download, Undo2, Redo2, Eye, Timer,
  Zap, Sun, CloudRain, CloudDrizzle, Cloud as CloudIcon, Snowflake, CloudLightning, Newspaper, Radio, Siren, MapPin,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

/* ───── weather helpers ───── */
interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  icon: "sun" | "cloud" | "rain" | "snow" | "storm";
  isNight: boolean;
}

const getWeatherNeonIcon = (icon: string, isNight: boolean) => {
  switch (icon) {
    case "sun":
      return <Sun className="h-10 w-10" style={{ color: "#FFB020", filter: "drop-shadow(0 0 12px #FFB020) drop-shadow(0 0 24px #FFB02080)", animation: "weatherSunPulse 3s ease-in-out infinite" }} />;
    case "rain":
      return <CloudRain className="h-10 w-10" style={{ color: "hsl(var(--primary))", filter: "drop-shadow(0 0 10px hsl(var(--primary))) drop-shadow(0 0 20px hsl(var(--primary) / 0.5))", animation: "weatherRainDrop 2s ease-in-out infinite" }} />;
    case "snow":
      return <Snowflake className="h-10 w-10" style={{ color: "#93C5FD", filter: "drop-shadow(0 0 10px #93C5FD) drop-shadow(0 0 20px #93C5FD80)" }} />;
    case "storm":
      return <CloudLightning className="h-10 w-10" style={{ color: "#A78BFA", filter: "drop-shadow(0 0 12px #A78BFA) drop-shadow(0 0 24px #A78BFA80)", animation: "weatherSunPulse 1.5s ease-in-out infinite" }} />;
    default:
      return <CloudIcon className="h-10 w-10" style={{ color: "#94A3B8", filter: "drop-shadow(0 0 8px #94A3B8) drop-shadow(0 0 16px #94A3B880)", animation: "weatherAuroraShift 6s ease-in-out infinite" }} />;
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

/* ───── types ───── */
interface CanvasElement {
  id: string;
  type: "image" | "video" | "text" | "widget-weather" | "widget-rss" | "widget-clock" | "widget-countdown" | "widget-neon-label" | "widget-ticker";
  x: number;
  y: number;
  width: number;
  height: number;
  content: string; // text content, media URL, or widget config
  style: Record<string, string>;
  animation?: string;
  proOnly?: boolean;
}

interface SavedLayout {
  id: string;
  name: string;
  canvas_data: { elements: CanvasElement[] };
  updated_at: string;
}

/* ───── widget library ───── */
interface WidgetDef {
  type: CanvasElement["type"];
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  pro: boolean;
  preview: React.ReactNode;
  defaultW: number;
  defaultH: number;
}

const WIDGET_LIBRARY: WidgetDef[] = [
  // ── Free ──
  {
    type: "widget-clock", label: "Digital Clock", description: "Minimalist time display with soft glow",
    icon: Clock, pro: false, defaultW: 220, defaultH: 80,
    preview: (
      <div className="flex flex-col items-center justify-center h-full gap-0.5">
        <Clock className="h-5 w-5 text-primary drop-shadow-[0_0_6px_hsl(var(--primary))]" />
        <span className="text-[11px] font-mono text-foreground font-bold tracking-wider" style={{ textShadow: "0 0 8px hsla(180,100%,32%,0.4)" }}>12:34:56</span>
      </div>
    ),
  },
  {
    type: "text", label: "Static Text", description: "Headers, descriptions & labels",
    icon: Type, pro: false, defaultW: 300, defaultH: 60,
    preview: (
      <div className="flex flex-col items-center justify-center h-full gap-0.5">
        <Type className="h-5 w-5 text-primary" />
        <span className="text-[10px] text-muted-foreground font-['Satoshi',sans-serif]">Aa</span>
      </div>
    ),
  },
  {
    type: "image", label: "Image Frame", description: "Upload brand assets & photos",
    icon: Image, pro: false, defaultW: 200, defaultH: 150,
    preview: (
      <div className="flex flex-col items-center justify-center h-full gap-0.5">
        <Image className="h-5 w-5 text-primary" />
        <div className="w-8 h-5 rounded-sm border border-dashed border-muted-foreground/30 mt-0.5" />
      </div>
    ),
  },
  // ── Pro ──
  {
    type: "widget-weather", label: "Live Weather", description: "Animated weather with glassmorphism card",
    icon: Sun, pro: true, defaultW: 220, defaultH: 180,
    preview: null as any, // replaced at runtime with live data
  },
  {
    type: "widget-rss", label: "RSS Ticker", description: "Scrolling news & announcements",
    icon: Rss, pro: true, defaultW: 400, defaultH: 50,
    preview: (
      <div className="flex items-center justify-center h-full gap-1.5 overflow-hidden">
        <Rss className="h-4 w-4 text-accent shrink-0 drop-shadow-[0_0_6px_hsl(var(--accent))]" />
        <div className="overflow-hidden flex-1">
          <span className="text-[9px] text-muted-foreground whitespace-nowrap inline-block" style={{ animation: "widgetTicker 6s linear infinite" }}>
            Breaking: New content deployed · Sale ends tomorrow · Welcome to GLOW ···
          </span>
        </div>
      </div>
    ),
  },
  {
    type: "widget-neon-label", label: "Neon Pulse Label", description: "Flickering neon text animation",
    icon: Zap, pro: true, defaultW: 280, defaultH: 60,
    preview: (
      <div className="flex items-center justify-center h-full">
        <span
          className="text-xs font-bold text-primary font-['Satoshi',sans-serif] tracking-wider uppercase"
          style={{ animation: "studioNeonFlicker 2s infinite", textShadow: "0 0 8px hsl(var(--primary)), 0 0 16px hsl(var(--primary))" }}
        >
          NEON GLOW
        </span>
      </div>
    ),
  },
  {
    type: "video", label: "Video Background", description: "Dynamic video backgrounds",
    icon: Video, pro: true, defaultW: 300, defaultH: 200,
    preview: (
      <div className="flex flex-col items-center justify-center h-full gap-0.5">
        <Video className="h-5 w-5 text-primary drop-shadow-[0_0_6px_hsl(var(--primary))]" />
        <span className="text-[9px] text-muted-foreground font-mono">MP4 / HLS</span>
      </div>
    ),
  },
  {
    type: "widget-countdown", label: "Live Countdown", description: "Sales, events & launch timers",
    icon: Timer, pro: true, defaultW: 280, defaultH: 90,
    preview: (
      <div className="flex items-center justify-center h-full gap-2">
        {["12", "34", "56"].map((v, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-sm font-mono font-bold text-foreground tracking-wider" style={{ textShadow: "0 0 6px hsla(180,100%,32%,0.4)" }}>{v}</span>
            <span className="text-[7px] text-muted-foreground/60 uppercase tracking-widest">{["HRS", "MIN", "SEC"][i]}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    type: "widget-ticker", label: "Pro-Glow Ticker", description: "Live news crawl with smooth scrolling",
    icon: Newspaper, pro: true, defaultW: 920, defaultH: 50,
    preview: (
      <div className="flex items-center h-full gap-1 overflow-hidden w-full px-1">
        <div className="shrink-0 px-1 py-0.5 rounded-sm bg-red-500/80 flex items-center gap-0.5">
          <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
          <span className="text-[6px] font-bold text-white tracking-wider">LIVE</span>
        </div>
        <div className="overflow-hidden flex-1">
          <span className="text-[8px] text-primary font-mono font-bold whitespace-nowrap inline-block" style={{ animation: "widgetTicker 6s linear infinite" }}>
            Breaking News · Welcome to GLOW · Stay tuned ···
          </span>
        </div>
      </div>
    ),
  },
];

const PRO_ANIMATIONS = [
  { id: "pulse", label: "Pulse", pro: true },
  { id: "neon-flicker", label: "Neon Flicker", pro: true },
  { id: "glow-breathe", label: "Glow Breathe", pro: true },
  { id: "slide-in", label: "Slide In", pro: false },
  { id: "fade-in", label: "Fade In", pro: false },
];

export default function Studio() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subscriptionTier, setSubscriptionTier] = useState("free");
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [layoutName, setLayoutName] = useState("Untitled Layout");
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>([]);
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null);
  const [proGateOpen, setProGateOpen] = useState(false);
  const [proGateFeature, setProGateFeature] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [weatherPreview, setWeatherPreview] = useState<WeatherData | null>(null);
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<{ id: string; name: string; storage_path: string; type: string }[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  const isPro = isProTier(subscriptionTier);
  const selected = elements.find((e) => e.id === selectedId) || null;

  /* ───── data fetching ───── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [profileRes, layoutsRes] = await Promise.all([
        supabase.from("profiles").select("subscription_tier").eq("id", user.id).single(),
        supabase.from("studio_layouts").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
      ]);
      setSubscriptionTier(profileRes.data?.subscription_tier || "free");
      setSavedLayouts((layoutsRes.data as any[]) || []);
    })();
  }, [user]);

  /* ───── weather preview (London teaser) ───── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&current=temperature_2m,weather_code,is_day");
        const data = await res.json();
        const code = data.current?.weather_code ?? 0;
        const WMO: Record<number, { label: string; icon: "sun" | "cloud" | "rain" | "snow" | "storm" }> = {
          0: { label: "Clear Sky", icon: "sun" }, 1: { label: "Mostly Clear", icon: "sun" }, 2: { label: "Partly Cloudy", icon: "cloud" },
          3: { label: "Overcast", icon: "cloud" }, 45: { label: "Foggy", icon: "cloud" }, 48: { label: "Icy Fog", icon: "cloud" },
          51: { label: "Light Drizzle", icon: "rain" }, 53: { label: "Drizzle", icon: "rain" }, 55: { label: "Heavy Drizzle", icon: "rain" },
          61: { label: "Light Rain", icon: "rain" }, 63: { label: "Rain", icon: "rain" }, 65: { label: "Heavy Rain", icon: "rain" },
          71: { label: "Light Snow", icon: "snow" }, 73: { label: "Snow", icon: "snow" }, 75: { label: "Heavy Snow", icon: "snow" },
          80: { label: "Rain Showers", icon: "rain" }, 95: { label: "Thunderstorm", icon: "storm" },
        };
        const cond = WMO[code] || { label: "Clear Sky", icon: "sun" as const };
        setWeatherPreview({ city: "London", temp: Math.round(data.current?.temperature_2m ?? 0), condition: cond.label, icon: cond.icon, isNight: data.current?.is_day === 0 });
      } catch {
        setWeatherPreview({ city: "London", temp: 18, condition: "Partly Cloudy", icon: "cloud", isNight: false });
      }
    })();
  }, []);

  /* ───── pro gate helper ───── */
  const gatePro = (featureName: string): boolean => {
    if (isPro) return false;
    setProGateFeature(featureName);
    setProGateOpen(true);
    return true;
  };

  /* ───── add element (from widget library) ───── */
  const addElement = (type: CanvasElement["type"], pro: boolean) => {
    if (pro && gatePro(type)) return;
    const id = crypto.randomUUID();
    const widget = WIDGET_LIBRARY.find((w) => w.type === type);
    const defaults: Partial<CanvasElement> = {
      x: 80 + Math.random() * 200,
      y: 60 + Math.random() * 120,
      width: widget?.defaultW || 200,
      height: widget?.defaultH || 150,
      style: {},
      proOnly: pro,
    };
    const contentMap: Record<string, string> = {
      image: "",
      video: "",
      text: "Double-click to edit",
      "widget-weather": '{"city":"London"}',
      "widget-rss": '{"feed":""}',
      "widget-clock": '{"format":"24h"}',
      "widget-countdown": '{"target":"2025-12-31T00:00:00"}',
      "widget-neon-label": "GLOW",
      "widget-ticker": '{"messages":"Breaking News · Welcome to GLOW · Stay tuned","speed":"normal","color":"teal"}',
    };
    setElements((prev) => [...prev, { id, type, content: contentMap[type] || "", ...defaults } as CanvasElement]);
    setSelectedId(id);
  };

  /* ───── drag & resize logic ───── */
  const [resizing, setResizing] = useState<{ id: string; corner: string; startX: number; startY: number; startW: number; startH: number; startElX: number; startElY: number } | null>(null);

  const handleCanvasMouseDown = (e: React.MouseEvent, elId: string) => {
    e.stopPropagation();
    setSelectedId(elId);
    setDraggingId(elId);
    const el = elements.find((x) => x.id === elId)!;
    const rect = canvasRef.current!.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left - el.x, y: e.clientY - rect.top - el.y });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, elId: string, corner: string) => {
    e.stopPropagation();
    e.preventDefault();
    const el = elements.find((x) => x.id === elId)!;
    setResizing({ id: elId, corner, startX: e.clientX, startY: e.clientY, startW: el.width, startH: el.height, startElX: el.x, startElY: el.y });
    setSelectedId(elId);
  };

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (resizing && canvasRef.current) {
        const dx = e.clientX - resizing.startX;
        const dy = e.clientY - resizing.startY;
        let { startW: w, startH: h, startElX: x, startElY: y } = resizing;
        const c = resizing.corner;
        if (c.includes("r")) w = Math.max(30, w + dx);
        if (c.includes("b")) h = Math.max(30, h + dy);
        if (c.includes("l")) { w = Math.max(30, w - dx); x = resizing.startElX + dx; if (w <= 30) x = resizing.startElX + resizing.startW - 30; }
        if (c.includes("t")) { h = Math.max(30, h - dy); y = resizing.startElY + dy; if (h <= 30) y = resizing.startElY + resizing.startH - 30; }
        setElements((prev) => prev.map((el) => el.id === resizing.id ? { ...el, x, y, width: w, height: h } : el));
        return;
      }
      if (!draggingId || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - 50));
      const y = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - 50));
      setElements((prev) => prev.map((el) => (el.id === draggingId ? { ...el, x, y } : el)));
    },
    [draggingId, dragOffset, resizing],
  );

  const handleCanvasMouseUp = () => { setDraggingId(null); setResizing(null); };

  /* ───── update selected ───── */
  const updateSelected = (patch: Partial<CanvasElement>) => {
    if (!selectedId) return;
    setElements((prev) => prev.map((el) => (el.id === selectedId ? { ...el, ...patch } : el)));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setSelectedId(null);
  };

  /* ───── save / load ───── */
  const handleSave = async () => {
    if (!user) return;
    const canvasData = JSON.parse(JSON.stringify({ elements }));
    const payload = {
      user_id: user.id,
      name: layoutName,
      canvas_data: canvasData,
      updated_at: new Date().toISOString(),
    };
    if (currentLayoutId) {
      const { error } = await supabase.from("studio_layouts").update(payload).eq("id", currentLayoutId);
      if (error) { toast.error(error.message); return; }
      toast.success("Layout saved");
    } else {
      const { data, error } = await supabase.from("studio_layouts").insert(payload).select("id").single();
      if (error) { toast.error(error.message); return; }
      setCurrentLayoutId((data as any).id);
      toast.success("Layout created");
    }
    // refresh list
    const { data: layouts } = await supabase.from("studio_layouts").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
    setSavedLayouts((layouts as any[]) || []);
  };

  const handleLoad = (layout: SavedLayout) => {
    setCurrentLayoutId(layout.id);
    setLayoutName(layout.name);
    setElements((layout.canvas_data as any).elements || []);
    setSelectedId(null);
    toast.success(`Loaded "${layout.name}"`);
  };

  const handleDelete = async (layoutId: string) => {
    const { error } = await supabase.from("studio_layouts").delete().eq("id", layoutId);
    if (error) { toast.error(error.message); return; }
    if (currentLayoutId === layoutId) { setCurrentLayoutId(null); setElements([]); setLayoutName("Untitled Layout"); }
    setSavedLayouts((prev) => prev.filter((l) => l.id !== layoutId));
    toast.success("Layout deleted");
  };

  /* ───── element renderer ───── */
  const renderElement = (el: CanvasElement, previewMode = false) => {
    const isSelected = !previewMode && el.id === selectedId;
    const animClass = el.animation === "pulse" ? "animate-pulse"
      : el.animation === "neon-flicker" ? "studio-neon-flicker"
      : el.animation === "glow-breathe" ? "studio-glow-breathe"
      : el.animation === "slide-in" ? "animate-fade-in"
      : "";

    return (
      <div
        key={el.id}
        className={`absolute select-none ${animClass} ${previewMode ? "" : "cursor-move"} ${isSelected ? "ring-2 ring-primary shadow-[0_0_16px_hsla(180,100%,32%,0.4)]" : (!previewMode ? "hover:ring-1 hover:ring-primary/30" : "")}`}
        style={previewMode ? { left: 0, top: 0, width: "100%", height: "100%" } : { left: el.x, top: el.y, width: el.width, height: el.height, ...el.style }}
        onMouseDown={previewMode ? undefined : (e) => handleCanvasMouseDown(e, el.id)}
      >
        {el.type === "text" && (
          <div className="w-full h-full flex items-center justify-center text-foreground font-['Satoshi',sans-serif] text-sm p-2 overflow-hidden">
            {el.content}
          </div>
        )}
        {el.type === "image" && (
          el.content ? (
            <img src={el.content} alt="" className="w-full h-full object-cover rounded" />
          ) : (
            <div className="w-full h-full rounded bg-muted/30 border border-dashed border-muted-foreground/20 flex items-center justify-center">
              <Image className="h-6 w-6 text-muted-foreground/40" />
            </div>
          )
        )}
        {el.type === "video" && (
          <div className="w-full h-full rounded bg-gradient-to-br from-primary/10 to-glow-blue/10 flex items-center justify-center border border-primary/20">
            <Video className="h-6 w-6 text-primary/60" />
            <span className="text-[9px] text-primary/60 ml-1 font-mono">VIDEO BG</span>
          </div>
        )}
        {el.type === "widget-weather" && (() => {
          const wp = weatherPreview || { city: "London", temp: 18, condition: "Partly Cloudy", icon: "cloud" as const, isNight: false };
          let cfg: any = { city: "auto" };
          try { cfg = { ...cfg, ...JSON.parse(el.content) }; } catch {}
          const auroraGrad = getAuroraGradient(wp.icon, wp.isNight);
          return (
            <div className="w-full h-full rounded-2xl overflow-hidden relative border border-primary/30 shadow-[0_0_16px_hsla(180,100%,32%,0.2)]" style={{ backdropFilter: "blur(24px)", background: "rgba(255,255,255,0.03)" }}>
              {/* Aurora bloom */}
              <div className={`absolute inset-0 bg-gradient-to-br ${auroraGrad} pointer-events-none`} style={{ animation: "weatherAuroraShift 8s ease-in-out infinite" }} />
              <div className="relative z-10 flex flex-col items-center justify-center h-full gap-1 p-3">
                {getWeatherNeonIcon(wp.icon, wp.isNight)}
                <span className="text-2xl font-bold text-foreground font-['Satoshi',sans-serif] mt-1" style={{ textShadow: "0 0 10px hsla(180,100%,32%,0.3)" }}>{wp.temp}°C</span>
                <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground">{wp.city}</span>
                <span className="text-[8px] font-mono text-muted-foreground/60 tracking-wider">{wp.condition}</span>
              </div>
            </div>
          );
        })()}
        {el.type === "widget-rss" && (
          <div className="w-full h-full rounded-lg bg-gradient-to-br from-accent/5 to-primary/5 border border-accent/20 flex flex-col items-center justify-center gap-1 p-2">
            <Rss className="h-5 w-5 text-accent" />
            <span className="text-[10px] text-muted-foreground font-['Satoshi',sans-serif]">RSS Feed</span>
          </div>
        )}
        {el.type === "widget-clock" && (
          <div className="w-full h-full rounded-lg bg-muted/20 border border-border/30 flex flex-col items-center justify-center gap-1">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-sm font-mono text-foreground">{new Date().toLocaleTimeString()}</span>
          </div>
        )}
        {el.type === "widget-countdown" && (
          <div className="w-full h-full rounded-lg bg-muted/20 border border-primary/20 flex items-center justify-center gap-3 p-2">
            {["12", "34", "56"].map((v, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-lg font-mono font-bold text-foreground" style={{ textShadow: "0 0 8px hsla(180,100%,32%,0.4)" }}>{v}</span>
                <span className="text-[7px] text-muted-foreground/60 uppercase tracking-widest">{["HRS", "MIN", "SEC"][i]}</span>
              </div>
            ))}
          </div>
        )}
        {el.type === "widget-neon-label" && (
          <div className="w-full h-full rounded-lg flex items-center justify-center p-2 studio-neon-flicker">
            <span className="font-bold text-primary font-['Satoshi',sans-serif] tracking-widest uppercase" style={{ fontSize: el.style.fontSize || "18px", textShadow: "0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--primary))" }}>
              {el.content || "GLOW"}
            </span>
          </div>
        )}
        {el.type === "widget-ticker" && (() => {
          let cfg = { messages: "Breaking News · Welcome to GLOW · Stay tuned", speed: "normal", color: "teal", alertMode: false };
          try { cfg = { ...cfg, ...JSON.parse(el.content) }; } catch {}
          const isAlert = cfg.alertMode === true;
          const speedMap: Record<string, string> = { slow: "30s", normal: "18s", fast: "10s" };
          const duration = speedMap[cfg.speed] || "18s";
          const textColor = isAlert ? "text-white uppercase font-extrabold" : (cfg.color === "white" ? "text-white" : "text-primary");
          return (
            <div
              className={`w-full h-full rounded-lg backdrop-blur-[25px] flex items-center overflow-hidden ${isAlert ? "alert-glitch-in" : ""}`}
              style={{
                background: isAlert ? "#FF0033" : "rgba(255,255,255,0.05)",
                borderTop: isAlert ? "2px solid #FF0033" : "2px solid hsl(var(--primary))",
                boxShadow: isAlert
                  ? "0 -20px 60px rgba(255,0,51,0.4), 0 -40px 100px rgba(255,0,51,0.2)"
                  : "0 -2px 15px hsla(180,100%,32%,0.3)",
                animation: isAlert ? "alertGlowSpill 2s ease-in-out infinite" : undefined,
              }}
            >
              <div className={`shrink-0 px-2.5 py-1 flex items-center gap-1.5 h-full ${isAlert ? "bg-black/30" : "bg-red-500"}`}>
                <div className={`w-2 h-2 rounded-full bg-white ${isAlert ? "alert-live-flash" : "animate-pulse"}`} />
                <span className="text-[10px] font-bold text-white tracking-widest font-mono">LIVE</span>
              </div>
              <div className="flex-1 overflow-hidden h-full flex items-center">
                <span
                  className={`inline-block whitespace-nowrap font-mono tracking-wider ${textColor}`}
                  style={{
                    animation: `tickerScroll ${duration} linear infinite`,
                    willChange: "transform",
                    fontSize: isAlert ? "16px" : "14px",
                    textShadow: isAlert ? "0 0 10px rgba(255,255,255,0.6)" : (cfg.color === "teal" ? "0 0 8px hsla(180,100%,32%,0.5)" : "none"),
                  }}
                >
                  {cfg.messages}
                </span>
              </div>
            </div>
          );
        })()}
        {/* Pro badge */}
        {el.proOnly && (
          <div className="absolute -top-1.5 -right-1.5 px-1 py-0.5 rounded text-[7px] font-bold tracking-widest uppercase bg-accent text-accent-foreground shadow-[0_0_8px_hsl(var(--accent)/0.5)]">
            PRO
          </div>
        )}
        {/* Resize handles */}
        {isSelected && !previewMode && (
          <>
            {["tl","tr","bl","br","t","b","l","r"].map((corner) => {
              const pos: Record<string, React.CSSProperties> = {
                tl: { top: -4, left: -4, cursor: "nwse-resize" },
                tr: { top: -4, right: -4, cursor: "nesw-resize" },
                bl: { bottom: -4, left: -4, cursor: "nesw-resize" },
                br: { bottom: -4, right: -4, cursor: "nwse-resize" },
                t: { top: -4, left: "50%", transform: "translateX(-50%)", cursor: "ns-resize" },
                b: { bottom: -4, left: "50%", transform: "translateX(-50%)", cursor: "ns-resize" },
                l: { top: "50%", left: -4, transform: "translateY(-50%)", cursor: "ew-resize" },
                r: { top: "50%", right: -4, transform: "translateY(-50%)", cursor: "ew-resize" },
              };
              return (
                <div
                  key={corner}
                  className="absolute w-2.5 h-2.5 rounded-full bg-primary border-2 border-background shadow-[0_0_6px_hsl(var(--primary))] z-20"
                  style={pos[corner]}
                  onMouseDown={(e) => handleResizeMouseDown(e, el.id, corner)}
                />
              );
            })}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-primary" />
          <span className="font-['Satoshi',sans-serif] font-bold text-foreground tracking-wide">Glow Studio</span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value)}
            className="glass h-8 w-48 text-xs font-['Satoshi',sans-serif]"
          />
          <Button size="sm" variant="outline" onClick={() => setFullscreenPreview(true)} className="text-xs gap-1.5 font-semibold tracking-wider border-primary/30 hover:border-primary/60">
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
          <Button size="sm" onClick={handleSave} className="bg-gradient-to-r from-primary to-glow-blue text-primary-foreground text-xs gap-1.5 font-semibold tracking-wider">
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* ─── Left Sidebar: Assets ─── */}
        <div className="w-64 border-r border-border/30 bg-[hsl(220,60%,7%)] flex flex-col overflow-y-auto">
          <div className="p-3 border-b border-border/20">
            <h3 className="text-[10px] font-['Satoshi',sans-serif] font-bold tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Widget Library
            </h3>
          </div>

          {/* Widget grid */}
          <div className="p-2.5 space-y-4 flex-1">
            {/* Free section */}
            <div>
              <p className="text-[9px] font-['Satoshi',sans-serif] tracking-[0.15em] uppercase text-muted-foreground/60 px-1 mb-2">Standard</p>
              <div className="grid grid-cols-2 gap-2">
                {WIDGET_LIBRARY.filter(w => !w.pro).map((w) => (
                  <button
                    key={w.type}
                    onClick={() => addElement(w.type, false)}
                    className="group relative rounded-xl border border-border/30 bg-card/50 hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 aspect-square flex flex-col items-center justify-center p-2 overflow-hidden"
                  >
                    <div className="flex-1 flex items-center justify-center w-full">
                      {w.preview}
                    </div>
                    <span className="text-[9px] font-['Satoshi',sans-serif] text-muted-foreground mt-1 tracking-wider">{w.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pro section */}
            <div>
              <p className="text-[9px] font-['Satoshi',sans-serif] tracking-[0.15em] uppercase text-muted-foreground/60 px-1 mb-2 flex items-center gap-1">
                Premium
                <Crown className="h-3 w-3 text-accent" />
              </p>
              <div className="grid grid-cols-2 gap-2">
                {WIDGET_LIBRARY.filter(w => w.pro).map((w) => (
                  <button
                    key={w.type}
                    onClick={() => addElement(w.type, true)}
                    className="group relative rounded-xl border border-border/30 bg-card/50 hover:border-primary/40 transition-all duration-300 aspect-square flex flex-col items-center justify-center p-2 overflow-hidden hover:shadow-[0_0_20px_hsla(180,100%,32%,0.15)]"
                  >
                    {/* PRO badge */}
                    <div className="absolute top-1.5 right-1.5 z-10 px-1.5 py-0.5 rounded-md text-[7px] font-bold tracking-widest uppercase bg-accent/20 text-accent border border-accent/30 shadow-[0_0_8px_hsl(var(--accent)/0.3)] group-hover:shadow-[0_0_14px_hsl(var(--accent)/0.5)] transition-shadow">
                      PRO
                    </div>
                    {/* Lock overlay for non-pro */}
                    {!isPro && (
                      <div className="absolute inset-0 z-[5] bg-background/30 backdrop-blur-[1px] flex items-center justify-center rounded-xl opacity-60 group-hover:opacity-30 transition-opacity">
                        <Lock className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="flex-1 flex items-center justify-center w-full">
                      {w.type === "widget-weather" && weatherPreview ? (
                        <div className="flex flex-col items-center justify-center h-full gap-0.5 relative">
                          <Sun className="h-5 w-5" style={{ color: "#FFB020", filter: "drop-shadow(0 0 8px #FFB020)", animation: "weatherSunPulse 3s ease-in-out infinite" }} />
                          <span className="text-[11px] font-bold text-foreground mt-0.5">{weatherPreview.temp}°C</span>
                          <span className="text-[7px] font-mono text-primary tracking-wider flex items-center gap-0.5"><MapPin className="h-2 w-2" />London · Live</span>
                        </div>
                      ) : w.preview ? w.preview : (
                        <div className="flex flex-col items-center justify-center h-full gap-0.5">
                          <Sun className="h-5 w-5 text-accent" />
                          <span className="text-[11px] font-bold text-foreground mt-0.5">22°C</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] font-['Satoshi',sans-serif] text-muted-foreground mt-1 tracking-wider">{w.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Saved layouts */}
          <div className="p-2.5 space-y-1 border-t border-border/20">
            <p className="text-[9px] font-['Satoshi',sans-serif] tracking-[0.15em] uppercase text-muted-foreground/60 px-1 pt-0.5">Saved Layouts</p>
            {savedLayouts.length === 0 && (
              <p className="text-[10px] text-muted-foreground/40 px-1 italic font-['Satoshi',sans-serif]">No layouts yet</p>
            )}
            {savedLayouts.map((l) => (
              <div key={l.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-primary/5 transition-colors group">
                <button onClick={() => handleLoad(l)} className="flex-1 text-left text-xs text-foreground truncate font-['Satoshi',sans-serif]">
                  {l.name}
                </button>
                <button onClick={() => handleDelete(l.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Center: Canvas ─── */}
        <div className="flex-1 flex items-center justify-center bg-[hsl(220,60%,5%)] relative overflow-hidden">
          {/* Ambient glow behind canvas */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[60%] rounded-3xl bg-primary/5 blur-[80px]" />
          </div>

          <div
            ref={canvasRef}
            className="relative bg-card/80 border border-primary/20 rounded-xl overflow-hidden shadow-[0_0_40px_hsla(180,100%,32%,0.15),0_0_80px_hsla(180,100%,32%,0.05)]"
            style={{ width: "min(90%, 960px)", aspectRatio: "16/9" }}
            onClick={() => setSelectedId(null)}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          >
            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
                backgroundSize: "30px 30px",
              }}
            />

            {/* Elements */}
            {elements.map((el) => renderElement(el))}

            {/* Empty state */}
            {elements.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
                <MousePointer className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground/30 font-['Satoshi',sans-serif]">
                  Drag assets from the sidebar to start designing
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ─── Right Sidebar: Properties ─── */}
        <div className="w-60 border-l border-border/30 bg-card/30 backdrop-blur-sm flex flex-col overflow-y-auto">
          <div className="p-3 border-b border-border/20">
            <h3 className="text-[10px] font-['Satoshi',sans-serif] font-bold tracking-[0.2em] uppercase text-muted-foreground">Properties</h3>
          </div>

          {selected ? (
            <div className="p-3 space-y-4">
              {/* Position */}
              <div className="space-y-2">
                <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60">Position</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-muted-foreground font-['Satoshi',sans-serif]">X</label>
                    <Input type="number" value={Math.round(selected.x)} onChange={(e) => updateSelected({ x: +e.target.value })} className="glass h-7 text-xs" />
                  </div>
                  <div>
                    <label className="text-[9px] text-muted-foreground font-['Satoshi',sans-serif]">Y</label>
                    <Input type="number" value={Math.round(selected.y)} onChange={(e) => updateSelected({ y: +e.target.value })} className="glass h-7 text-xs" />
                  </div>
                </div>
              </div>

              {/* Size */}
              <div className="space-y-2">
                <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60">Size</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-muted-foreground font-['Satoshi',sans-serif]">W</label>
                    <Input type="number" value={Math.round(selected.width)} onChange={(e) => updateSelected({ width: +e.target.value })} className="glass h-7 text-xs" />
                  </div>
                  <div>
                    <label className="text-[9px] text-muted-foreground font-['Satoshi',sans-serif]">H</label>
                    <Input type="number" value={Math.round(selected.height)} onChange={(e) => updateSelected({ height: +e.target.value })} className="glass h-7 text-xs" />
                  </div>
                </div>
              </div>

              {/* Content (text only) */}
              {selected.type === "text" && (
                <div className="space-y-2">
                  <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60">Text Content</p>
                  <Input value={selected.content} onChange={(e) => updateSelected({ content: e.target.value })} className="glass h-8 text-xs" />
                </div>
              )}

              {/* Ticker config */}
              {selected.type === "widget-ticker" && (() => {
                let cfg: any = { messages: "", speed: "normal", color: "teal", alertMode: false };
                try { cfg = { ...cfg, ...JSON.parse(selected.content) }; } catch {}
                const updateCfg = (patch: Record<string, any>) => {
                  const next = { ...cfg, ...patch };
                  updateSelected({ content: JSON.stringify(next) });
                };
                return (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60 flex items-center gap-1">
                        <Radio className="h-3 w-3" /> Messages
                      </p>
                      <Input
                        value={cfg.messages}
                        onChange={(e) => updateCfg({ messages: e.target.value })}
                        placeholder="Breaking News · Welcome..."
                        className="glass h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60">Speed</p>
                      <Select value={cfg.speed} onValueChange={(v) => updateCfg({ speed: v })}>
                        <SelectTrigger className="glass h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slow">Slow (30s)</SelectItem>
                          <SelectItem value="normal">Normal (18s)</SelectItem>
                          <SelectItem value="fast">Fast (10s)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60">Color</p>
                      <Select value={cfg.color} onValueChange={(v) => updateCfg({ color: v })}>
                        <SelectTrigger className="glass h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="teal">Neon Teal</SelectItem>
                          <SelectItem value="white">Classic White</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Emergency Flash Mode */}
                    <div className="space-y-1.5 pt-1 border-t border-border/20">
                      <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase flex items-center gap-1" style={{ color: cfg.alertMode ? "#FF0033" : "hsl(var(--muted-foreground) / 0.6)" }}>
                        <Siren className="h-3 w-3" /> Emergency Flash
                      </p>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!!cfg.alertMode}
                          onCheckedChange={(v) => updateCfg({ alertMode: v })}
                          className="data-[state=checked]:bg-[#FF0033]"
                        />
                        <span className="text-[10px] text-muted-foreground font-['Satoshi',sans-serif]">
                          {cfg.alertMode ? "Alert Active" : "Off"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Weather config */}
              {selected.type === "widget-weather" && (() => {
                let cfg: any = { city: "auto" };
                try { cfg = { ...cfg, ...JSON.parse(selected.content) }; } catch {}
                const isAuto = cfg.city === "auto";
                const updateCfg = (patch: Record<string, any>) => {
                  updateSelected({ content: JSON.stringify({ ...cfg, ...patch }) });
                };
                return (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Location
                      </p>
                      <div className="flex items-center gap-2">
                        <Switch checked={isAuto} onCheckedChange={(v) => updateCfg({ city: v ? "auto" : "London" })} />
                        <span className="text-[10px] text-muted-foreground font-['Satoshi',sans-serif]">
                          {isAuto ? "Auto-detect" : "Manual"}
                        </span>
                      </div>
                      {!isAuto && (
                        <Input
                          value={cfg.city}
                          onChange={(e) => updateCfg({ city: e.target.value })}
                          placeholder="City name..."
                          className="glass h-8 text-xs"
                        />
                      )}
                    </div>
                    {weatherPreview && (
                      <div className="rounded-lg bg-muted/10 border border-border/20 p-2 space-y-0.5">
                        <p className="text-[9px] text-muted-foreground/60 font-mono uppercase tracking-widest">Preview</p>
                        <p className="text-xs text-foreground font-bold font-['Satoshi',sans-serif]">{weatherPreview.temp}°C — {weatherPreview.condition}</p>
                        <p className="text-[9px] text-muted-foreground font-mono">{weatherPreview.city}</p>
                      </div>
                    )}
                    <p className="text-[9px] text-muted-foreground/40 font-['Satoshi',sans-serif] italic">
                      Location is detected automatically on TV
                    </p>
                  </div>
                );
              })()}

              {selected.type === "image" && (
                <div className="space-y-2">
                  <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60">Image Source</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs gap-1.5 border-primary/30 hover:border-primary/60"
                    onClick={async () => {
                      if (!user) return;
                      const { data } = await supabase.from("media").select("id, name, storage_path, type").eq("user_id", user.id).eq("type", "image").order("created_at", { ascending: false });
                      setMediaItems(data || []);
                      setMediaPickerOpen(true);
                    }}
                  >
                    <Image className="h-3.5 w-3.5" />
                    Pick from Media Library
                  </Button>
                  {selected.content && (
                    <div className="rounded-lg border border-border/20 overflow-hidden">
                      <img src={selected.content} alt="" className="w-full h-20 object-cover" />
                    </div>
                  )}
                  <p className="text-[8px] text-muted-foreground/40 font-['Satoshi',sans-serif]">Or paste a URL:</p>
                  <Input value={selected.content} onChange={(e) => updateSelected({ content: e.target.value })} placeholder="https://..." className="glass h-7 text-xs" />
                </div>
              )}

              {/* Colors */}
              <div className="space-y-2">
                <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60 flex items-center gap-1">
                  <Palette className="h-3 w-3" /> Colors
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-muted-foreground font-['Satoshi',sans-serif]">BG</label>
                    <input
                      type="color"
                      value={selected.style.backgroundColor || "#1a1a2e"}
                      onChange={(e) => updateSelected({ style: { ...selected.style, backgroundColor: e.target.value } })}
                      className="w-full h-7 rounded cursor-pointer bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-muted-foreground font-['Satoshi',sans-serif]">Text</label>
                    <input
                      type="color"
                      value={selected.style.color || "#ffffff"}
                      onChange={(e) => updateSelected({ style: { ...selected.style, color: e.target.value } })}
                      className="w-full h-7 rounded cursor-pointer bg-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Font size */}
              {selected.type === "text" && (
                <div className="space-y-2">
                  <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60">Font Size</p>
                  <Slider
                    value={[parseInt(selected.style.fontSize || "14")]}
                    onValueChange={([v]) => updateSelected({ style: { ...selected.style, fontSize: `${v}px` } })}
                    min={8}
                    max={120}
                    step={1}
                    className="w-full"
                  />
                  <span className="text-[10px] text-muted-foreground font-mono">{selected.style.fontSize || "14px"}</span>
                </div>
              )}

              {/* Animation */}
              <div className="space-y-2">
                <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Animation
                </p>
                <Select
                  value={selected.animation || "none"}
                  onValueChange={(v) => {
                    const anim = PRO_ANIMATIONS.find((a) => a.id === v);
                    if (anim?.pro && gatePro("Glow Animation: " + anim.label)) return;
                    updateSelected({ animation: v === "none" ? undefined : v });
                  }}
                >
                  <SelectTrigger className="glass h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {PRO_ANIMATIONS.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        <span className="flex items-center gap-1.5">
                          {a.label}
                          {a.pro && (
                            <span className="px-1 py-0.5 rounded text-[7px] font-bold tracking-widest uppercase bg-accent/15 text-accent">PRO</span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Delete */}
              <Button variant="ghost" size="sm" onClick={deleteSelected} className="w-full text-destructive hover:text-destructive text-xs gap-1.5 mt-2">
                <Trash2 className="h-3.5 w-3.5" />
                Delete Element
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 gap-2">
              <MousePointer className="h-6 w-6 text-muted-foreground/20" />
              <p className="text-[10px] text-muted-foreground/40 font-['Satoshi',sans-serif] text-center">
                Select an element on the canvas to edit its properties
              </p>
            </div>
          )}

          {/* Scheduling note */}
          <div className="p-3 border-t border-border/20 mt-auto">
            <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60 flex items-center gap-1 mb-1.5">
              <Clock className="h-3 w-3" /> Scheduling
            </p>
            <p className="text-[10px] text-muted-foreground/50 font-['Satoshi',sans-serif]">
              Save your layout, then assign it to screens from the Screens page.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Fullscreen Preview ─── */}
      {fullscreenPreview && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setFullscreenPreview(false)}
          onKeyDown={(e) => e.key === "Escape" && setFullscreenPreview(false)}
          tabIndex={0}
          ref={(el) => el?.focus()}
        >
          <div className="relative" style={{ width: "100vw", height: "100vh" }}>
            {elements.map((el) => {
              const scaleX = window.innerWidth / 960;
              const scaleY = window.innerHeight / 540;
              const scale = Math.min(scaleX, scaleY);
              const offsetX = (window.innerWidth - 960 * scale) / 2;
              const offsetY = (window.innerHeight - 540 * scale) / 2;
              return (
                <div
                  key={`preview-${el.id}`}
                  className="absolute"
                  style={{
                    left: offsetX + el.x * scale,
                    top: offsetY + el.y * scale,
                    width: el.width * scale,
                    height: el.height * scale,
                    ...el.style,
                  }}
                >
                  {renderElement(el, true)}
                </div>
              );
            })}
          </div>
          {/* Exit hint */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-card/60 backdrop-blur-sm border border-border/30 text-xs text-muted-foreground font-['Satoshi',sans-serif] tracking-wider animate-fade-in">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted/30 text-foreground font-mono text-[10px]">ESC</kbd> or click anywhere to exit
          </div>
        </div>
      )}

      {/* ─── Pro Gate Modal ─── */}
      <Dialog open={proGateOpen} onOpenChange={setProGateOpen}>
        <DialogContent className="bg-transparent border-none shadow-none max-w-md p-0">
          <div className="glass glass-spotlight rounded-3xl p-8 relative overflow-hidden text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <div className="relative z-10 space-y-5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <div className="flex items-center justify-center gap-2">
                <Crown className="h-5 w-5 text-accent" />
                <span className="font-['Satoshi',sans-serif] text-sm font-bold tracking-[0.15em] uppercase text-accent">
                  Level Up Your Glow
                </span>
              </div>
              <p className="text-muted-foreground text-sm font-['Satoshi',sans-serif] leading-relaxed">
                This is a <strong className="text-foreground">Pro Feature</strong>. Unlock Weather, RSS Tickers, and unlimited screens for just <strong className="text-foreground">$9/month</strong>.
              </p>
              <Button
                onClick={() => { setProGateOpen(false); navigate("/subscription"); }}
                className="w-full bg-gradient-to-r from-primary to-glow-blue text-primary-foreground font-['Satoshi',sans-serif] font-semibold tracking-wider rounded-xl h-11 text-base animate-[studioBreatheCTA_3s_ease-in-out_infinite]"
              >
                <Crown className="h-4 w-4 mr-2" />
                Go Pro Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Media Picker Modal ─── */}
      <Dialog open={mediaPickerOpen} onOpenChange={setMediaPickerOpen}>
        <DialogContent className="bg-card border-border/30 max-w-lg max-h-[70vh] flex flex-col p-0 overflow-hidden">
          <div className="p-4 border-b border-border/20">
            <h3 className="font-['Satoshi',sans-serif] font-bold text-foreground tracking-wide flex items-center gap-2">
              <Image className="h-4 w-4 text-primary" />
              Media Library
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1">Select an image to use on the canvas</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {mediaItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Image className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground/40 font-['Satoshi',sans-serif]">No images in your library</p>
                <Button size="sm" variant="outline" onClick={() => { setMediaPickerOpen(false); navigate("/media"); }} className="text-xs gap-1.5 mt-2">
                  <Plus className="h-3 w-3" /> Upload Media
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {mediaItems.map((item) => {
                  const publicUrl = supabase.storage.from("media").getPublicUrl(item.storage_path).data.publicUrl;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        updateSelected({ content: publicUrl });
                        setMediaPickerOpen(false);
                        toast.success(`Added "${item.name}"`);
                      }}
                      className="group relative rounded-lg border border-border/30 overflow-hidden aspect-square hover:border-primary/50 hover:shadow-[0_0_12px_hsla(180,100%,32%,0.15)] transition-all"
                    >
                      <img src={publicUrl} alt={item.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] text-white font-['Satoshi',sans-serif] truncate block">{item.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes studioBreatheCTA {
          0%, 100% { box-shadow: 0 0 20px hsla(180, 100%, 32%, 0.3); }
          50% { box-shadow: 0 0 35px hsla(180, 100%, 32%, 0.5), 0 0 60px hsla(180, 100%, 32%, 0.2); }
        }
        @keyframes studioNeonFlicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; text-shadow: 0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary)); }
          20%, 24%, 55% { opacity: 0.6; text-shadow: none; }
        }
        @keyframes studioGlowBreathe {
          0%, 100% { box-shadow: 0 0 8px hsla(180, 100%, 32%, 0.2); }
          50% { box-shadow: 0 0 20px hsla(180, 100%, 32%, 0.5), 0 0 40px hsla(180, 100%, 32%, 0.15); }
        }
        @keyframes widgetSunSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes widgetTicker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .studio-neon-flicker { animation: studioNeonFlicker 2s infinite; }
        .studio-glow-breathe { animation: studioGlowBreathe 3s ease-in-out infinite; }
        @keyframes tickerScroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes alertGlitchIn {
          0% { opacity: 0; background: white; }
          25% { opacity: 1; background: #FF0033; }
          50% { opacity: 0.3; background: white; }
          75% { opacity: 1; background: #FF0033; }
          100% { opacity: 1; background: #FF0033; }
        }
        @keyframes alertLiveFlash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes alertGlowSpill {
          0%, 100% { box-shadow: 0 -20px 60px rgba(255,0,51,0.3); }
          50% { box-shadow: 0 -30px 80px rgba(255,0,51,0.5), 0 -50px 120px rgba(255,0,51,0.2); }
        }
        .alert-glitch-in { animation: alertGlitchIn 0.2s ease-out; }
        .alert-live-flash { animation: alertLiveFlash 0.5s ease-in-out infinite; }
        @keyframes weatherSunPulse {
          0%, 100% { filter: drop-shadow(0 0 12px #FFB020) drop-shadow(0 0 24px #FFB02080); transform: scale(1); }
          50% { filter: drop-shadow(0 0 20px #FFB020) drop-shadow(0 0 40px #FFB020AA); transform: scale(1.08); }
        }
        @keyframes weatherRainDrop {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(3px); }
        }
        @keyframes weatherAuroraShift {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
