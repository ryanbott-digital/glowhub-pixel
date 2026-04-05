import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ListVideo, GripVertical, Trash2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Playlist {
  id: string;
  title: string;
  created_at: string;
}

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

export default function Playlists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchPlaylists = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("playlists").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setPlaylists(data);
  }, [user]);

  const fetchItems = useCallback(async (playlistId: string) => {
    const { data } = await supabase
      .from("playlist_items")
      .select("*, media:media_id(name, type)")
      .eq("playlist_id", playlistId)
      .order("position");
    if (data) setItems(data as any);
  }, []);

  const fetchMedia = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("media").select("id, name, type").eq("user_id", user.id);
    if (data) setMedia(data);
  }, [user]);

  useEffect(() => { fetchPlaylists(); fetchMedia(); }, [fetchPlaylists, fetchMedia]);

  useEffect(() => {
    if (selectedPlaylist) fetchItems(selectedPlaylist.id);
  }, [selectedPlaylist, fetchItems]);

  const createPlaylist = async () => {
    if (!user || !newTitle.trim()) return;
    const { error } = await supabase.from("playlists").insert({ user_id: user.id, title: newTitle.trim() });
    if (error) { toast.error(error.message); return; }
    toast.success("Playlist created!");
    setNewTitle("");
    setDialogOpen(false);
    fetchPlaylists();
  };

  const addMediaToPlaylist = async (mediaId: string) => {
    if (!selectedPlaylist) return;
    const nextPos = items.length;
    const { error } = await supabase.from("playlist_items").insert({
      playlist_id: selectedPlaylist.id,
      media_id: mediaId,
      position: nextPos,
    });
    if (error) { toast.error(error.message); return; }
    fetchItems(selectedPlaylist.id);
  };

  const removeItem = async (itemId: string) => {
    await supabase.from("playlist_items").delete().eq("id", itemId);
    if (selectedPlaylist) fetchItems(selectedPlaylist.id);
  };

  const updateDuration = async (itemId: string, duration: number | null) => {
    await supabase.from("playlist_items").update({ override_duration: duration }).eq("id", itemId);
    if (selectedPlaylist) fetchItems(selectedPlaylist.id);
  };

  const deletePlaylist = async (id: string) => {
    await supabase.from("playlists").delete().eq("id", id);
    if (selectedPlaylist?.id === id) {
      setSelectedPlaylist(null);
      setItems([]);
    }
    toast.success("Playlist deleted");
    fetchPlaylists();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Playlists</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Playlist</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Playlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Playlist title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              <Button onClick={createPlaylist} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Playlist list */}
        <div className="space-y-2">
          {playlists.map((pl) => (
            <Card
              key={pl.id}
              className={`cursor-pointer transition-colors ${selectedPlaylist?.id === pl.id ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
              onClick={() => setSelectedPlaylist(pl)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListVideo className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">{pl.title}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deletePlaylist(pl.id); }}>
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              </CardContent>
            </Card>
          ))}
          {playlists.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No playlists yet</p>
          )}
        </div>

        {/* Playlist builder */}
        <div className="md:col-span-2">
          {selectedPlaylist ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">{selectedPlaylist.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}</span>
                      <span className="flex-1 text-sm text-foreground">{(item as any).media?.name || "Unknown"}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="Auto"
                          className="w-16 h-7 text-xs"
                          value={item.override_duration ?? ""}
                          onChange={(e) => updateDuration(item.id, e.target.value ? parseInt(e.target.value) : null)}
                        />
                        <span className="text-xs text-muted-foreground">s</span>
                      </div>
                      <button onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add media */}
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
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Select a playlist to edit
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
