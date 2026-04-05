import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Clock, Image, Film } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface SortablePlaylistItemProps {
  id: string;
  index: number;
  mediaName: string;
  mediaType?: string;
  storagePath?: string;
  overrideDuration: number | null;
  onRemove: (id: string) => void;
  onUpdateDuration: (id: string, duration: number | null) => void;
  onPreview?: (url: string, type: string, name: string) => void;
}

export function SortablePlaylistItem({
  id,
  index,
  mediaName,
  mediaType,
  storagePath,
  overrideDuration,
  onRemove,
  onUpdateDuration,
  onPreview,
}: SortablePlaylistItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const thumbnailUrl = storagePath
    ? supabase.storage.from("signage-content").getPublicUrl(storagePath).data.publicUrl
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-muted rounded-lg"
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}</span>
      <button
        type="button"
        className="h-10 w-14 rounded overflow-hidden bg-background flex items-center justify-center flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
        onClick={() => thumbnailUrl && mediaType && onPreview?.(thumbnailUrl, mediaType, mediaName)}
      >
        {thumbnailUrl && mediaType === "image" ? (
          <img src={thumbnailUrl} alt={mediaName} className="h-full w-full object-cover" />
        ) : thumbnailUrl && mediaType === "video" ? (
          <video src={thumbnailUrl} className="h-full w-full object-cover" muted preload="metadata" />
        ) : mediaType === "video" ? (
          <Film className="h-5 w-5 text-muted-foreground" />
        ) : (
          <Image className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      <span className="flex-1 text-sm text-foreground truncate">{mediaName}</span>
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3 text-muted-foreground" />
        <Input
          type="number"
          placeholder="Auto"
          className="w-16 h-7 text-xs"
          value={overrideDuration ?? ""}
          onChange={(e) =>
            onUpdateDuration(id, e.target.value ? parseInt(e.target.value) : null)
          }
        />
        <span className="text-xs text-muted-foreground">s</span>
      </div>
      <button onClick={() => onRemove(id)}>
        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
}