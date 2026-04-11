import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CanvasElement, DEFAULT_FILTERS, MOTION_PRESETS } from "./types";
import { Sparkles, SlidersHorizontal, Zap } from "lucide-react";

interface Props {
  element: CanvasElement;
  isPro: boolean;
  onUpdate: (patch: Partial<CanvasElement>) => void;
  onGatePro: (feature: string) => boolean;
}

export function VisualEffectsPanel({ element, isPro, onUpdate, onGatePro }: Props) {
  const filters = element.filters || { ...DEFAULT_FILTERS };

  const updateFilter = (key: keyof typeof filters, value: number) => {
    onUpdate({ filters: { ...filters, [key]: value } });
  };

  const resetFilters = () => {
    onUpdate({ filters: { ...DEFAULT_FILTERS } });
  };

  const sliders: { key: keyof typeof filters; label: string; min: number; max: number; unit: string; default: number }[] = [
    { key: "blur", label: "Blur", min: 0, max: 20, unit: "px", default: 0 },
    { key: "brightness", label: "Brightness", min: 0, max: 200, unit: "%", default: 100 },
    { key: "contrast", label: "Contrast", min: 0, max: 200, unit: "%", default: 100 },
    { key: "hueRotate", label: "Hue Rotate", min: 0, max: 360, unit: "°", default: 0 },
    { key: "saturate", label: "Saturate", min: 0, max: 200, unit: "%", default: 100 },
    { key: "opacity", label: "Opacity", min: 0, max: 100, unit: "%", default: 100 },
  ];

  const hasChanges = sliders.some((s) => (filters[s.key] ?? s.default) !== s.default);

  return (
    <div className="space-y-4">
      {/* Visual Effects */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-['Satoshi',sans-serif] tracking-[0.15em] uppercase text-muted-foreground/60 flex items-center gap-1">
            <SlidersHorizontal className="h-3 w-3" /> Visual Effects
          </p>
          {hasChanges && (
            <button
              onClick={resetFilters}
              className="text-[8px] text-primary hover:text-primary/80 font-mono tracking-wider uppercase transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {sliders.map((s) => (
          <div key={s.key} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground font-['Satoshi',sans-serif]">{s.label}</span>
              <span className="text-[9px] text-muted-foreground/50 font-mono">
                {filters[s.key] ?? s.default}{s.unit}
              </span>
            </div>
            <Slider
              value={[filters[s.key] ?? s.default]}
              onValueChange={([v]) => updateFilter(s.key, v)}
              min={s.min}
              max={s.max}
              step={1}
              className="w-full"
            />
          </div>
        ))}
      </div>

      {/* Motion Preset */}
      <div className="space-y-2 pt-2 border-t border-border/20">
        <p className="text-[9px] font-['Satoshi',sans-serif] tracking-[0.15em] uppercase text-muted-foreground/60 flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Motion
        </p>
        <Select
          value={element.animation || "none"}
          onValueChange={(v) => {
            const motion = MOTION_PRESETS.find((m) => m.id === v);
            if (motion?.pro && onGatePro("Motion: " + motion.label)) return;
            onUpdate({ animation: v === "none" ? undefined : v });
          }}
        >
          <SelectTrigger className="glass h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MOTION_PRESETS.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <span className="flex items-center gap-1.5">
                  {m.label}
                  {m.pro && !isPro && (
                    <span className="px-1 py-0.5 rounded text-[7px] font-bold tracking-widest uppercase bg-accent/15 text-accent">PRO</span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Glow & Flicker for text */}
      {element.type === "text" && (
        <div className="space-y-3 pt-2 border-t border-border/20">
          <p className="text-[9px] font-['Satoshi',sans-serif] tracking-[0.15em] uppercase text-muted-foreground/60 flex items-center gap-1">
            <Zap className="h-3 w-3" /> Text Effects
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground font-['Satoshi',sans-serif]">Glow Intensity</span>
              <span className="text-[9px] text-muted-foreground/50 font-mono">{element.glowIntensity ?? 0}px</span>
            </div>
            <Slider
              value={[element.glowIntensity ?? 0]}
              onValueChange={([v]) => onUpdate({ glowIntensity: v })}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground font-['Satoshi',sans-serif]">Flicker Speed</span>
              <span className="text-[9px] text-muted-foreground/50 font-mono">{(element.flickerSpeed ?? 0) === 0 ? "Off" : element.flickerSpeed}</span>
            </div>
            <Slider
              value={[element.flickerSpeed ?? 0]}
              onValueChange={([v]) => onUpdate({ flickerSpeed: v })}
              min={0}
              max={10}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
