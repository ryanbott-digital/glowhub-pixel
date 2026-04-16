import React, { useMemo } from "react";
import { useIsTablet } from "@/hooks/use-mobile";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Clock, Play, Square as StopIcon, ChevronUp, ChevronDown,
  GripVertical, Eye, EyeOff,
} from "lucide-react";
import type { CanvasElement } from "./types";

const ENTRANCE_PRESETS = [
  { id: "none", label: "None" },
  { id: "fade-in", label: "Fade In" },
  { id: "slide-left", label: "Slide Left" },
  { id: "slide-right", label: "Slide Right" },
  { id: "slide-up", label: "Slide Up" },
  { id: "scale-up", label: "Scale Up" },
  { id: "blur-in", label: "Blur In" },
] as const;

const EXIT_PRESETS = [
  { id: "none", label: "None" },
  { id: "fade-out", label: "Fade Out" },
  { id: "slide-left-out", label: "Slide Left" },
  { id: "slide-right-out", label: "Slide Right" },
  { id: "slide-down-out", label: "Slide Down" },
  { id: "scale-down", label: "Scale Down" },
  { id: "blur-out", label: "Blur Out" },
] as const;

export { ENTRANCE_PRESETS, EXIT_PRESETS };

interface Props {
  elements: CanvasElement[];
  selectedId: string | null;
  onSelectElement: (id: string) => void;
  onUpdateElement: (id: string, patch: Partial<CanvasElement>) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  totalDuration: number;
}

