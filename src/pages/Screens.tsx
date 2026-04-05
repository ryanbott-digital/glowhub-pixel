import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Monitor, Link2, Trash2, Send, X, CheckSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ScreenStatusCard } from "@/components/screens/ScreenStatusCard";
import { Checkbox } from "@/components/ui/checkbox";

interface Screen {
  id: string;
  name: string;
  pairing_code: string | null;
  status: string;
  current_playlist_id: string | null;
  last_ping: string | null;
}

interface Playlist {
  id: string;
  title: string;
}

export default function Screens() {
  const { user } = useAuth();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newName, setNewName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pairOpen, setPairOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState("");
  const [pairing, setPairing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPlaylistId, setBulkPlaylistId] = useState("");

  const selectionMode = selectedIds.size > 0;

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [s, p] = await Promise.all([
      supabase.from("screens").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("playlists").select("id, title").eq("user_id", user.id),
    ]);
    if (s.data) setScreens(s.data);
    if (p.data) setPlaylists(p.data);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const createScreen = async () => {
    if (!user || !newName.trim()) return;
    const code = generateCode();
    const { error } = await supabase.from("screens").insert({
      user_id: user.id,
      name: newName.trim(),
      pairing_code: code,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Screen created! Pairing code: " + code);
    setNewName("");
    setDialogOpen(false);
    fetchData();
  };

  const pairScreen = async () => {
    if (!user || pairingCode.length !== 6) return;
    setPairing(true);
    try {
      const { data: screen, error: findErr } = await supabase
        .from("screens")
        .select("id, name, user_id")
        .eq("pairing_code", pairingCode)
        .maybeSingle();

      if (findErr) { toast.error("Error looking up code"); return; }
      if (!screen) { toast.error("No screen found with that code. Please check and try again."); return; }
      if (screen.user_id === user.id) { toast.error("This screen is already linked to your account."); return; }

      const { error: updateErr } = await supabase
        .from("screens")
        .update({ user_id: user.id, pairing_code: null })
        .eq("id", screen.id)
        .eq("pairing_code", pairingCode);

      if (updateErr) { toast.error("Failed to pair screen: " + updateErr.message); return; }

      toast.success(`Screen "${screen.name}" successfully linked to your account!`);
      setPairingCode("");
      setPairOpen(false);
      fetchData();
    } finally {
      setPairing(false);
    }
  };

  const publishPlaylist = async (screenId: string, playlistId: string) => {
    const { error } = await supabase
      .from("screens")
      .update({ current_playlist_id: playlistId })
      .eq("id", screenId);
    if (error) { toast.error(error.message); return; }
    const playlist = playlists.find((p) => p.id === playlistId);
    if (user) {
      await supabase.from("screen_activity_logs").insert({
        screen_id: screenId,
        user_id: user.id,
        action: "Playlist published",
        playlist_id: playlistId,
        playlist_title: playlist?.title || "Unknown",
      });
    }
    toast.success("Playlist published to screen!");
    fetchData();
  };

  const deleteScreen = async (id: string) => {
    await supabase.from("screens").delete().eq("id", id);
    toast.success("Screen deleted");
    fetchData();
  };

  const copyDisplayUrl = (screenId: string) => {
    const url = `${window.location.origin}/display/${screenId}`;
    navigator.clipboard.writeText(url);
    toast.success("Display URL copied!");
  };

  // ── Bulk actions ──
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === screens.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(screens.map((s) => s.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkPlaylistId("");
  };

  const bulkPublish = async () => {
    if (!bulkPlaylistId || selectedIds.size === 0 || !user) return;
    const ids = Array.from(selectedIds);
    const playlist = playlists.find((p) => p.id === bulkPlaylistId);

    const { error } = await supabase
      .from("screens")
      .update({ current_playlist_id: bulkPlaylistId })
      .in("id", ids);

    if (error) { toast.error(error.message); return; }

    // Log activity for each
    await supabase.from("screen_activity_logs").insert(
      ids.map((screenId) => ({
        screen_id: screenId,
        user_id: user.id,
        action: "Playlist published (bulk)",
        playlist_id: bulkPlaylistId,
        playlist_title: playlist?.title || "Unknown",
      }))
    );

    toast.success(`Playlist published to ${ids.length} screen(s)`);
    clearSelection();
    fetchData();
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("screens").delete().in("id", ids);
    if (error) { toast.error(error.message); return; }
    toast.success(`${ids.length} screen(s) deleted`);
    clearSelection();
    fetchData();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Screens</h1>
        <div className="flex gap-2">
          {screens.length > 0 && (
            <Button variant="outline" size="sm" onClick={selectAll}>
              <CheckSquare className="h-4 w-4 mr-1" />
              {selectedIds.size === screens.length ? "Deselect All" : "Select All"}
            </Button>
          )}

          <Dialog open={pairOpen} onOpenChange={setPairOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Link2 className="h-4 w-4 mr-2" /> Pair Screen
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Pair a Screen</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <p className="text-sm text-muted-foreground text-center">
                  Enter the 6-digit code shown on your display device to link it to your account.
                </p>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={pairingCode} onChange={setPairingCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button onClick={pairScreen} className="w-full" disabled={pairingCode.length !== 6 || pairing}>
                  {pairing ? "Linking..." : "Link Screen"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Add Screen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Screen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Screen name (e.g. Lobby TV)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <Button onClick={createScreen} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Batch action toolbar */}
      {selectionMode && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 animate-fade-in">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} selected
          </span>
          <div className="h-4 w-px bg-border" />

          <Select value={bulkPlaylistId} onValueChange={setBulkPlaylistId}>
            <SelectTrigger className="w-48 h-8 text-xs">
              <SelectValue placeholder="Choose playlist…" />
            </SelectTrigger>
            <SelectContent>
              {playlists.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button size="sm" className="h-8" disabled={!bulkPlaylistId} onClick={bulkPublish}>
            <Send className="h-3 w-3 mr-1" /> Publish All
          </Button>

          <Button size="sm" variant="destructive" className="h-8" onClick={bulkDelete}>
            <Trash2 className="h-3 w-3 mr-1" /> Delete All
          </Button>

          <div className="flex-1" />
          <Button size="sm" variant="ghost" className="h-8" onClick={clearSelection}>
            <X className="h-3 w-3 mr-1" /> Cancel
          </Button>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {screens.map((screen) => (
          <div key={screen.id} className="relative">
            {/* Selection checkbox overlay */}
            {selectionMode && (
              <div className="absolute top-2 left-2 z-20">
                <Checkbox
                  checked={selectedIds.has(screen.id)}
                  onCheckedChange={() => toggleSelect(screen.id)}
                  className="h-5 w-5 border-white/50 bg-black/40 backdrop-blur-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </div>
            )}
            <div
              className={`transition-all duration-150 ${
                selectionMode
                  ? selectedIds.has(screen.id)
                    ? "ring-2 ring-primary rounded-xl"
                    : "opacity-60"
                  : ""
              }`}
              onClick={selectionMode ? (e) => { e.stopPropagation(); toggleSelect(screen.id); } : undefined}
            >
              <ScreenStatusCard
                screen={screen}
                playlists={playlists}
                onPublish={publishPlaylist}
                onDelete={deleteScreen}
                onCopyUrl={copyDisplayUrl}
              />
            </div>
          </div>
        ))}
      </div>

      {screens.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Monitor className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No screens paired yet</p>
          <p className="text-sm">Add a screen or pair one with a 6-digit code</p>
        </div>
      )}
    </div>
  );
}
