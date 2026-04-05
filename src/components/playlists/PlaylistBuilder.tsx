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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SortablePlaylistItem } from "./SortablePlaylistItem";

interface PlaylistItem {
  id: string;
  playlist_id: string;
  media_id: string;
  position: number;
  override_duration: number | null;
  media?: { name: string; type: string };
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

export function PlaylistBuilder({ playlistId, playlistTitle, media }: PlaylistBuilderProps) {
  const [items, setItems] = useState<PlaylistItem[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from("playlist_items")
      .select("*, media:media_id(name, type, storage_path)")
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

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);

    // Optimistic update
    setItems(reordered);

    // Persist new positions
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
    const { error } = await supabase.from("playlist_items").insert({
      playlist_id: playlistId,
      media_id: mediaId,
      position: items.length,
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
    fetchItems();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">{playlistTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item, i) => (
                <SortablePlaylistItem
                  key={item.id}
                  id={item.id}
                  index={i}
                  mediaName={(item as any).media?.name || "Unknown"}
                  mediaType={(item as any).media?.type}
                  storagePath={(item as any).media?.storage_path}
                  overrideDuration={item.override_duration}
                  onRemove={removeItem}
                  onUpdateDuration={updateDuration}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No items yet — add media below
          </p>
        )}

        <div>
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
      </CardContent>
    </Card>
  );
}
