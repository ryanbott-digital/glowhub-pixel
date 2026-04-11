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
import { Rnd } from "react-rnd";
import {
  Image, Video, Type, Cloud, Rss, Sparkles, Crown, Lock,
  Save, Trash2, GripVertical, Plus, Layers, Palette,
  Clock, MousePointer, Eye, EyeOff, Timer, ExternalLink, Atom,
  Zap, Sun, CloudRain, Snowflake, CloudLightning, Cloud as CloudIcon, Newspaper, Radio, Siren, MapPin,
  ZoomIn, ZoomOut, Keyboard, Loader2, LockIcon, Unlock,
  Square, Circle, Minus, SlidersHorizontal, Undo2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  CanvasElement, SavedLayout, WeatherData, DEFAULT_FILTERS,
  MOTION_PRESETS, getFilterCSS, getMotionClass,
} from "@/components/studio/types";
import { VisualEffectsPanel } from "@/components/studio/VisualEffectsPanel";
import { StudioStyles } from "@/components/studio/StudioStyles";
import { GlowFieldCanvas, DEFAULT_GLOW_FIELD } from "@/components/studio/GlowFieldCanvas";
import { SmartGuides, computeSnapGuides, type GuideLine } from "@/components/studio/SmartGuides";
import { StudioTimeline } from "@/components/studio/StudioTimeline";

/* ───── weather helpers ───── */
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
  {
    type: "shape", label: "Shape", description: "Rectangles, circles & lines",
    icon: Square, pro: false, defaultW: 150, defaultH: 150,
    preview: (
      <div className="flex flex-col items-center justify-center h-full gap-1">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-sm border-2 border-primary/60" />
          <div className="w-4 h-4 rounded-full border-2 border-accent/60" />
        </div>
        <span className="text-[9px] text-muted-foreground font-['Satoshi',sans-serif]">Shapes</span>
      </div>
    ),
  },
  {
    type: "widget-weather", label: "Live Weather", description: "Animated weather with glassmorphism card",
    icon: Sun, pro: true, defaultW: 220, defaultH: 180,
    preview: null as any,
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
        <span className="text-xs font-bold text-primary font-['Satoshi',sans-serif] tracking-wider uppercase"
          style={{ animation: "studioNeonFlicker 2s infinite", textShadow: "0 0 8px hsl(var(--primary)), 0 0 16px hsl(var(--primary))" }}>
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
  {
    type: "widget-particles", label: "Glow Field", description: "Floating glowing particle orbs",
    icon: Atom, pro: true, defaultW: 400, defaultH: 300,
    preview: (
      <div className="flex flex-col items-center justify-center h-full gap-1 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full animate-pulse"
              style={{
                width: 4 + Math.random() * 6, height: 4 + Math.random() * 6,
                background: "hsl(var(--primary))",
                boxShadow: "0 0 8px hsl(var(--primary)), 0 0 16px hsl(var(--primary) / 0.4)",
                left: `${15 + Math.random() * 70}%`, top: `${15 + Math.random() * 70}%`,
                animationDelay: `${i * 0.3}s`, animationDuration: `${1.5 + Math.random()}s`,
              }} />
          ))}
        </div>
        <Atom className="h-5 w-5 text-primary relative z-10 drop-shadow-[0_0_8px_hsl(var(--primary))]" />
        <span className="text-[9px] text-muted-foreground font-['Satoshi',sans-serif] relative z-10">Glow Field</span>
      </div>
    ),
  },
];

const WIDGET_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {};
WIDGET_LIBRARY.forEach((w) => { WIDGET_ICON_MAP[w.type] = w.icon; });

const MAX_HISTORY = 30;

