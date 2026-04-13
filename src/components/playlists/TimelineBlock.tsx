import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Film, ImageIcon, Trash2, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface TimelineBlockProps {
  id: string;
  index: number;
  mediaName: string;
  mediaType?: string;
  storagePath?: string;
  overrideDuration: number | null;
  defaultDuration: number;
  onRemove: (id: string) => void;
  onUpdateDuration: (id: string, duration: number | null) => void;
  onPreview?: (url: string, type: string, name: string) => void;
}

export function TimelineBlock({
  id,
  index,
  mediaName,
  mediaType,
  storagePath,
  overrideDuration,
  defaultDuration,
  onRemove,
  onUpdateDuration,
  onPreview,
}: TimelineBlockProps) {
  const duration = overrideDuration ?? defaultDuration;
  const isImage = mediaType === "image";

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  const thumbnailUrl = storagePath
    ? supabase.storage.from("signage-content").getPublicUrl(storagePath).data.publicUrl
    : null;

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `0:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border border-border bg-card/50 px-2 py-2 group select-none transition-colors hover:bg-card/80 ${isDragging ? "shadow-lg" : ""}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-0.5 rounded cursor-grab active:cursor-grabbing touch-none text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Index */}
      <span className="text-xs text-muted-foreground/60 font-mono tabular-nums w-4 text-center shrink-0">
        {index + 1}
      </span>

      {/* Thumbnail */}
      <button
        type="button"
        className="w-10 h-10 rounded overflow-hidden shrink-0 bg-muted/30 flex items-center justify-center cursor-pointer"
        onClick={() => thumbnailUrl && mediaType && onPreview?.(thumbnailUrl, mediaType, mediaName)}
      >
        {thumbnailUrl ? (
          mediaType === "video" ? (
            <video src={thumbnailUrl} muted preload="metadata" className="w-full h-full object-cover" />
          ) : (
            <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
          )
        ) : (
          isImage ? (
            <ImageIcon className="h-4 w-4 text-primary/60" />
          ) : (
            <Film className="h-4 w-4 text-accent/60" />
          )
        )}
      </button>

      {/* Name + type badge */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <button
          type="button"
          className="text-sm text-foreground truncate text-left cursor-pointer hover:text-primary transition-colors"
          onClick={() => thumbnailUrl && mediaType && onPreview?.(thumbnailUrl, mediaType, mediaName)}
        >
          {mediaName}
        </button>
        <span className="shrink-0 text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
          {isImage ? "IMG" : "VID"}
        </span>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <Input
          type="number"
          min={1}
          max={300}
          placeholder={String(defaultDuration)}
          value={overrideDuration ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            onUpdateDuration(id, val ? Math.max(1, parseInt(val)) : null);
          }}
          className="w-12 h-7 text-xs px-1 py-0 font-mono text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-xs text-muted-foreground font-mono">{formatDuration(duration)}</span>
      </div>

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(id); }}
        className="p-1 rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
