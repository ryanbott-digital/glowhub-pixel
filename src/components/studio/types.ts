export interface CanvasElement {
  id: string;
  type: "image" | "video" | "text" | "shape" | "widget-weather" | "widget-rss" | "widget-clock" | "widget-countdown" | "widget-neon-label" | "widget-ticker" | "widget-particles";
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style: Record<string, string>;
  animation?: string;
  proOnly?: boolean;
  visible: boolean;
  locked: boolean;
  glowIntensity?: number;
  flickerSpeed?: number;
  glassBlur?: number;
  // Visual Effects (CSS filters)
  filters?: {
    blur: number;
    brightness: number;
    contrast: number;
    hueRotate: number;
    saturate: number;
    opacity: number;
  };
  // Shape properties
  shapeType?: "rectangle" | "circle" | "rounded-rect" | "line";
  shapeFill?: string;
  shapeStroke?: string;
  shapeStrokeWidth?: number;
  // Timeline / sequencer
  enterDelay?: number;
  enterDuration?: number;
  exitDelay?: number;
  entranceAnim?: string;
  exitAnim?: string;
  // Blend mode
  blendMode?: string;
  // Typography
  fontFamily?: string;
  // Image placeholder (template zones)
  placeholderGroupId?: string;
}

export const DEFAULT_FILTERS: CanvasElement["filters"] = {
  blur: 0,
  brightness: 100,
  contrast: 100,
  hueRotate: 0,
  saturate: 100,
  opacity: 100,
};

export interface SavedLayout {
  id: string;
  name: string;
  canvas_data: { elements: CanvasElement[] };
  updated_at: string;
}

export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  icon: "sun" | "cloud" | "rain" | "snow" | "storm";
  isNight: boolean;
}

export const MOTION_PRESETS = [
  { id: "none", label: "None", css: "", pro: false },
  { id: "pulse", label: "Pulse", css: "animate-pulse", pro: false },
  { id: "float", label: "Float", css: "studio-float", pro: false },
  { id: "spin", label: "Spin", css: "studio-spin", pro: false },
  { id: "slide", label: "Slide In", css: "animate-fade-in", pro: false },
  { id: "neon-flicker", label: "Neon Flicker", css: "studio-neon-flicker", pro: true },
  { id: "glow-breathe", label: "Glow Breathe", css: "studio-glow-breathe", pro: true },
  { id: "bounce", label: "Bounce", css: "studio-bounce", pro: true },
] as const;

export function getFilterCSS(filters?: CanvasElement["filters"]): string {
  if (!filters) return "";
  const parts: string[] = [];
  if (filters.blur > 0) parts.push(`blur(${filters.blur}px)`);
  if (filters.brightness !== 100) parts.push(`brightness(${filters.brightness}%)`);
  if (filters.contrast !== 100) parts.push(`contrast(${filters.contrast}%)`);
  if (filters.hueRotate !== 0) parts.push(`hue-rotate(${filters.hueRotate}deg)`);
  if (filters.saturate !== 100) parts.push(`saturate(${filters.saturate}%)`);
  if (filters.opacity !== 100) parts.push(`opacity(${filters.opacity}%)`);
  return parts.join(" ");
}

export function getMotionClass(animation?: string): string {
  const preset = MOTION_PRESETS.find((m) => m.id === animation);
  return preset?.css || "";
}
