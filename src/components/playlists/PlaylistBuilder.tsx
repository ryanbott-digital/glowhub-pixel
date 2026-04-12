import { useCallback, useEffect, useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
// glass classes used instead of Card components
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, X, Clock, Settings2, CheckCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { hapticSuccess } from "@/lib/haptics";
import { TimelineBlock } from "./TimelineBlock";

interface PlaylistItem {
  id: string;
  playlist_id: string;
  media_id: string;
  position: number;
  override_duration: number | null;
  media?: { name: string; type: string; storage_path: string; duration: number | null };
}

interface MediaItem {
  id: string;
  name: string;
  type: string;
}

interface PlaylistBuilderProps {
  playlistId: string;
  playlistTitle: string;
  media: MediaItem[];
}

const DEFAULT_IMAGE_DURATION = 10;

export function PlaylistBuilder({ playlistId, playlistTitle, media }: PlaylistBuilderProps) {
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [lightbox, setLightbox] = useState<{ url: string; type: string; name: string } | null>(null);
  const [defaultDuration, setDefaultDuration] = useState(DEFAULT_IMAGE_DURATION);
  const timelineRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from("playlist_items")
      .select("*, media:media_id(name, type, storage_path, duration)")
      .eq("playlist_id", playlistId)
      .order("position");
    if (data) setItems(data as any);
  }, [playlistId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    hapticSuccess();
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    const updates = reordered.map((item, idx) =>
      supabase.from("playlist_items").update({ position: idx }).eq("id", item.id)
    );
    const results = await Promise.all(updates);
    if (results.some((r) => r.error)) {
      toast.error("Failed to reorder");
      fetchItems();
    }
  };

  const addMediaToPlaylist = async (mediaId: string) => {
    const mediaItem = media.find((m) => m.id === mediaId);
    const isImage = mediaItem?.type === "image";
    const { error } = await supabase.from("playlist_items").insert({
      playlist_id: playlistId,
      media_id: mediaId,
      position: items.length,
      override_duration: isImage ? defaultDuration : null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    fetchItems();
  };

  const removeItem = async (itemId: string) => {
    await supabase.from("playlist_items").delete().eq("id", itemId);
    fetchItems();
  };

  const updateDuration = async (itemId: string, duration: number | null) => {
    await supabase.from("playlist_items").update({ override_duration: duration }).eq("id", itemId);
    // Optimistic update
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, override_duration: duration } : it))
    );
  };

  const applyDefaultToAllImages = async () => {
    const imageItems = items.filter((it) => it.media?.type === "image");
    if (imageItems.length === 0) {
      toast("No image items to update");
      return;
    }
    const updates = imageItems.map((it) =>
      supabase.from("playlist_items").update({ override_duration: defaultDuration }).eq("id", it.id)
    );
    await Promise.all(updates);
    setItems((prev) =>
      prev.map((it) =>
        it.media?.type === "image" ? { ...it, override_duration: defaultDuration } : it
      )
    );
    toast.success(`Set ${imageItems.length} image(s) to ${defaultDuration}s`);
  };

  // Total playlist duration
  const totalSeconds = items.reduce((sum, item) => {
    const dur = item.override_duration ?? item.media?.duration ?? DEFAULT_IMAGE_DURATION;
    return sum + dur;
  }, 0);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div className="glass glass-spotlight rounded-2xl border border-white/[0.06]">
      <div className="flex flex-col space-y-1.5 p-4 sm:p-6 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-lg sm:text-2xl font-semibold leading-none tracking-tight text-foreground truncate">{playlistTitle}</h3>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="font-mono tabular-nums">{formatTime(totalSeconds)}</span>
              <span>· {items.length} items</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:border-l sm:border-border sm:pl-3">
              <Settings2 className="h-3 w-3" />
              <span className="whitespace-nowrap">Default</span>
              <Input
                type="number"
                min={1}
                max={300}
                value={defaultDuration}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val > 0) setDefaultDuration(val);
                }}
                className="w-12 h-6 text-xs px-1 py-0 font-mono text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span>s</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={applyDefaultToAllImages}
                className="h-6 px-2 text-[10px] text-primary hover:text-primary font-semibold gap-1"
                title="Apply default duration to all images"
              >
                <CheckCheck className="h-3 w-3" />
                <span className="hidden sm:inline">Apply to all</span>
                <span className="sm:hidden">All</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 pt-0 space-y-4">
        {/* Timeline track */}
        <div className="relative">
          {/* Track background */}
          <div className="absolute inset-0 rounded-lg bg-white/[0.03] border border-white/[0.06]" />

          {/* Scrollable timeline */}
          <div
            ref={timelineRef}
            className="relative overflow-x-auto py-3 px-2"
            style={{ scrollbarWidth: "thin" }}
          >
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((i) => i.id)} strategy={horizontalListSortingStrategy}>
                <div className="flex gap-1.5 min-h-[80px] items-stretch">
                  {items.map((item, i) => (
                    <TimelineBlock
                      key={item.id}
                      id={item.id}
                      index={i}
                      mediaName={item.media?.name || "Unknown"}
                      mediaType={item.media?.type}
                      storagePath={item.media?.storage_path}
                      overrideDuration={item.override_duration}
                      defaultDuration={item.media?.duration ?? DEFAULT_IMAGE_DURATION}
                      onRemove={removeItem}
                      onUpdateDuration={updateDuration}
                      onPreview={(url, type, name) => setLightbox({ url, type, name })}
                    />
                  ))}

                  {items.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground min-w-[200px]">
                      Drag media here to build your timeline
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Timecode ruler */}
          {items.length > 0 && (
            <div className="px-2 pb-1.5 flex items-center">
              <div className="flex-1 h-px bg-border relative">
                {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                  <div
                    key={pct}
                    className="absolute top-0 flex flex-col items-center"
                    style={{ left: `${pct * 100}%`, transform: "translateX(-50%)" }}
                  >
                    <div className="w-px h-2 bg-muted-foreground/30" />
                    <span className="text-[8px] text-muted-foreground/50 mt-0.5 font-mono">
                      {formatTime(Math.round(totalSeconds * pct))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add media buttons */}
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
          <p className="text-sm font-medium text-muted-foreground mb-2">Add media:</p>
          <div className="flex flex-wrap gap-2">
            {media.map((m) => (
              <Button key={m.id} variant="outline" size="sm" onClick={() => addMediaToPlaylist(m.id)}>
                <Plus className="h-3 w-3 mr-1" /> {m.name}
              </Button>
            ))}
            {media.length === 0 && (
              <p className="text-sm text-muted-foreground">Upload media first</p>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden glass-strong border-white/[0.06]">
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-3 right-3 z-10 p-1 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
          {lightbox?.type === "image" ? (
            <img src={lightbox.url} alt={lightbox.name} className="w-full max-h-[80vh] object-contain" />
          ) : lightbox?.type === "video" ? (
            <video src={lightbox.url} controls autoPlay className="w-full max-h-[80vh] object-contain" />
          ) : null}
          <div className="px-4 py-2 bg-secondary/50">
            <p className="text-sm text-secondary-foreground truncate">{lightbox?.name}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