const WIDGET_ICON_MAP: Record<string, string> = {
  text: "Aa",
  image: "🖼",
  video: "▶",
  shape: "◼",
  "widget-clock": "🕐",
  "widget-weather": "☀",
  "widget-rss": "📡",
  "widget-countdown": "⏱",
  "widget-neon-label": "✨",
  "widget-ticker": "📰",
  "widget-particles": "⚛",
};

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function StudioTimeline({
  elements,
  selectedId,
  onSelectElement,
  onUpdateElement,
  collapsed,
  onToggleCollapse,
  totalDuration,
}: Props) {
  const timeMarks = useMemo(() => {
    const marks: number[] = [];
    const step = totalDuration <= 30 ? 5 : totalDuration <= 60 ? 10 : 15;
    for (let i = 0; i <= totalDuration; i += step) marks.push(i);
    return marks;
  }, [totalDuration]);

  return (
    <div className="border-t border-border/30 bg-[hsl(220,60%,7%)] flex flex-col">
      {/* Header */}
      <button
        onClick={onToggleCollapse}
        className="flex items-center justify-between px-4 py-1.5 hover:bg-primary/5 transition-colors"
      >
        <span className="text-[10px] font-['Satoshi',sans-serif] font-bold tracking-[0.15em] uppercase text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-primary" /> Timeline · Sequencer
        </span>
        {collapsed ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {!collapsed && (
        <div className="flex flex-col max-h-48 overflow-y-auto">
          {/* Time ruler */}
          <div className="flex items-center h-6 border-b border-border/20 pl-[180px] pr-4 relative">
            <div className="flex-1 relative h-full">
              {timeMarks.map((t) => (
                <div
                  key={t}
                  className="absolute top-0 h-full flex flex-col items-center"
                  style={{ left: `${(t / totalDuration) * 100}%` }}
                >
                  <div className="w-px h-2 bg-muted-foreground/30" />
                  <span className="text-[7px] font-mono text-muted-foreground/50">
                    {formatTime(t)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Element rows */}
          {elements.length === 0 && (
            <div className="py-4 text-center text-[10px] text-muted-foreground/30 font-['Satoshi',sans-serif]">
              Add elements to see the timeline
            </div>
          )}
          {[...elements].reverse().map((el) => {
            const enterDelay = el.enterDelay ?? 0;
            const enterDuration = el.enterDuration ?? 0.5;
            const exitDelay = el.exitDelay ?? totalDuration;
            const isActive = el.id === selectedId;

            const startPct = (enterDelay / totalDuration) * 100;
            const endPct = (exitDelay / totalDuration) * 100;
            const widthPct = Math.max(endPct - startPct, 1);

            return (
              <div
                key={el.id}
                onClick={() => onSelectElement(el.id)}
                className={`flex items-center h-9 border-b border-border/10 transition-colors cursor-pointer ${
                  isActive
                    ? "bg-primary/10"
                    : "hover:bg-muted/10"
                }`}
              >
                {/* Label */}
                <div className="w-[180px] shrink-0 flex items-center gap-1.5 px-3">
                  <span className="text-[11px] w-4 text-center">
                    {WIDGET_ICON_MAP[el.type] || "▪"}
                  </span>
                  <span
                    className={`text-[10px] font-['Satoshi',sans-serif] truncate flex-1 ${
                      !el.visible
                        ? "text-muted-foreground/30 line-through"
                        : "text-foreground"
                    }`}
                  >
                    {el.type === "text"
                      ? el.content.slice(0, 16) || "Text"
                      : el.type.replace("widget-", "").replace("-", " ")}
                  </span>
                </div>

                {/* Timeline bar */}
                <div className="flex-1 h-full relative pr-4">
                  <div className="absolute inset-y-1 left-0 right-4">
                    {/* Track background */}
                    <div className="absolute inset-0 rounded bg-muted/10" />
                    {/* Active bar */}
                    <div
                      className={`absolute top-0 bottom-0 rounded-md transition-all ${
                        isActive
                          ? "bg-primary/40 border border-primary/60 shadow-[0_0_8px_hsla(180,100%,32%,0.3)]"
                          : "bg-primary/20 border border-primary/20"
                      }`}
                      style={{
                        left: `${startPct}%`,
                        width: `${widthPct}%`,
                      }}
                    >
                      {/* Entrance indicator */}
                      {el.entranceAnim && el.entranceAnim !== "none" && (
                        <div
                          className="absolute left-0 top-0 bottom-0 rounded-l-md bg-accent/30 border-r border-accent/40"
                          style={{
                            width: `${Math.min(
                              ((enterDuration / (exitDelay - enterDelay)) * 100),
                              30
                            )}%`,
                            minWidth: 4,
                          }}
                        />
                      )}
                      {/* Exit indicator */}
                      {el.exitAnim && el.exitAnim !== "none" && (
                        <div
                          className="absolute right-0 top-0 bottom-0 rounded-r-md bg-destructive/20 border-l border-destructive/30"
                          style={{ width: 6, minWidth: 4 }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Selected element timing controls */}
          {selectedId && (() => {
            const sel = elements.find((e) => e.id === selectedId);
            if (!sel) return null;
            return (
              <div className="px-4 py-2 border-t border-border/20 bg-card/30 flex flex-wrap gap-x-4 gap-y-2 items-end">
                <div className="space-y-0.5 min-w-[120px]">
                  <span className="text-[8px] text-muted-foreground font-['Satoshi',sans-serif] tracking-wider uppercase">
                    Enter at
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Slider
                      value={[sel.enterDelay ?? 0]}
                      onValueChange={([v]) =>
                        onUpdateElement(sel.id, { enterDelay: v })
                      }
                      min={0}
                      max={totalDuration}
                      step={0.5}
                      className="w-20"
                    />
                    <span className="text-[9px] font-mono text-muted-foreground/60 w-8">
                      {(sel.enterDelay ?? 0).toFixed(1)}s
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5 min-w-[120px]">
                  <span className="text-[8px] text-muted-foreground font-['Satoshi',sans-serif] tracking-wider uppercase">
                    Exit at
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Slider
                      value={[sel.exitDelay ?? totalDuration]}
                      onValueChange={([v]) =>
                        onUpdateElement(sel.id, { exitDelay: v })
                      }
                      min={0}
                      max={totalDuration}
                      step={0.5}
                      className="w-20"
                    />
                    <span className="text-[9px] font-mono text-muted-foreground/60 w-8">
                      {(sel.exitDelay ?? totalDuration).toFixed(1)}s
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5 min-w-[90px]">
                  <span className="text-[8px] text-muted-foreground font-['Satoshi',sans-serif] tracking-wider uppercase">
                    Entrance
                  </span>
                  <Select
                    value={sel.entranceAnim || "none"}
                    onValueChange={(v) =>
                      onUpdateElement(sel.id, { entranceAnim: v })
                    }
                  >
                    <SelectTrigger className="glass h-6 text-[9px] w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTRANCE_PRESETS.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-0.5 min-w-[90px]">
                  <span className="text-[8px] text-muted-foreground font-['Satoshi',sans-serif] tracking-wider uppercase">
                    Exit
                  </span>
                  <Select
                    value={sel.exitAnim || "none"}
                    onValueChange={(v) =>
                      onUpdateElement(sel.id, { exitAnim: v })
                    }
                  >
                    <SelectTrigger className="glass h-6 text-[9px] w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXIT_PRESETS.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-0.5 min-w-[100px]">
                  <span className="text-[8px] text-muted-foreground font-['Satoshi',sans-serif] tracking-wider uppercase">
                    Anim Duration
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Slider
                      value={[sel.enterDuration ?? 0.5]}
                      onValueChange={([v]) =>
                        onUpdateElement(sel.id, { enterDuration: v })
                      }
                      min={0.1}
                      max={3}
                      step={0.1}
                      className="w-16"
                    />
                    <span className="text-[9px] font-mono text-muted-foreground/60 w-7">
                      {(sel.enterDuration ?? 0.5).toFixed(1)}s
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
