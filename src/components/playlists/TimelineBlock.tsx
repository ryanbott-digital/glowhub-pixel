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

const PX_PER_SECOND = 8;
const MIN_BLOCK_WIDTH = 100;

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

  const blockWidth = Math.max(MIN_BLOCK_WIDTH, duration * PX_PER_SECOND);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        width: `${blockWidth}px`,
        minWidth: `${MIN_BLOCK_WIDTH}px`,
      }}
      className="relative flex-shrink-0 h-24 rounded-lg overflow-hidden border border-border group select-none"
    >
      {/* Background — thumbnail or gradient */}
      {thumbnailUrl ? (
        <div className="absolute inset-0">
          {mediaType === "video" ? (
            <video src={thumbnailUrl} muted preload="metadata" className="w-full h-full object-cover" />
          ) : (
            <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/60" />
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: isImage
              ? "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.15))"
              : "linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--muted)))",
          }}
        />
      )}

      {/* Drag handle (reorder) */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 z-10 p-0.5 rounded bg-black/50 cursor-grab active:cursor-grabbing touch-none opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-3 w-3 text-white/80" />
      </button>

      {/* Content overlay */}
      <button
        type="button"
        className="relative z-[5] w-full h-full flex flex-col justify-between p-1.5 cursor-pointer"
        onClick={() => thumbnailUrl && mediaType && onPreview?.(thumbnailUrl, mediaType, mediaName)}
      >
        {/* Top row: type icon */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded px-1 py-0.5">
            {isImage ? (
              <ImageIcon className="h-2.5 w-2.5 text-[hsl(var(--primary))]" />
            ) : (
              <Film className="h-2.5 w-2.5 text-accent" />
            )}
            <span className="text-[9px] text-white/80 font-medium uppercase">
              {isImage ? "IMG" : "VID"}
            </span>
          </div>
        </div>

        {/* Name */}
        <div className="flex items-end justify-between gap-1">
          <span className="text-[10px] text-white font-medium truncate max-w-[70%] drop-shadow-sm">
            {mediaName}
          </span>
        </div>
      </button>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(id); }}
        className="absolute top-1 right-1 z-10 p-0.5 rounded bg-black/50 hover:bg-destructive/80 opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 className="h-2.5 w-2.5 text-white" />
      </button>

      {/* Duration input at bottom */}
      <div
        className="absolute bottom-1 right-1 z-10 flex items-center gap-0.5"
        onClick={(e) => e.stopPropagation()}
      >
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
          className="w-12 h-5 text-[10px] px-1 py-0 bg-black/60 border-white/20 text-white placeholder:text-white/40 rounded font-mono text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[9px] text-white/70 font-mono">s</span>
      </div>

      {/* Index indicator */}
      <div className="absolute bottom-1 left-1.5 z-10">
        <span className="text-[8px] text-white/40 font-bold">{index + 1}</span>
      </div>
    </div>
  );
}