export default function Studio() {
  const { user, subscriptionTier: localTier, signOut } = useAuth();
  const navigate = useNavigate();

  const [serverVerifiedPro, setServerVerifiedPro] = useState<boolean | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [layoutName, setLayoutName] = useState("Untitled Layout");
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>([]);
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null);
  const [proGateOpen, setProGateOpen] = useState(false);
  const [proGateFeature, setProGateFeature] = useState("");
  const [weatherPreview, setWeatherPreview] = useState<WeatherData | null>(null);
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  const [rssCache, setRssCache] = useState<Record<string, string[]>>({});
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<{ id: string; name: string; storage_path: string; type: string }[]>([]);
  const [sidebarMode, setSidebarMode] = useState<"properties" | "layers">("properties");
  const [zoom, setZoom] = useState(1);
  const [lightCanvas, setLightCanvas] = useState(false);
  const [canvasBg, setCanvasBg] = useState<{ type: "solid" | "gradient"; color: string; gradient?: string }>({ type: "solid", color: "" });
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [layerDragIdx, setLayerDragIdx] = useState<number | null>(null);
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);
  const [timelineDuration, setTimelineDuration] = useState(30);
  const canvasRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<CanvasElement[][]>([]);

  const isPro = serverVerifiedPro === true;
  const selected = elements.find((e) => e.id === selectedId) || null;

  // Server-side tier verification on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) { setServerVerifiedPro(false); return; }
        const res = await supabase.functions.invoke("verify-tier", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const tier = res.data?.tier || "free";
        setServerVerifiedPro(isProTier(tier));
        if (isProTier(localTier) && !isProTier(tier)) {
          await signOut();
        }
      } catch {
        setServerVerifiedPro(isProTier(localTier));
      }
    })();
  }, [user, localTier, signOut]);

  /* ───── history helpers ───── */
  const pushHistory = useCallback((snapshot: CanvasElement[]) => {
    historyRef.current = [...historyRef.current, JSON.parse(JSON.stringify(snapshot))].slice(-MAX_HISTORY);
    setHistory(historyRef.current);
  }, []);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setHistory(historyRef.current);
    setElements(prev);
  }, []);

  /* ───── data fetching ───── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: layouts } = await supabase.from("studio_layouts").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
      setSavedLayouts((layouts as any[]) || []);
      const { data: media } = await supabase.from("media").select("id, name, storage_path, type").eq("user_id", user.id).order("created_at", { ascending: false });
      setMediaItems((media as any[]) || []);
    })();
  }, [user]);

  /* ───── RSS feed fetching ───── */
  const fetchRss = useCallback(async (feedUrl: string) => {
    if (!isPro) return;
    if (rssCache[feedUrl]) return;
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/rss-proxy?url=${encodeURIComponent(feedUrl)}`);
      const data = await res.json();
      if (data.headlines?.length) {
        setRssCache((prev) => ({ ...prev, [feedUrl]: data.headlines }));
      }
    } catch (err) {
      console.error("RSS fetch failed:", err);
    }
  }, [rssCache, isPro]);

  useEffect(() => {
    elements.forEach((el) => {
      if (el.type !== "widget-ticker") return;
      try {
        const cfg = JSON.parse(el.content);
        if (cfg.source === "rss" && cfg.feedUrl && !rssCache[cfg.feedUrl]) {
          fetchRss(cfg.feedUrl);
        }
      } catch {}
    });
  }, [elements, fetchRss, rssCache]);

  /* ───── weather preview ───── */
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

  /* ───── keyboard shortcuts ───── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === "z") { e.preventDefault(); undo(); return; }
      if (meta && e.key === "s") { e.preventDefault(); handleSave(); return; }
      if ((e.key === "Delete" || e.key === "Backspace") && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        if (selectedId) {
          pushHistory(elements);
          setElements((prev) => prev.filter((el) => el.id !== selectedId));
          setSelectedId(null);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, elements, undo, pushHistory]);

  /* ───── pro gate helper ───── */
  const gatePro = (featureName: string): boolean => {
    if (isPro) return false;
    setProGateFeature(featureName);
    setProGateOpen(true);
    return true;
  };

  /* ───── add element ───── */
  const addElement = async (type: CanvasElement["type"], pro: boolean, dropPos?: { x: number; y: number }) => {
    if (pro && gatePro(type)) return;
    pushHistory(elements);
    const id = crypto.randomUUID();
    const widget = WIDGET_LIBRARY.find((w) => w.type === type);
    const w = widget?.defaultW || 200;
    const h = widget?.defaultH || 150;
    const defaults: Partial<CanvasElement> = {
      x: dropPos ? dropPos.x / zoom - w / 2 : 80 + Math.random() * 200,
      y: dropPos ? dropPos.y / zoom - h / 2 : 60 + Math.random() * 120,
      width: w,
      height: h,
      style: {},
      proOnly: pro,
      visible: true,
      locked: false,
      filters: { ...DEFAULT_FILTERS },
    };

    let contentMap: Record<string, string> = {
      image: "", video: "",
      text: "Double-click to edit",
      shape: "",
      "widget-weather": '{"city":"London"}',
      "widget-rss": '{"feed":""}',
      "widget-clock": '{"format":"24h"}',
      "widget-countdown": '{"target":"2025-12-31T00:00:00"}',
      "widget-neon-label": "GLOW",
      "widget-ticker": '{"messages":"Breaking News · Welcome to GLOW · Stay tuned","speed":"normal","color":"teal"}',
      "widget-particles": JSON.stringify(DEFAULT_GLOW_FIELD),
    };

    if (user && (type === "widget-weather" || type === "widget-rss")) {
      try {
        const widgetType = type === "widget-weather" ? "weather" : "rss";
        const { data } = await supabase
          .from("premium_widgets").select("config")
          .eq("user_id", user.id).eq("widget_type", widgetType).maybeSingle();
        if (data?.config) {
          const cfg = data.config as Record<string, any>;
          if (type === "widget-weather" && cfg.city) {
            contentMap["widget-weather"] = JSON.stringify({ city: cfg.city, unit: cfg.unit || "celsius" });
          } else if (type === "widget-rss" && cfg.feedUrl) {
            contentMap["widget-rss"] = JSON.stringify({ feed: cfg.feedUrl, speed: cfg.speed || "normal", count: cfg.count || 5 });
          }
        }
      } catch {}
    }

    const newEl: CanvasElement = {
      id, type,
      content: contentMap[type] || "",
      shapeType: type === "shape" ? "rectangle" : undefined,
      shapeFill: type === "shape" ? "hsl(var(--primary) / 0.3)" : undefined,
      shapeStroke: type === "shape" ? "hsl(var(--primary))" : undefined,
      shapeStrokeWidth: type === "shape" ? 2 : undefined,
      ...defaults,
    } as CanvasElement;

    setElements((prev) => [...prev, newEl]);
    setSelectedId(id);
  };

  /* ───── sidebar drag helpers ───── */
  const handleWidgetDragStart = (e: React.DragEvent, w: WidgetDef) => {
    e.dataTransfer.setData("widget-type", w.type);
    e.dataTransfer.setData("widget-pro", String(w.pro));
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleMediaDragStart = (e: React.DragEvent, item: { name: string; storage_path: string; type: string }) => {
    const publicUrl = supabase.storage.from("signage-content").getPublicUrl(item.storage_path).data.publicUrl;
    e.dataTransfer.setData("media-url", publicUrl);
    e.dataTransfer.setData("media-name", item.name);
    e.dataTransfer.setData("media-type", item.type);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check for media library drop
    const mediaUrl = e.dataTransfer.getData("media-url");
    if (mediaUrl) {
      pushHistory(elements);
      const mediaType = e.dataTransfer.getData("media-type");
      const isVideo = mediaType.startsWith("video");
      const id = crypto.randomUUID();
      const newEl: CanvasElement = {
        id,
        type: isVideo ? "video" : "image",
        content: mediaUrl,
        x: x / zoom - 150,
        y: y / zoom - 100,
        width: 300,
        height: 200,
        style: {},
        visible: true,
        locked: false,
        filters: { ...DEFAULT_FILTERS },
      };
      setElements((prev) => [...prev, newEl]);
      setSelectedId(id);
      toast.success(`Added "${e.dataTransfer.getData("media-name")}"`);
      return;
    }

    // Check for widget drop
    const type = e.dataTransfer.getData("widget-type") as CanvasElement["type"];
    if (!type) return;
    const pro = e.dataTransfer.getData("widget-pro") === "true";
    addElement(type, pro, { x, y });
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("widget-type") || e.dataTransfer.types.includes("media-url")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  };

  /* ───── update selected ───── */
  const updateSelected = (patch: Partial<CanvasElement>) => {
    if (!selectedId) return;
    pushHistory(elements);
    setElements((prev) => prev.map((el) => (el.id === selectedId ? { ...el, ...patch } : el)));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    pushHistory(elements);
    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setSelectedId(null);
  };

  /* ───── save / load ───── */
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const canvasData = JSON.parse(JSON.stringify({ elements, canvasBg: canvasBg.color || canvasBg.gradient ? canvasBg : undefined }));
      const payload = {
        user_id: user.id, name: layoutName,
        canvas_data: canvasData, updated_at: new Date().toISOString(),
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
      const { data: layouts } = await supabase.from("studio_layouts").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
      setSavedLayouts((layouts as any[]) || []);
    } finally {
      setSaving(false);
    }
  };

  /* ───── debounced auto-save (live sync) ───── */
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!user || !currentLayoutId) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const canvasData = JSON.parse(JSON.stringify({ elements, canvasBg: canvasBg.color || canvasBg.gradient ? canvasBg : undefined }));
        await supabase.from("studio_layouts").update({
          canvas_data: canvasData,
          updated_at: new Date().toISOString(),
        }).eq("id", currentLayoutId);
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, 1500);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [elements, canvasBg, currentLayoutId, user]);

  const handleLoad = (layout: SavedLayout) => {
    setCurrentLayoutId(layout.id);
    setLayoutName(layout.name);
    const loadedElements = ((layout.canvas_data as any).elements || []).map((el: any) => ({
      ...el, visible: el.visible ?? true, locked: el.locked ?? false,
      filters: el.filters || { ...DEFAULT_FILTERS },
    }));
    setElements(loadedElements);
    const loadedBg = (layout.canvas_data as any).canvasBg;
    setCanvasBg(loadedBg || { type: "solid", color: "" });
    setSelectedId(null);
    historyRef.current = [];
    setHistory([]);
    toast.success(`Loaded "${layout.name}"`);
  };

  const handleDelete = async (layoutId: string) => {
    const { error } = await supabase.from("studio_layouts").delete().eq("id", layoutId);
    if (error) { toast.error(error.message); return; }
    if (currentLayoutId === layoutId) { setCurrentLayoutId(null); setElements([]); setLayoutName("Untitled Layout"); }
    setSavedLayouts((prev) => prev.filter((l) => l.id !== layoutId));
    toast.success("Layout deleted");
  };

  /* ───── layer reorder ───── */
  const handleLayerDragStart = (idx: number) => setLayerDragIdx(idx);
  const handleLayerDrop = (targetIdx: number) => {
    if (layerDragIdx === null || layerDragIdx === targetIdx) { setLayerDragIdx(null); return; }
    pushHistory(elements);
    setElements((prev) => {
      const next = [...prev];
      const [moved] = next.splice(layerDragIdx, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
    setLayerDragIdx(null);
  };

  const getWidgetLabel = (el: CanvasElement) => {
    if (el.type === "text") return el.content.slice(0, 20) || "Text";
    if (el.type === "shape") return el.shapeType ? el.shapeType.charAt(0).toUpperCase() + el.shapeType.slice(1) : "Shape";
    const w = WIDGET_LIBRARY.find((w) => w.type === el.type);
    return w?.label || el.type;
  };

  /* ───── render element content ───── */
  const renderElementContent = (el: CanvasElement) => {
    const filterStr = getFilterCSS(el.filters);
    const filterStyle: React.CSSProperties = filterStr ? { filter: filterStr } : {};

    const glowStyle: React.CSSProperties = {};
    if (el.type === "text" && el.glowIntensity) {
      glowStyle.textShadow = `0 0 ${el.glowIntensity}px hsl(var(--primary)), 0 0 ${el.glowIntensity * 2}px hsl(var(--primary))`;
    }
    if (el.type === "text" && el.flickerSpeed && el.flickerSpeed > 0) {
      glowStyle.animation = `studioNeonFlicker ${Math.max(0.3, 3 - el.flickerSpeed * 0.27)}s infinite`;
    }

    return (
      <div className="w-full h-full" style={filterStyle}>
        {el.type === "text" && (
          <div className="w-full h-full flex items-center justify-center text-foreground font-['Satoshi',sans-serif] text-sm p-2 overflow-hidden" style={{ ...el.style, ...glowStyle }}>
            {el.content}
          </div>
        )}
        {el.type === "shape" && (
          <div className="w-full h-full flex items-center justify-center">
            {el.shapeType === "circle" ? (
              <div className="w-full h-full rounded-full" style={{ background: el.shapeFill, border: `${el.shapeStrokeWidth || 2}px solid ${el.shapeStroke || "hsl(var(--primary))"}` }} />
            ) : el.shapeType === "rounded-rect" ? (
              <div className="w-full h-full rounded-2xl" style={{ background: el.shapeFill, border: `${el.shapeStrokeWidth || 2}px solid ${el.shapeStroke || "hsl(var(--primary))"}` }} />
            ) : el.shapeType === "line" ? (
              <div className="w-full flex items-center justify-center h-full">
                <div className="w-full" style={{ height: el.shapeStrokeWidth || 2, background: el.shapeStroke || "hsl(var(--primary))" }} />
              </div>
            ) : (
              <div className="w-full h-full" style={{ background: el.shapeFill, border: `${el.shapeStrokeWidth || 2}px solid ${el.shapeStroke || "hsl(var(--primary))"}` }} />
            )}
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
          const auroraGrad = getAuroraGradient(wp.icon, wp.isNight);
          return (
            <div className="w-full h-full rounded-2xl overflow-hidden relative border border-primary/30 shadow-[0_0_16px_hsla(180,100%,32%,0.2)]" style={{ backdropFilter: "blur(24px)", background: "rgba(255,255,255,0.03)" }}>
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
          let cfg: any = { messages: "Breaking News · Welcome to GLOW · Stay tuned", speed: "normal", color: "teal", alertMode: false, source: "manual", feedUrl: "" };
          try { cfg = { ...cfg, ...JSON.parse(el.content) }; } catch {}
          const isAlert = cfg.alertMode === true;
          const speedMap: Record<string, string> = { slow: "30s", normal: "18s", fast: "10s" };
          const duration = speedMap[cfg.speed] || "18s";
          const textColor = isAlert ? "text-white uppercase font-extrabold" : (cfg.color === "white" ? "text-white" : "text-primary");
          const displayText = isAlert && cfg.alertMessage
            ? cfg.alertMessage
            : cfg.source === "rss" && cfg.feedUrl && rssCache[cfg.feedUrl]
              ? rssCache[cfg.feedUrl].join(" · ")
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
                <span className="text-[10px] font-bold text-white tracking-widest font-mono">LIVE</span>
              </div>
              <div className="flex-1 overflow-hidden h-full flex items-center">
                <span className={`inline-block whitespace-nowrap font-mono tracking-wider ${textColor}`}
                  style={{ animation: `tickerScroll ${duration} linear infinite`, willChange: "transform", fontSize: isAlert ? "16px" : "14px",
                    textShadow: isAlert ? "0 0 10px rgba(255,255,255,0.6)" : (cfg.color === "teal" ? "0 0 8px hsla(180,100%,32%,0.5)" : "none"),
                  }}>
                  {displayText}
                </span>
              </div>
            </div>
          );
        })()}
        {el.type === "widget-particles" && (() => {
          let cfg = { ...DEFAULT_GLOW_FIELD };
          try { cfg = { ...cfg, ...JSON.parse(el.content) }; } catch {}
          return (
            <div className="w-full h-full rounded-lg overflow-hidden border border-primary/20">
              <GlowFieldCanvas config={cfg} />
            </div>
          );
        })()}
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
          <span className="text-[9px] font-mono tracking-widest uppercase text-primary/60 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
            Creative Suite
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Input value={layoutName} onChange={(e) => setLayoutName(e.target.value)} className="glass h-8 w-48 text-xs font-['Satoshi',sans-serif]" />
          <div className="flex items-center gap-0.5 border border-border/30 rounded-md px-1">
            {[0.5, 0.75, 1].map((z) => (
              <button key={z} onClick={() => setZoom(z)}
                className={`text-[10px] font-mono px-1.5 py-1 rounded transition-colors ${zoom === z ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {z * 100}%
              </button>
            ))}
          </div>
          <Button size="icon" variant="ghost" onClick={() => setLightCanvas(!lightCanvas)} className="h-8 w-8" title={lightCanvas ? "Dark canvas" : "Light canvas"}>
            <Sun className={`h-3.5 w-3.5 transition-colors ${lightCanvas ? "text-amber-400" : ""}`} />
          </Button>
          <Button size="icon" variant="ghost" onClick={undo} disabled={history.length === 0} className="h-8 w-8" title="Undo (Ctrl+Z)">
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setFullscreenPreview(true)} className="text-xs gap-1.5 font-semibold tracking-wider border-primary/30 hover:border-primary/60">
            <Eye className="h-3.5 w-3.5" /> Preview
          </Button>
          {currentLayoutId && (
            <Button size="sm" variant="outline" onClick={() => window.open(`/studio/preview/${currentLayoutId}`, "_blank")}
              className="text-xs gap-1.5 font-semibold tracking-wider border-accent/30 hover:border-accent/60 text-accent hover:text-accent">
              <ExternalLink className="h-3.5 w-3.5" /> Live Preview
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-primary to-glow-blue text-primary-foreground text-xs gap-1.5 font-semibold tracking-wider relative overflow-hidden">
            {saving ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>) : (<><Save className="h-3.5 w-3.5" /> Save</>)}
          </Button>
        </div>
      </div>

      {/* Keyboard shortcuts */}
      <div className="flex items-center gap-3 px-4 py-1 bg-card/30 border-b border-border/20 text-[9px] text-muted-foreground/50 font-mono tracking-wider">
        <span className="flex items-center gap-1"><Keyboard className="h-3 w-3" /> Shortcuts:</span>
        <span>⌘Z Undo</span><span>⌘S Save</span><span>⌫ Delete</span>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* ─── Left Sidebar: Assets ─── */}
        <div className="w-64 border-r border-border/30 bg-[hsl(220,60%,7%)] flex flex-col overflow-y-auto">
          <div className="p-3 border-b border-border/20">
            <h3 className="text-[10px] font-['Satoshi',sans-serif] font-bold tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" /> Asset Tray
            </h3>
          </div>

          <div className="p-2.5 space-y-4 flex-1">
            <div>
              <p className="text-[9px] font-['Satoshi',sans-serif] tracking-[0.15em] uppercase text-muted-foreground/60 px-1 mb-2">Standard</p>
              <div className="grid grid-cols-2 gap-2">
                {WIDGET_LIBRARY.filter(w => !w.pro).map((w) => (
                  <button key={w.type} onClick={() => addElement(w.type, false)} draggable onDragStart={(e) => handleWidgetDragStart(e, w)}
                    className="group relative rounded-xl border border-border/30 bg-card/50 hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 aspect-square flex flex-col items-center justify-center p-2 overflow-hidden cursor-grab active:cursor-grabbing">
                    <div className="flex-1 flex items-center justify-center w-full">{w.preview}</div>
                    <span className="text-[9px] font-['Satoshi',sans-serif] text-muted-foreground mt-1 tracking-wider">{w.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[9px] font-['Satoshi',sans-serif] tracking-[0.15em] uppercase text-muted-foreground/60 px-1 mb-2 flex items-center gap-1">
                Premium <Crown className="h-3 w-3 text-accent" />
              </p>
              <div className="grid grid-cols-2 gap-2">
                {WIDGET_LIBRARY.filter(w => w.pro).map((w) => (
                  <button key={w.type} onClick={() => addElement(w.type, true)} draggable onDragStart={(e) => handleWidgetDragStart(e, w)}
                    className="group relative rounded-xl border border-border/30 bg-card/50 hover:border-primary/40 transition-all duration-300 aspect-square flex flex-col items-center justify-center p-2 overflow-hidden hover:shadow-[0_0_20px_hsla(180,100%,32%,0.15)] cursor-grab active:cursor-grabbing">
                    {!isPro && (
                      <div className="absolute top-1.5 right-1.5 z-10 px-1.5 py-0.5 rounded-md text-[7px] font-bold tracking-widest uppercase bg-accent/20 text-accent border border-accent/30">PRO</div>
                    )}
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
                          <Sun className="h-5 w-5 text-accent" /><span className="text-[11px] font-bold text-foreground mt-0.5">22°C</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] font-['Satoshi',sans-serif] text-muted-foreground mt-1 tracking-wider">{w.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Media Library */}
          <div className="p-2.5 space-y-1.5 border-t border-border/20">
            <p className="text-[9px] font-['Satoshi',sans-serif] tracking-[0.15em] uppercase text-muted-foreground/60 px-1 pt-0.5 flex items-center gap-1">
              <Image className="h-3 w-3 text-primary" /> Media Library
            </p>
            {mediaItems.length === 0 ? (
              <p className="text-[10px] text-muted-foreground/40 px-1 italic font-['Satoshi',sans-serif]">No media uploaded yet</p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto">
                {mediaItems.filter(m => m.type.startsWith("image") || m.type.startsWith("video")).slice(0, 30).map((item) => {
                  const publicUrl = supabase.storage.from("signage-content").getPublicUrl(item.storage_path).data.publicUrl;
                  const isVideo = item.type.startsWith("video");
                  return (
                    <div key={item.id} draggable onDragStart={(e) => handleMediaDragStart(e, item)}
                      className="group relative rounded-lg border border-border/30 overflow-hidden aspect-square cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-[0_0_10px_hsla(180,100%,32%,0.15)] transition-all">
                      {isVideo ? (
                        <div className="w-full h-full bg-muted/20 flex items-center justify-center">
                          <Video className="h-4 w-4 text-primary/60" />
                        </div>
                      ) : (
                        <img src={publicUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[6px] text-white font-['Satoshi',sans-serif] truncate block">{item.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-2.5 space-y-1 border-t border-border/20">
            <p className="text-[9px] font-['Satoshi',sans-serif] tracking-[0.15em] uppercase text-muted-foreground/60 px-1 pt-0.5">Saved Layouts</p>
            {savedLayouts.length === 0 && <p className="text-[10px] text-muted-foreground/40 px-1 italic font-['Satoshi',sans-serif]">No layouts yet</p>}
            {savedLayouts.map((l) => (
              <div key={l.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-primary/5 transition-colors group">
                <button onClick={() => handleLoad(l)} className="flex-1 text-left text-xs text-foreground truncate font-['Satoshi',sans-serif]">{l.name}</button>
                <button onClick={() => handleDelete(l.id)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3 w-3 text-destructive" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Center: Canvas with react-rnd layers ─── */}
        <div className={`flex-1 flex items-center justify-center relative overflow-hidden transition-colors duration-300 ${lightCanvas ? "bg-[hsl(220,20%,92%)]" : "bg-[hsl(220,60%,5%)]"}`}>
          <div className="absolute inset-0 pointer-events-none">
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[60%] rounded-3xl blur-[80px] transition-colors duration-300 ${lightCanvas ? "bg-primary/3" : "bg-primary/5"}`} />
          </div>

          <div style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 0.2s ease" }}>
            <div
              ref={canvasRef}
              className={`relative border rounded-xl overflow-hidden transition-colors duration-300 ${lightCanvas ? "bg-white border-gray-300 shadow-lg" : "bg-card/80 border-primary/20 shadow-[0_0_40px_hsla(180,100%,32%,0.15),0_0_80px_hsla(180,100%,32%,0.05)]"}`}
              style={{ width: 960, height: 540, background: canvasBg.type === "gradient" && canvasBg.gradient ? canvasBg.gradient : canvasBg.color || undefined }}
              onClick={() => setSelectedId(null)}
              onDrop={handleCanvasDrop}
              onDragOver={handleCanvasDragOver}
            >
              {/* Grid */}
              <div className={`absolute inset-0 pointer-events-none ${lightCanvas ? "opacity-[0.08]" : "opacity-[0.03]"}`}
                style={{ backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`, backgroundSize: "30px 30px" }} />

              {/* Elements rendered with react-rnd */}
              {elements.map((el) => {
                if (el.proOnly && !isPro) return null;
                const isSelected = el.id === selectedId;
                const motionClass = getMotionClass(el.animation);

                return (
                  <Rnd
                    key={el.id}
                    size={{ width: el.width, height: el.height }}
                    position={{ x: el.x, y: el.y }}
                    onDrag={(e, d) => {
                      const result = computeSnapGuides(
                        { id: el.id, x: d.x, y: d.y, width: el.width, height: el.height },
                        elements,
                      );
                      setGuides(result.guides);
                    }}
                    onDragStop={(e, d) => {
                      const result = computeSnapGuides(
                        { id: el.id, x: d.x, y: d.y, width: el.width, height: el.height },
                        elements,
                      );
                      const finalX = result.snapX ?? d.x;
                      const finalY = result.snapY ?? d.y;
                      pushHistory(elements);
                      setElements((prev) => prev.map((x) => x.id === el.id ? { ...x, x: finalX, y: finalY } : x));
                      setGuides([]);
                    }}
                    onResizeStop={(e, direction, ref, delta, position) => {
                      pushHistory(elements);
                      setElements((prev) => prev.map((x) => x.id === el.id ? {
                        ...x,
                        width: parseInt(ref.style.width),
                        height: parseInt(ref.style.height),
                        x: position.x,
                        y: position.y,
                      } : x));
                    }}
                    onMouseDown={(e: any) => {
                      e.stopPropagation();
                      setSelectedId(el.id);
                    }}
                    disableDragging={el.locked}
                    enableResizing={!el.locked}
                    bounds="parent"
                    minWidth={30}
                    minHeight={30}
                    className={`${!el.visible ? "opacity-30 pointer-events-none" : ""} ${motionClass} ${isSelected ? "ring-2 ring-primary shadow-[0_0_16px_hsla(180,100%,32%,0.4)] z-10" : "hover:ring-1 hover:ring-primary/30"}`}
                    style={{ cursor: el.locked ? "not-allowed" : "move" }}
                    resizeHandleStyles={{
                      topLeft: { width: 10, height: 10, borderRadius: "50%", background: "hsl(var(--primary))", border: "2px solid hsl(var(--background))", boxShadow: "0 0 6px hsl(var(--primary))" },
                      topRight: { width: 10, height: 10, borderRadius: "50%", background: "hsl(var(--primary))", border: "2px solid hsl(var(--background))", boxShadow: "0 0 6px hsl(var(--primary))" },
                      bottomLeft: { width: 10, height: 10, borderRadius: "50%", background: "hsl(var(--primary))", border: "2px solid hsl(var(--background))", boxShadow: "0 0 6px hsl(var(--primary))" },
                      bottomRight: { width: 10, height: 10, borderRadius: "50%", background: "hsl(var(--primary))", border: "2px solid hsl(var(--background))", boxShadow: "0 0 6px hsl(var(--primary))" },
                    }}
                    resizeHandleClasses={{
                      topLeft: isSelected ? "" : "!hidden",
                      topRight: isSelected ? "" : "!hidden",
                      bottomLeft: isSelected ? "" : "!hidden",
                      bottomRight: isSelected ? "" : "!hidden",
                      top: "!hidden", bottom: "!hidden", left: "!hidden", right: "!hidden",
                    }}
                  >
                    {/* Lock badge */}
                    {el.locked && (
                      <div className="absolute top-0.5 left-0.5 z-30 p-0.5 rounded bg-muted/80">
                        <LockIcon className="h-2.5 w-2.5 text-muted-foreground" />
                      </div>
                    )}
                    {renderElementContent(el)}
                  </Rnd>
                );
              })}

              {/* Smart Guides */}
              <SmartGuides guides={guides} />

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
        </div>

        {/* ─── Right Sidebar: Properties Panel ─── */}
        <div className="w-64 border-l border-border/30 bg-[hsl(220,60%,7%)] flex flex-col overflow-y-auto">
          {/* Tabs */}
          <div className="flex border-b border-border/20">
            <button onClick={() => setSidebarMode("properties")}
              className={`flex-1 py-2 text-[10px] font-['Satoshi',sans-serif] font-bold tracking-[0.15em] uppercase transition-colors ${sidebarMode === "properties" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
              Properties
            </button>
            <button onClick={() => setSidebarMode("layers")}
              className={`flex-1 py-2 text-[10px] font-['Satoshi',sans-serif] font-bold tracking-[0.15em] uppercase transition-colors ${sidebarMode === "layers" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
              Layers
            </button>
          </div>

          {sidebarMode === "layers" ? (
            <div className="p-2 space-y-0.5 flex-1">
              {elements.length === 0 && <p className="text-[10px] text-muted-foreground/40 text-center py-8 font-['Satoshi',sans-serif]">No layers yet</p>}
              {[...elements].reverse().map((el, revIdx) => {
                const realIdx = elements.length - 1 - revIdx;
                const WidgetIcon = WIDGET_ICON_MAP[el.type] || (el.type === "shape" ? Square : Layers);
                const isActive = el.id === selectedId;
                return (
                  <div key={el.id} draggable onDragStart={() => handleLayerDragStart(realIdx)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleLayerDrop(realIdx)}
                    onClick={() => { setSelectedId(el.id); setSidebarMode("properties"); }}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-xs ${isActive ? "ring-1 ring-primary bg-primary/10" : "hover:bg-muted/20"}`}>
                    <GripVertical className="h-3 w-3 text-muted-foreground/30 shrink-0 cursor-grab" />
                    <WidgetIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className={`flex-1 truncate font-['Satoshi',sans-serif] text-[11px] ${!el.visible ? "line-through text-muted-foreground/40" : "text-foreground"}`}>
                      {getWidgetLabel(el)}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); pushHistory(elements); setElements((prev) => prev.map((x) => x.id === el.id ? { ...x, visible: !x.visible } : x)); }}
                      className="p-0.5 rounded hover:bg-muted/30 transition-colors" title={el.visible ? "Hide" : "Show"}>
                      {el.visible ? <Eye className="h-3 w-3 text-muted-foreground/60" /> : <EyeOff className="h-3 w-3 text-muted-foreground/30" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); pushHistory(elements); setElements((prev) => prev.map((x) => x.id === el.id ? { ...x, locked: !x.locked } : x)); }}
                      className="p-0.5 rounded hover:bg-muted/30 transition-colors" title={el.locked ? "Unlock" : "Lock"}>
                      {el.locked ? <LockIcon className="h-3 w-3 text-accent/60" /> : <Unlock className="h-3 w-3 text-muted-foreground/30" />}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              {selected ? (
                <div className="p-3 space-y-4 flex-1 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-['Satoshi',sans-serif] font-bold tracking-[0.15em] uppercase text-primary">
                      {getWidgetLabel(selected)}
                    </p>
                    <span className="text-[8px] font-mono text-muted-foreground/40">{selected.type}</span>
                  </div>

                  {/* Position & Size */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60">Position & Size</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] text-muted-foreground font-mono">X</label>
                        <Input type="number" value={Math.round(selected.x)} onChange={(e) => updateSelected({ x: Number(e.target.value) })} className="glass h-7 text-xs font-mono" />
                      </div>
                      <div>
                        <label className="text-[8px] text-muted-foreground font-mono">Y</label>
                        <Input type="number" value={Math.round(selected.y)} onChange={(e) => updateSelected({ y: Number(e.target.value) })} className="glass h-7 text-xs font-mono" />
                      </div>
                      <div>
                        <label className="text-[8px] text-muted-foreground font-mono">W</label>
                        <Input type="number" value={Math.round(selected.width)} onChange={(e) => updateSelected({ width: Number(e.target.value) })} className="glass h-7 text-xs font-mono" />
                      </div>
                      <div>
                        <label className="text-[8px] text-muted-foreground font-mono">H</label>
                        <Input type="number" value={Math.round(selected.height)} onChange={(e) => updateSelected({ height: Number(e.target.value) })} className="glass h-7 text-xs font-mono" />
                      </div>
                    </div>
                  </div>

                  {/* Text content */}
                  {selected.type === "text" && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60">Content</p>
                      <Input value={selected.content} onChange={(e) => updateSelected({ content: e.target.value })} className="glass h-8 text-xs" />
                    </div>
                  )}
                  {selected.type === "widget-neon-label" && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60">Label Text</p>
                      <Input value={selected.content} onChange={(e) => updateSelected({ content: e.target.value })} className="glass h-8 text-xs" />
                    </div>
                  )}

                  {/* Shape config */}
                  {selected.type === "shape" && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60">Shape Type</p>
                        <Select value={selected.shapeType || "rectangle"} onValueChange={(v) => updateSelected({ shapeType: v as any })}>
                          <SelectTrigger className="glass h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rectangle"><span className="flex items-center gap-1.5"><Square className="h-3 w-3" /> Rectangle</span></SelectItem>
                            <SelectItem value="rounded-rect"><span className="flex items-center gap-1.5"><Square className="h-3 w-3" /> Rounded Rect</span></SelectItem>
                            <SelectItem value="circle"><span className="flex items-center gap-1.5"><Circle className="h-3 w-3" /> Circle</span></SelectItem>
                            <SelectItem value="line"><span className="flex items-center gap-1.5"><Minus className="h-3 w-3" /> Line</span></SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-muted-foreground font-['Satoshi',sans-serif]">Fill</label>
                          <input type="color" value={selected.shapeFill?.startsWith("#") ? selected.shapeFill : "#00b4d8"}
                            onChange={(e) => updateSelected({ shapeFill: e.target.value })} className="w-full h-7 rounded cursor-pointer bg-transparent" />
                        </div>
                        <div>
                          <label className="text-[9px] text-muted-foreground font-['Satoshi',sans-serif]">Stroke</label>
                          <input type="color" value={selected.shapeStroke?.startsWith("#") ? selected.shapeStroke : "#00b4d8"}
                            onChange={(e) => updateSelected({ shapeStroke: e.target.value })} className="w-full h-7 rounded cursor-pointer bg-transparent" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-muted-foreground font-['Satoshi',sans-serif]">Stroke Width</span>
                          <span className="text-[9px] text-muted-foreground/50 font-mono">{selected.shapeStrokeWidth ?? 2}px</span>
                        </div>
                        <Slider value={[selected.shapeStrokeWidth ?? 2]} onValueChange={([v]) => updateSelected({ shapeStrokeWidth: v })} min={0} max={20} step={1} className="w-full" />
                      </div>
                    </div>
                  )}

                  {/* Particle / Glow Field config */}
                  {selected.type === "widget-particles" && (() => {
                    let cfg = { ...DEFAULT_GLOW_FIELD };
                    try { cfg = { ...cfg, ...JSON.parse(selected.content) }; } catch {}
                    const updateCfg = (patch: Partial<typeof cfg>) => updateSelected({ content: JSON.stringify({ ...cfg, ...patch }) });
                    return (
                      <div className="space-y-3">
                        <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60 flex items-center gap-1">
                          <Atom className="h-3 w-3 text-primary" /> Glow Field
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-muted-foreground font-['Satoshi',sans-serif]">Density</span>
                            <span className="text-[9px] text-muted-foreground/50 font-mono">{cfg.density}</span>
                          </div>
                          <Slider value={[cfg.density]} onValueChange={([v]) => updateCfg({ density: v })} min={5} max={100} step={1} className="w-full" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-muted-foreground font-['Satoshi',sans-serif]">Speed</span>
                            <span className="text-[9px] text-muted-foreground/50 font-mono">{cfg.speed}</span>
                          </div>
                          <Slider value={[cfg.speed]} onValueChange={([v]) => updateCfg({ speed: v })} min={1} max={10} step={1} className="w-full" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-muted-foreground font-['Satoshi',sans-serif]">Glow Radius</span>
                            <span className="text-[9px] text-muted-foreground/50 font-mono">{cfg.glow}px</span>
                          </div>
                          <Slider value={[cfg.glow]} onValueChange={([v]) => updateCfg({ glow: v })} min={5} max={60} step={1} className="w-full" />
                        </div>
                        <div>
                          <label className="text-[9px] text-muted-foreground font-['Satoshi',sans-serif]">Particle Color</label>
                          <div className="flex items-center gap-2 mt-1">
                            <input type="color" value={cfg.color} onChange={(e) => updateCfg({ color: e.target.value })}
                              className="w-8 h-7 rounded cursor-pointer bg-transparent border border-border/30" />
                            <Input value={cfg.color} onChange={(e) => updateCfg({ color: e.target.value })} className="glass h-7 text-xs font-mono flex-1" />
                          </div>
                          <div className="flex gap-1.5 mt-2">
                            {[
                              { label: "Teal", color: "#00b4d8" },
                              { label: "Purple", color: "#a78bfa" },
                              { label: "Gold", color: "#f59e0b" },
                              { label: "Pink", color: "#ec4899" },
                              { label: "Green", color: "#10b981" },
                              { label: "White", color: "#e2e8f0" },
                            ].map((p) => (
                              <button key={p.label} onClick={() => updateCfg({ color: p.color })}
                                className="w-6 h-6 rounded-full border border-border/30 hover:scale-110 transition-transform"
                                style={{ background: p.color, boxShadow: cfg.color === p.color ? `0 0 8px ${p.color}` : undefined }}
                                title={p.label} />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  {/* Ticker config */}
                  {selected.type === "widget-ticker" && (() => {
                    let cfg: any = { messages: "", speed: "normal", color: "teal", alertMode: false, source: "manual", feedUrl: "" };
                    try { cfg = { ...cfg, ...JSON.parse(selected.content) }; } catch {}
                    const updateCfg = (patch: Record<string, any>) => updateSelected({ content: JSON.stringify({ ...cfg, ...patch }) });
                    return (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60 flex items-center gap-1"><Radio className="h-3 w-3" /> Source</p>
                          <Select value={cfg.source || "manual"} onValueChange={(v) => updateCfg({ source: v })}>
                            <SelectTrigger className="glass h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">Manual Text</SelectItem>
                              <SelectItem value="rss">RSS Feed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {cfg.source === "manual" ? (
                          <div className="space-y-1.5">
                            <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60">Messages (· separated)</p>
                            <Input value={cfg.messages || ""} onChange={(e) => updateCfg({ messages: e.target.value })} placeholder="Breaking News · Story 2" className="glass h-8 text-xs font-mono" />
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60">Feed URL</p>
                            <Input value={cfg.feedUrl || ""} onChange={(e) => updateCfg({ feedUrl: e.target.value })} placeholder="https://feeds.bbci.co.uk/news/rss.xml" className="glass h-8 text-xs font-mono" />
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60">Speed</p>
                          <Select value={cfg.speed} onValueChange={(v) => updateCfg({ speed: v })}>
                            <SelectTrigger className="glass h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="slow">Slow</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="fast">Fast</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5 pt-1 border-t border-border/20">
                          <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase flex items-center gap-1" style={{ color: cfg.alertMode ? "#FF0033" : "hsl(var(--muted-foreground) / 0.6)" }}>
                            <Siren className="h-3 w-3" /> Emergency Flash
                          </p>
                          <div className="flex items-center gap-2">
                            <Switch checked={!!cfg.alertMode} onCheckedChange={(v) => updateCfg({ alertMode: v })} className="data-[state=checked]:bg-[#FF0033]" />
                            <span className="text-[10px] text-muted-foreground font-['Satoshi',sans-serif]">{cfg.alertMode ? "Alert Active" : "Off"}</span>
                          </div>
                          {cfg.alertMode && (
                            <Input value={cfg.alertMessage || ""} onChange={(e) => updateCfg({ alertMessage: e.target.value.slice(0, 200) })} placeholder="⚠ BREAKING..." className="glass h-8 text-xs font-mono border-[#FF0033]/30" maxLength={200} />
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Weather config */}
                  {selected.type === "widget-weather" && (() => {
                    let cfg: any = { city: "auto" };
                    try { cfg = { ...cfg, ...JSON.parse(selected.content) }; } catch {}
                    const isAuto = cfg.city === "auto";
                    const updateCfg = (patch: Record<string, any>) => updateSelected({ content: JSON.stringify({ ...cfg, ...patch }) });
                    return (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60 flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</p>
                          <div className="flex items-center gap-2">
                            <Switch checked={isAuto} onCheckedChange={(v) => updateCfg({ city: v ? "auto" : "London" })} />
                            <span className="text-[10px] text-muted-foreground font-['Satoshi',sans-serif]">{isAuto ? "Auto-detect" : "Manual"}</span>
                          </div>
                          {!isAuto && <Input value={cfg.city} onChange={(e) => updateCfg({ city: e.target.value })} placeholder="City name..." className="glass h-8 text-xs" />}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Image source */}
                  {selected.type === "image" && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60">Image Source</p>
                      <Button size="sm" variant="outline" className="w-full text-xs gap-1.5 border-primary/30 hover:border-primary/60"
                        onClick={async () => {
                          if (!user) return;
                          const { data } = await supabase.from("media").select("id, name, storage_path, type").eq("user_id", user.id).eq("type", "image").order("created_at", { ascending: false });
                          setMediaItems(data || []);
                          setMediaPickerOpen(true);
                        }}>
                        <Image className="h-3.5 w-3.5" /> Pick from Media Library
                      </Button>
                      {selected.content && <div className="rounded-lg border border-border/20 overflow-hidden"><img src={selected.content} alt="" className="w-full h-20 object-cover" /></div>}
                      <p className="text-[8px] text-muted-foreground/40 font-['Satoshi',sans-serif]">Or paste a URL:</p>
                      <Input value={selected.content} onChange={(e) => updateSelected({ content: e.target.value })} placeholder="https://..." className="glass h-7 text-xs" />
                    </div>
                  )}

                  {/* Colors */}
                  {selected.type !== "shape" && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60 flex items-center gap-1"><Palette className="h-3 w-3" /> Colors</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-muted-foreground font-['Satoshi',sans-serif]">BG</label>
                          <input type="color" value={selected.style.backgroundColor || "#1a1a2e"} onChange={(e) => updateSelected({ style: { ...selected.style, backgroundColor: e.target.value } })} className="w-full h-7 rounded cursor-pointer bg-transparent" />
                        </div>
                        <div>
                          <label className="text-[9px] text-muted-foreground font-['Satoshi',sans-serif]">Text</label>
                          <input type="color" value={selected.style.color || "#ffffff"} onChange={(e) => updateSelected({ style: { ...selected.style, color: e.target.value } })} className="w-full h-7 rounded cursor-pointer bg-transparent" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Font size */}
                  {selected.type === "text" && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60">Font Size</p>
                      <Slider value={[parseInt(selected.style.fontSize || "14")]} onValueChange={([v]) => updateSelected({ style: { ...selected.style, fontSize: `${v}px` } })} min={8} max={120} step={1} className="w-full" />
                      <span className="text-[10px] text-muted-foreground font-mono">{selected.style.fontSize || "14px"}</span>
                    </div>
                  )}

                  {/* ─── Visual Effects & Motion ─── */}
                  <div className="pt-2 border-t border-border/20">
                    <VisualEffectsPanel
                      element={selected}
                      isPro={isPro}
                      onUpdate={updateSelected}
                      onGatePro={gatePro}
                    />
                  </div>

                  {/* Delete */}
                  <Button variant="ghost" size="sm" onClick={deleteSelected} className="w-full text-destructive hover:text-destructive text-xs gap-1.5 mt-2">
                    <Trash2 className="h-3.5 w-3.5" /> Delete Element
                  </Button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col p-3 gap-4">
                  <div className="flex flex-col items-center gap-2 py-4">
                    <MousePointer className="h-6 w-6 text-muted-foreground/20" />
                    <p className="text-[10px] text-muted-foreground/40 font-['Satoshi',sans-serif] text-center">
                      Select an element on the canvas to edit its properties
                    </p>
                  </div>

                  {/* Canvas Background */}
                  <div className="space-y-3 border-t border-border/20 pt-3">
                    <p className="text-[9px] font-['Satoshi',sans-serif] tracking-[0.15em] uppercase text-muted-foreground/60 flex items-center gap-1.5">
                      <Palette className="h-3 w-3 text-primary" /> Canvas Background
                    </p>

                    <div className="flex gap-1.5">
                      <button onClick={() => setCanvasBg((prev) => ({ ...prev, type: "solid" }))}
                        className={`flex-1 text-[9px] font-['Satoshi',sans-serif] tracking-wider py-1.5 rounded-md transition-colors ${canvasBg.type === "solid" ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground border border-border/30"}`}>
                        Solid
                      </button>
                      <button onClick={() => setCanvasBg((prev) => ({ ...prev, type: "gradient" }))}
                        className={`flex-1 text-[9px] font-['Satoshi',sans-serif] tracking-wider py-1.5 rounded-md transition-colors ${canvasBg.type === "gradient" ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground border border-border/30"}`}>
                        Gradient
                      </button>
                    </div>

                    {canvasBg.type === "solid" ? (
                      <div className="space-y-2">
                        <label className="text-[8px] text-muted-foreground font-['Satoshi',sans-serif]">Color</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={canvasBg.color || "#0B1120"}
                            onChange={(e) => setCanvasBg({ type: "solid", color: e.target.value })}
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border border-border/30" />
                          <Input value={canvasBg.color || ""} placeholder="#0B1120"
                            onChange={(e) => setCanvasBg({ type: "solid", color: e.target.value })}
                            className="glass h-7 text-xs font-mono flex-1" />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-[8px] text-muted-foreground font-['Satoshi',sans-serif]">Gradient CSS</label>
                        <Input value={canvasBg.gradient || ""} placeholder="linear-gradient(135deg, #0B1120, #1a1a2e)"
                          onChange={(e) => setCanvasBg({ type: "gradient", color: "", gradient: e.target.value })}
                          className="glass h-7 text-xs font-mono" />
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { label: "Midnight", val: "linear-gradient(135deg, #0B1120, #1a1a2e)" },
                            { label: "Ocean", val: "linear-gradient(135deg, #0c1d3d, #0d4f6e)" },
                            { label: "Sunset", val: "linear-gradient(135deg, #2d1b3d, #8b3a2e)" },
                            { label: "Forest", val: "linear-gradient(135deg, #0b1d0e, #1a3d2e)" },
                            { label: "Neon", val: "linear-gradient(135deg, #0a0a1a, #001a2c, #0a0a1a)" },
                            { label: "Warm", val: "linear-gradient(180deg, #1a0f0a, #2d1810)" },
                            { label: "Purple", val: "linear-gradient(135deg, #10061a, #2a1040)" },
                            { label: "Steel", val: "linear-gradient(135deg, #1a1a2e, #2a2a3e)" },
                          ].map((preset) => (
                            <button key={preset.label} onClick={() => setCanvasBg({ type: "gradient", color: "", gradient: preset.val })}
                              className="rounded-md aspect-square border border-border/30 hover:border-primary/50 transition-all relative group overflow-hidden"
                              style={{ background: preset.val }}>
                              <span className="absolute inset-x-0 bottom-0 text-[6px] text-white/70 font-['Satoshi',sans-serif] text-center py-0.5 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                {preset.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {(canvasBg.color || canvasBg.gradient) && (
                      <Button variant="ghost" size="sm" onClick={() => setCanvasBg({ type: "solid", color: "" })}
                        className="w-full text-[10px] text-muted-foreground hover:text-foreground gap-1">
                        <Trash2 className="h-3 w-3" /> Reset Background
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
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

      {/* ─── Timeline / Sequencer ─── */}
      <StudioTimeline
        elements={elements}
        selectedId={selectedId}
        onSelectElement={(id) => { setSelectedId(id); setSidebarMode("properties"); }}
        onUpdateElement={(id, patch) => {
          pushHistory(elements);
          setElements((prev) => prev.map((el) => el.id === id ? { ...el, ...patch } : el));
        }}
        collapsed={timelineCollapsed}
        onToggleCollapse={() => setTimelineCollapsed(!timelineCollapsed)}
        totalDuration={timelineDuration}
      />

      {/* ─── Fullscreen Preview ─── */}
      {fullscreenPreview && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setFullscreenPreview(false)}
          onKeyDown={(e) => e.key === "Escape" && setFullscreenPreview(false)} tabIndex={0} ref={(el) => el?.focus()}>
          <div className="relative" style={{ width: "100vw", height: "100vh", background: canvasBg.type === "gradient" && canvasBg.gradient ? canvasBg.gradient : canvasBg.color || undefined }}>
            {elements.filter((el) => el.visible).map((el) => {
              const scaleX = window.innerWidth / 960;
              const scaleY = window.innerHeight / 540;
              const scale = Math.min(scaleX, scaleY);
              const offsetX = (window.innerWidth - 960 * scale) / 2;
              const offsetY = (window.innerHeight - 540 * scale) / 2;
              const motionClass = getMotionClass(el.animation);
              const filterStr = getFilterCSS(el.filters);
              return (
                <div key={`preview-${el.id}`} className={`absolute ${motionClass}`}
                  style={{ left: offsetX + el.x * scale, top: offsetY + el.y * scale, width: el.width * scale, height: el.height * scale, filter: filterStr || undefined }}>
                  {renderElementContent(el)}
                </div>
              );
            })}
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-card/60 backdrop-blur-sm border border-border/30 text-xs text-muted-foreground font-['Satoshi',sans-serif] tracking-wider animate-fade-in">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted/30 text-foreground font-mono text-[10px]">ESC</kbd> or click anywhere to exit
          </div>
        </div>
      )}

      {/* Saving Overlay */}
      {saving && (
        <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="text-sm text-foreground font-['Satoshi',sans-serif] tracking-wider">Saving to Cloud...</p>
          </div>
        </div>
      )}

      {/* Pro Gate Modal */}
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
                <span className="font-['Satoshi',sans-serif] text-sm font-bold tracking-[0.15em] uppercase text-accent">Level Up Your Glow</span>
              </div>
              <p className="text-muted-foreground text-sm font-['Satoshi',sans-serif] leading-relaxed">
                This is a <strong className="text-foreground">Pro Feature</strong>. Unlock Weather, RSS Tickers, and unlimited screens for just <strong className="text-foreground">$9/month</strong>.
              </p>
              <Button onClick={() => { setProGateOpen(false); navigate("/subscription"); }}
                className="w-full bg-gradient-to-r from-primary to-glow-blue text-primary-foreground font-['Satoshi',sans-serif] font-semibold tracking-wider rounded-xl h-11 text-base">
                <Crown className="h-4 w-4 mr-2" /> Go Pro Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Picker Modal */}
      <Dialog open={mediaPickerOpen} onOpenChange={setMediaPickerOpen}>
        <DialogContent className="bg-card border-border/30 max-w-lg max-h-[70vh] flex flex-col p-0 overflow-hidden">
          <div className="p-4 border-b border-border/20">
            <h3 className="font-['Satoshi',sans-serif] font-bold text-foreground tracking-wide flex items-center gap-2">
              <Image className="h-4 w-4 text-primary" /> Media Library
            </h3>
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
                  const publicUrl = supabase.storage.from("signage-content").getPublicUrl(item.storage_path).data.publicUrl;
                  return (
                    <button key={item.id} onClick={() => { updateSelected({ content: publicUrl }); setMediaPickerOpen(false); toast.success(`Added "${item.name}"`); }}
                      className="group relative rounded-lg border border-border/30 overflow-hidden aspect-square hover:border-primary/50 hover:shadow-[0_0_12px_hsla(180,100%,32%,0.15)] transition-all">
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

      <StudioStyles />
    </div>
  );
}
