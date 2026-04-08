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
  Zap, Sun, CloudRain,
} from "lucide-react";

/* ───── types ───── */
interface CanvasElement {
  id: string;
  type: "image" | "video" | "text" | "widget-weather" | "widget-rss" | "widget-clock";
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
    icon: Sun, pro: true, defaultW: 200, defaultH: 160,
    preview: (
      <div className="flex flex-col items-center justify-center h-full gap-0.5 relative">
        <div className="relative">
          <Sun className="h-6 w-6 text-accent drop-shadow-[0_0_10px_hsl(var(--accent))]" style={{ animation: "widgetSunSpin 8s linear infinite" }} />
          <Cloud className="h-4 w-4 text-primary absolute -bottom-1 -right-1.5 drop-shadow-[0_0_6px_hsl(var(--primary))]" />
        </div>
        <span className="text-[11px] font-bold text-foreground mt-0.5">22°C</span>
      </div>
    ),
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

  /* ───── pro gate helper ───── */
  const gatePro = (featureName: string): boolean => {
    if (isPro) return false;
    setProGateFeature(featureName);
    setProGateOpen(true);
    return true;
  };

  /* ───── add element ───── */
  const addElement = (type: CanvasElement["type"], pro: boolean) => {
    if (pro && gatePro(type)) return;
    const id = crypto.randomUUID();
    const defaults: Partial<CanvasElement> = {
      x: 80 + Math.random() * 200,
      y: 60 + Math.random() * 120,
      width: type === "text" ? 300 : 200,
      height: type === "text" ? 60 : 150,
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
    };
    setElements((prev) => [...prev, { id, type, content: contentMap[type] || "", ...defaults } as CanvasElement]);
    setSelectedId(id);
  };

  /* ───── drag logic ───── */
  const handleCanvasMouseDown = (e: React.MouseEvent, elId: string) => {
    e.stopPropagation();
    setSelectedId(elId);
    setDraggingId(elId);
    const el = elements.find((x) => x.id === elId)!;
    const rect = canvasRef.current!.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left - el.x, y: e.clientY - rect.top - el.y });
  };

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingId || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - 50));
      const y = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - 50));
      setElements((prev) => prev.map((el) => (el.id === draggingId ? { ...el, x, y } : el)));
    },
    [draggingId, dragOffset],
  );

  const handleCanvasMouseUp = () => setDraggingId(null);

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
  const renderElement = (el: CanvasElement) => {
    const isSelected = el.id === selectedId;
    const animClass = el.animation === "pulse" ? "animate-pulse"
      : el.animation === "neon-flicker" ? "studio-neon-flicker"
      : el.animation === "glow-breathe" ? "studio-glow-breathe"
      : el.animation === "slide-in" ? "animate-fade-in"
      : "";

    return (
      <div
        key={el.id}
        className={`absolute cursor-move select-none ${animClass} ${isSelected ? "ring-2 ring-primary shadow-[0_0_16px_hsla(180,100%,32%,0.4)]" : "hover:ring-1 hover:ring-primary/30"}`}
        style={{ left: el.x, top: el.y, width: el.width, height: el.height, ...el.style }}
        onMouseDown={(e) => handleCanvasMouseDown(e, el.id)}
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
        {el.type === "widget-weather" && (
          <div className="w-full h-full rounded-lg bg-gradient-to-br from-primary/5 to-glow-blue/10 border border-primary/20 flex flex-col items-center justify-center gap-1 p-2">
            <Cloud className="h-6 w-6 text-primary" />
            <span className="text-[10px] text-muted-foreground font-['Satoshi',sans-serif]">Weather Widget</span>
            <span className="text-lg font-bold text-foreground">22°C</span>
          </div>
        )}
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
        {/* Pro badge */}
        {el.proOnly && (
          <div className="absolute -top-1.5 -right-1.5 px-1 py-0.5 rounded text-[7px] font-bold tracking-widest uppercase bg-accent text-accent-foreground shadow-[0_0_8px_hsl(var(--accent)/0.5)]">
            PRO
          </div>
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
          <Button size="sm" onClick={handleSave} className="bg-gradient-to-r from-primary to-glow-blue text-primary-foreground text-xs gap-1.5 font-semibold tracking-wider">
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* ─── Left Sidebar: Assets ─── */}
        <div className="w-56 border-r border-border/30 bg-card/30 backdrop-blur-sm flex flex-col overflow-y-auto">
          <div className="p-3 border-b border-border/20">
            <h3 className="text-[10px] font-['Satoshi',sans-serif] font-bold tracking-[0.2em] uppercase text-muted-foreground">Assets</h3>
          </div>

          {/* Free tools */}
          <div className="p-2 space-y-1">
            <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60 px-2 pt-1">Free Tools</p>
            {FREE_ASSETS.map((a) => (
              <button
                key={a.type}
                onClick={() => addElement(a.type, false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-primary/5 transition-colors font-['Satoshi',sans-serif]"
              >
                <a.icon className="h-4 w-4 text-primary" />
                {a.label}
              </button>
            ))}
          </div>

          {/* Pro tools */}
          <div className="p-2 space-y-1 border-t border-border/20">
            <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60 px-2 pt-1 flex items-center gap-1">
              Pro Tools
              <Crown className="h-3 w-3 text-accent" />
            </p>
            {PRO_ASSETS.map((a) => (
              <button
                key={a.type}
                onClick={() => addElement(a.type, true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-primary/5 transition-colors font-['Satoshi',sans-serif] relative group"
              >
                <a.icon className="h-4 w-4 text-primary" />
                {a.label}
                <span className="ml-auto px-1.5 py-0.5 rounded text-[7px] font-bold tracking-widest uppercase bg-accent/15 text-accent shadow-[0_0_6px_hsl(var(--accent)/0.3)] group-hover:shadow-[0_0_10px_hsl(var(--accent)/0.5)] transition-shadow">
                  PRO
                </span>
              </button>
            ))}
          </div>

          {/* Saved layouts */}
          <div className="p-2 space-y-1 border-t border-border/20 mt-auto">
            <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60 px-2 pt-1">Saved Layouts</p>
            {savedLayouts.length === 0 && (
              <p className="text-[10px] text-muted-foreground/40 px-2 italic font-['Satoshi',sans-serif]">No layouts yet</p>
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
            {elements.map(renderElement)}

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

              {/* Image URL */}
              {selected.type === "image" && (
                <div className="space-y-2">
                  <p className="text-[9px] font-['Satoshi',sans-serif] tracking-widest uppercase text-muted-foreground/60">Image URL</p>
                  <Input value={selected.content} onChange={(e) => updateSelected({ content: e.target.value })} placeholder="https://..." className="glass h-8 text-xs" />
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
                  Unlock Pro Glow
                </span>
              </div>
              <p className="text-muted-foreground text-sm font-['Satoshi',sans-serif] leading-relaxed">
                <strong className="text-foreground">{proGateFeature}</strong> is exclusive to Pro members.
                Get unlimited screens and pro tools for just $9/month.
              </p>
              <Button
                onClick={() => { setProGateOpen(false); navigate("/subscription"); }}
                className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-['Satoshi',sans-serif] font-semibold tracking-wider rounded-xl h-11 text-base animate-[studioBreatheCTA_3s_ease-in-out_infinite]"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
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
        .studio-neon-flicker { animation: studioNeonFlicker 2s infinite; }
        .studio-glow-breathe { animation: studioGlowBreathe 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
