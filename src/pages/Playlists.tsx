import { useState, useEffect, useCallback } from "react";
// glass classes used instead of Card components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ListVideo, Trash2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PlaylistBuilder } from "@/components/playlists/PlaylistBuilder";

interface Playlist {
  id: string;
  title: string;
  created_at: string;
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
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchPlaylists = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("playlists").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setPlaylists(data);
  }, [user]);

  const fetchMedia = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("media").select("id, name, type").eq("user_id", user.id);
    if (data) setMedia(data);
  }, [user]);

  useEffect(() => { fetchPlaylists(); fetchMedia(); }, [fetchPlaylists, fetchMedia]);

  const createPlaylist = async () => {
    if (!user || !newTitle.trim()) return;
    const { error } = await supabase.from("playlists").insert({ user_id: user.id, title: newTitle.trim() });
    if (error) { toast.error(error.message); return; }
    toast.success("Playlist created!");
    setNewTitle("");
    setDialogOpen(false);
    fetchPlaylists();
  };

  const deletePlaylist = async (id: string) => {
    await supabase.from("playlists").delete().eq("id", id);
    if (selectedPlaylist?.id === id) setSelectedPlaylist(null);
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
          <DialogContent className="glass-strong border-white/[0.06]">
            <DialogHeader><DialogTitle>Create Playlist</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Playlist title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              <Button onClick={createPlaylist} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-2 stagger-in">
          {playlists.map((pl) => {
            const isQuickSend = pl.title.startsWith("Quick Send ·");
            return (
              <div
                key={pl.id}
                className={`glass glass-spotlight rounded-2xl cursor-pointer transition-all border p-4 flex items-center justify-between ${selectedPlaylist?.id === pl.id ? "ring-2 ring-primary border-primary" : "border-white/[0.06] hover:border-primary/30"}`}
                onClick={() => setSelectedPlaylist(pl)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isQuickSend ? (
                    <Send className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ListVideo className="h-4 w-4 text-primary shrink-0" />
                  )}
                  <span className={`font-medium truncate ${isQuickSend ? "text-muted-foreground" : "text-foreground"}`}>{pl.title}</span>
                  {isQuickSend && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">Quick</Badge>
                  )}
                </div>
                <button onClick={(e) => { e.stopPropagation(); deletePlaylist(pl.id); }}>
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            );
          })}
          {playlists.length === 0 && (
            <div className="glass glass-spotlight rounded-2xl border border-white/[0.06] text-center text-muted-foreground py-8">No playlists yet</div>
          )}
        </div>

        <div className="md:col-span-2">
          {selectedPlaylist ? (
            <PlaylistBuilder
              key={selectedPlaylist.id}
              playlistId={selectedPlaylist.id}
              playlistTitle={selectedPlaylist.title}
              media={media}
            />
          ) : (
            <div className="glass glass-spotlight rounded-2xl border border-white/[0.06] flex items-center justify-center h-64 text-muted-foreground">
              Select a playlist to edit
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
