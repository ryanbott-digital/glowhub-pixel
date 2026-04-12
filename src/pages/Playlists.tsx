import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ListVideo, Trash2, Send, Monitor, Loader2 } from "lucide-react";
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

interface PairedScreen {
  id: string;
  name: string;
  status: string;
}

export default function Playlists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [pairedScreens, setPairedScreens] = useState<PairedScreen[]>([]);
  const [sending, setSending] = useState(false);
  const [sendTargetPlaylist, setSendTargetPlaylist] = useState<Playlist | null>(null);
  const [sentPlaylistId, setSentPlaylistId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

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

  const startRename = (pl: Playlist, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(pl.id);
    setRenameValue(pl.title);
  };

  const commitRename = async () => {
    if (!renamingId || !renameValue.trim()) { setRenamingId(null); return; }
    const { error } = await supabase.from("playlists").update({ title: renameValue.trim() }).eq("id", renamingId);
    if (error) { toast.error(error.message); } else { toast.success("Playlist renamed"); fetchPlaylists(); }
    if (selectedPlaylist?.id === renamingId) setSelectedPlaylist({ ...selectedPlaylist, title: renameValue.trim() });
    setRenamingId(null);
  };

  const openSendDialog = (playlist: Playlist) => {
    if (!user) return;
    setSendTargetPlaylist(playlist);
    supabase
      .from("screens")
      .select("id, name, status")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setPairedScreens(data);
      });
    setSendDialogOpen(true);
  };

  const sendToScreen = async (screenId: string) => {
    if (!sendTargetPlaylist) return;
    setSending(true);
    try {
      const { error } = await supabase
        .from("screens")
        .update({ current_playlist_id: sendTargetPlaylist.id })
        .eq("id", screenId);
      if (error) throw error;
      const screen = pairedScreens.find((s) => s.id === screenId);
      toast.success(`"${sendTargetPlaylist.title}" sent to ${screen?.name ?? "screen"}`);
      setSendDialogOpen(false);
      // Flash the playlist card
      setSentPlaylistId(sendTargetPlaylist.id);
      setTimeout(() => setSentPlaylistId(null), 1500);
    } catch {
      toast.error("Failed to send playlist to screen");
    }
    setSending(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Playlists</h1>
        <div className="flex items-center gap-2">
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
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-2 stagger-in">
          {playlists.map((pl) => {
            const isQuickSend = pl.title.startsWith("Quick Send ·");
            return (
              <div
                key={pl.id}
                className={`relative glass glass-spotlight rounded-2xl cursor-pointer transition-all duration-300 border p-4 flex items-center justify-between ${
                  sentPlaylistId === pl.id
                    ? "ring-2 ring-green-500 border-green-500/60 shadow-[0_0_20px_hsla(150,80%,50%,0.2)]"
                    : selectedPlaylist?.id === pl.id
                      ? "ring-2 ring-primary border-primary"
                      : "border-white/[0.06] hover:border-primary/30"
                }`}
                onClick={() => setSelectedPlaylist(pl)}
              >
                {sentPlaylistId === pl.id && (
                  <div className="absolute inset-0 rounded-2xl bg-green-500/10 animate-fade-out pointer-events-none" />
                )}
                <div className="flex items-center gap-2 min-w-0">
                  {isQuickSend ? (
                    <Send className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ListVideo className="h-4 w-4 text-primary shrink-0" />
                  )}
                  {renamingId === pl.id ? (
                    <Input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingId(null); }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-6 text-sm py-0 px-1 bg-background/50 border-primary/30"
                    />
                  ) : (
                    <span
                      className={`font-medium truncate cursor-text ${isQuickSend ? "text-muted-foreground" : "text-foreground"}`}
                      onDoubleClick={(e) => startRename(pl, e)}
                      onClick={(e) => { e.stopPropagation(); startRename(pl, e); }}
                    >
                      {pl.title}
                    </span>
                  )}
                  {isQuickSend && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">Quick</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); openSendDialog(pl); }}
                    title="Send to screen"
                    className="p-1 rounded-md hover:bg-primary/10 transition-colors"
                  >
                    <Send className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deletePlaylist(pl.id); }}
                    className="p-1 rounded-md hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
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

      {/* Send to Screen Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="glass-strong border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Send to Screen
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Choose a screen to play <span className="font-medium text-foreground">"{sendTargetPlaylist?.title}"</span>
          </p>
          <div className="space-y-2 mt-2">
            {pairedScreens.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No screens paired yet</p>
            ) : (
              pairedScreens.map((screen) => (
                <button
                  key={screen.id}
                  disabled={sending}
                  onClick={() => sendToScreen(screen.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                >
                  <Monitor className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm text-foreground">{screen.name}</span>
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {screen.status}
                    </span>
                  </div>
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Send className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
