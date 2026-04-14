import { useCallback, useEffect, useState } from "react";
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
  verticalListSortingStrategy,
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
  storage_path?: string;
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
      <div className="p-3 sm:p-6 pt-0 space-y-4">
        {/* Item list */}
        <div className="space-y-1.5">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
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
                <div className="flex items-center justify-center text-sm text-muted-foreground py-8 rounded-lg border border-dashed border-border">
                  Add media below to build your playlist
                </div>
              )}
            </SortableContext>
          </DndContext>
        </div>

        {/* Add media buttons */}
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
          <p className="text-sm font-medium text-muted-foreground mb-2">Add media:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {media.map((m) => {
              const thumbUrl = m.storage_path
                ? supabase.storage.from("signage-content").getPublicUrl(m.storage_path).data.publicUrl
                : undefined;
              return (
                <button
                  key={m.id}
                  onClick={() => addMediaToPlaylist(m.id)}
                  className="group flex flex-col items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-primary/10 hover:border-primary/30 p-2 transition-colors text-left"
                >
                  <div className="w-full aspect-video rounded-md overflow-hidden bg-muted/30 flex items-center justify-center">
                    {m.type === "image" && thumbUrl ? (
                      <img src={thumbUrl} alt={m.name} className="w-full h-full object-cover" />
                    ) : m.type === "video" && thumbUrl ? (
                      <video src={thumbUrl} muted className="w-full h-full object-cover" />
                    ) : (
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground group-hover:text-foreground truncate w-full text-center leading-tight">
                    {m.name}
                  </span>
                </button>
              );
            })}
            {media.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full">Upload media first</p>
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
