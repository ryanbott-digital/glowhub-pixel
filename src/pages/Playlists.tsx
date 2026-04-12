import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, ListVideo, Trash2, Send, Monitor, Loader2, Copy, CheckSquare, GripVertical, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { hapticMedium, hapticSuccess } from "@/lib/haptics";
import { PlaylistBuilder } from "@/components/playlists/PlaylistBuilder";
import { BulkPlaylistToolbar } from "@/components/playlists/BulkPlaylistToolbar";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

interface SortablePlaylistCardProps {
  pl: Playlist;
  bulkMode: boolean;
  isChecked: boolean;
  isSelected: boolean;
  isSent: boolean;
  isRenaming: boolean;
  renameValue: string;
  onRenameChange: (v: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onStartRename: (pl: Playlist, e: React.MouseEvent) => void;
  onSelect: () => void;
  onToggleBulk: () => void;
  onDuplicate: () => void;
  onSend: () => void;
  onDelete: () => void;
}

function SortablePlaylistCard({
  pl, bulkMode, isChecked, isSelected, isSent, isRenaming, renameValue,
  onRenameChange, onCommitRename, onCancelRename, onStartRename,
  onSelect, onToggleBulk, onDuplicate, onSend, onDelete,
}: SortablePlaylistCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pl.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.5 : 1 };
  const isQuickSend = pl.title.startsWith("Quick Send ·");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative glass glass-spotlight rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 border p-3 sm:p-4 active:scale-[0.98] ${
        isSent
          ? "ring-2 ring-green-500 border-green-500/60 shadow-[0_0_20px_hsla(150,80%,50%,0.2)]"
          : bulkMode && isChecked
            ? "ring-2 ring-primary border-primary"
            : isSelected && !bulkMode
              ? "ring-2 ring-primary border-primary"
              : "border-white/[0.06] hover:border-primary/30"
      }`}
      onClick={onSelect}
    >
      {isSent && (
        <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-green-500/10 animate-fade-out pointer-events-none" />
      )}
      <div className="flex items-center gap-2 min-w-0">
        {!bulkMode && (
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 -ml-1 shrink-0 touch-none" onClick={(e) => e.stopPropagation()}>
            <GripVertical className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
          </button>
        )}
        {bulkMode ? (
          <Checkbox
            checked={isChecked}
            onCheckedChange={onToggleBulk}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 h-5 w-5"
          />
        ) : isQuickSend ? (
          <Send className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ListVideo className="h-4 w-4 text-primary shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          {isRenaming && !bulkMode ? (
            <Input
              autoFocus
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onBlur={onCommitRename}
              onKeyDown={(e) => { if (e.key === "Enter") onCommitRename(); if (e.key === "Escape") onCancelRename(); }}
              onClick={(e) => e.stopPropagation()}
              className="h-8 text-sm py-0 px-2 bg-background/50 border-primary/30"
            />
          ) : (
            <span
              className={`font-medium truncate block ${isQuickSend ? "text-muted-foreground" : "text-foreground"}`}
              onDoubleClick={(e) => !bulkMode && onStartRename(pl, e)}
            >
              {pl.title}
            </span>
          )}
        </div>
        {isQuickSend && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">Quick</Badge>
        )}
      </div>
      {!bulkMode && (
        <div className="flex items-center gap-0.5 shrink-0 mt-2 sm:mt-0 sm:absolute sm:right-3 sm:top-1/2 sm:-translate-y-1/2">
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} title="Duplicate playlist" className="p-2 sm:p-1.5 rounded-lg sm:rounded-md hover:bg-primary/10 transition-colors">
            <Copy className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-muted-foreground hover:text-primary" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onSend(); }} title="Send to screen" className="p-2 sm:p-1.5 rounded-lg sm:rounded-md hover:bg-primary/10 transition-colors">
            <Send className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-muted-foreground hover:text-primary" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 sm:p-1.5 rounded-lg sm:rounded-md hover:bg-destructive/10 transition-colors">
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      )}
    </div>
  );
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

  // Bulk select state
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkSendDialogOpen, setBulkSendDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPlaylists = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("playlists").select("*").eq("user_id", user.id).order("position", { ascending: true });
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

  const duplicatePlaylist = async (pl: Playlist) => {
    if (!user) return;
    const dupTitle = `${pl.title} (Copy)`;
    const { data: newPl, error } = await supabase
      .from("playlists")
      .insert({ user_id: user.id, title: dupTitle })
      .select("*")
      .single();
    if (error || !newPl) { toast.error("Failed to duplicate playlist"); return; }
    const { data: items } = await supabase
      .from("playlist_items")
      .select("media_id, position, override_duration")
      .eq("playlist_id", pl.id)
      .order("position");
    if (items && items.length > 0) {
      await supabase.from("playlist_items").insert(
        items.map((item) => ({
          playlist_id: newPl.id,
          media_id: item.media_id,
          position: item.position,
          override_duration: item.override_duration,
        }))
      );
    }
    toast.success("Playlist duplicated!");
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
      setSentPlaylistId(sendTargetPlaylist.id);
      setTimeout(() => setSentPlaylistId(null), 1500);
    } catch {
      toast.error("Failed to send playlist to screen");
    }
    setSending(false);
  };

  // Bulk actions
  const toggleBulkSelect = (id: string) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const exitBulkMode = () => {
    setBulkMode(false);
    setBulkSelected(new Set());
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    hapticSuccess();
    const oldIndex = playlists.findIndex((p) => p.id === active.id);
    const newIndex = playlists.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(playlists, oldIndex, newIndex);
    setPlaylists(reordered);
    // Persist positions
    await Promise.all(
      reordered.map((pl, i) =>
        supabase.from("playlists").update({ position: i }).eq("id", pl.id)
      )
    );
  };

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const bulkDelete = async () => {
    if (bulkSelected.size === 0) return;
    const ids = Array.from(bulkSelected);
    const { error } = await supabase.from("playlists").delete().in("id", ids);
    if (error) { toast.error(error.message); return; }
    if (selectedPlaylist && bulkSelected.has(selectedPlaylist.id)) setSelectedPlaylist(null);
    toast.success(`${ids.length} playlist${ids.length > 1 ? "s" : ""} deleted`);
    exitBulkMode();
    fetchPlaylists();
  };

  const openBulkSendDialog = () => {
    if (!user || bulkSelected.size === 0) return;
    supabase
      .from("screens")
      .select("id, name, status")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setPairedScreens(data);
      });
    setBulkSendDialogOpen(true);
  };

  const bulkSendToScreen = async (screenId: string) => {
    if (bulkSelected.size === 0) return;
    setSending(true);
    try {
      // Send last selected playlist to screen (most recent selection)
      const ids = Array.from(bulkSelected);
      // For multiple playlists, we set each screen to use each playlist
      // Since one screen can only have one playlist, we cycle through screens isn't practical
      // Instead: assign the first selected playlist to the chosen screen
      const playlistId = ids[0];
      const { error } = await supabase
        .from("screens")
        .update({ current_playlist_id: playlistId })
        .eq("id", screenId);
      if (error) throw error;
      const screen = pairedScreens.find((s) => s.id === screenId);
      const pl = playlists.find((p) => p.id === playlistId);
      toast.success(`"${pl?.title}" sent to ${screen?.name ?? "screen"}`);
      setBulkSendDialogOpen(false);
      exitBulkMode();
    } catch {
      toast.error("Failed to send playlist to screen");
    }
    setSending(false);
  };

  return (
    <div className="space-y-5 animate-fade-in min-w-0">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Playlists</h1>
          <div className="flex items-center gap-2 shrink-0">
            {!bulkMode && playlists.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setBulkMode(true)} className="h-10 sm:h-9 text-xs px-3">
                <CheckSquare className="h-4 w-4 mr-1.5" /> Select
              </Button>
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-10 sm:h-9 text-xs px-3"><Plus className="h-4 w-4 mr-1.5" /> New</Button>
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
      </div>

      {bulkMode && (
        <BulkPlaylistToolbar
          selectedCount={bulkSelected.size}
          totalCount={playlists.length}
          onSelectAll={() => setBulkSelected(new Set(playlists.map((p) => p.id)))}
          onDeselectAll={() => setBulkSelected(new Set())}
          onBulkDelete={() => setConfirmDeleteOpen(true)}
          onBulkSend={openBulkSendDialog}
          onExit={exitBulkMode}
        />
      )}

      {/* On mobile: show builder fullscreen with back button, on desktop: side-by-side */}
      {selectedPlaylist && !bulkMode ? (
        <>
          {/* Mobile: back button + builder */}
          <div className="md:hidden space-y-3">
            <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => setSelectedPlaylist(null)}>
              ← Back to playlists
            </Button>
            <PlaylistBuilder
              key={selectedPlaylist.id}
              playlistId={selectedPlaylist.id}
              playlistTitle={selectedPlaylist.title}
              media={media}
            />
          </div>

          {/* Desktop: side-by-side grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search playlists…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-white/[0.03] border-white/[0.08] text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={() => hapticMedium()} onDragEnd={handleDragEnd}>
                <SortableContext items={playlists.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase())).map((p) => p.id)} strategy={verticalListSortingStrategy}>
                  {playlists.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase())).map((pl) => (
                    <SortablePlaylistCard
                      key={pl.id}
                      pl={pl}
                      bulkMode={bulkMode}
                      isChecked={bulkSelected.has(pl.id)}
                      isSelected={selectedPlaylist?.id === pl.id}
                      isSent={sentPlaylistId === pl.id}
                      isRenaming={renamingId === pl.id}
                      renameValue={renameValue}
                      onRenameChange={setRenameValue}
                      onCommitRename={commitRename}
                      onCancelRename={() => setRenamingId(null)}
                      onStartRename={startRename}
                      onSelect={() => bulkMode ? toggleBulkSelect(pl.id) : setSelectedPlaylist(pl)}
                      onToggleBulk={() => toggleBulkSelect(pl.id)}
                      onDuplicate={() => duplicatePlaylist(pl)}
                      onSend={() => openSendDialog(pl)}
                      onDelete={() => deletePlaylist(pl.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
            <div className="md:col-span-2">
              <PlaylistBuilder
                key={selectedPlaylist.id}
                playlistId={selectedPlaylist.id}
                playlistTitle={selectedPlaylist.title}
                media={media}
              />
            </div>
          </div>
        </>
      ) : (
        /* No playlist selected or bulk mode — show list only */
        <div className="space-y-2 stagger-in">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search playlists…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 sm:h-9 bg-white/[0.03] border-white/[0.08] text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={() => hapticMedium()} onDragEnd={handleDragEnd}>
            <SortableContext items={playlists.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase())).map((p) => p.id)} strategy={verticalListSortingStrategy}>
              {playlists.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase())).map((pl) => (
                <SortablePlaylistCard
                  key={pl.id}
                  pl={pl}
                  bulkMode={bulkMode}
                  isChecked={bulkSelected.has(pl.id)}
                  isSelected={selectedPlaylist?.id === pl.id}
                  isSent={sentPlaylistId === pl.id}
                  isRenaming={renamingId === pl.id}
                  renameValue={renameValue}
                  onRenameChange={setRenameValue}
                  onCommitRename={commitRename}
                  onCancelRename={() => setRenamingId(null)}
                  onStartRename={startRename}
                  onSelect={() => bulkMode ? toggleBulkSelect(pl.id) : setSelectedPlaylist(pl)}
                  onToggleBulk={() => toggleBulkSelect(pl.id)}
                  onDuplicate={() => duplicatePlaylist(pl)}
                  onSend={() => openSendDialog(pl)}
                  onDelete={() => deletePlaylist(pl.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
          {playlists.length === 0 && (
            <div className="glass glass-spotlight rounded-2xl border border-white/[0.06] text-center text-muted-foreground py-8">No playlists yet</div>
          )}
          {!bulkMode && playlists.length > 0 && !selectedPlaylist && (
            <div className="glass glass-spotlight rounded-2xl border border-white/[0.06] flex items-center justify-center h-32 sm:h-64 text-muted-foreground text-sm">
              Tap a playlist to edit
            </div>
          )}
          {bulkMode && (
            <div className="glass glass-spotlight rounded-2xl border border-white/[0.06] flex items-center justify-center h-32 sm:h-64 text-muted-foreground text-sm">
              Select playlists to manage in bulk
            </div>
          )}
        </div>
      )}

      {/* Single Send to Screen Dialog */}
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

      {/* Bulk Send to Screen Dialog */}
      <Dialog open={bulkSendDialogOpen} onOpenChange={setBulkSendDialogOpen}>
        <DialogContent className="glass-strong border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Send {bulkSelected.size} Playlist{bulkSelected.size > 1 ? "s" : ""} to Screen
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Choose a screen. The first selected playlist will be assigned.
          </p>
          <div className="space-y-2 mt-2">
            {pairedScreens.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No screens paired yet</p>
            ) : (
              pairedScreens.map((screen) => (
                <button
                  key={screen.id}
                  disabled={sending}
                  onClick={() => bulkSendToScreen(screen.id)}
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

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {bulkSelected.size} playlist{bulkSelected.size !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All selected playlists and their items will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmDeleteOpen(false); bulkDelete(); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
