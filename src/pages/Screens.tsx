import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Monitor, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ScreenStatusCard } from "@/components/screens/ScreenStatusCard";

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
      // Find screen with this pairing code (screens table is publicly readable)
      const { data: screen, error: findErr } = await supabase
        .from("screens")
        .select("id, name, user_id")
        .eq("pairing_code", pairingCode)
        .maybeSingle();

      if (findErr) {
        toast.error("Error looking up code");
        return;
      }
      if (!screen) {
        toast.error("No screen found with that code. Please check and try again.");
        return;
      }
      if (screen.user_id === user.id) {
        toast.error("This screen is already linked to your account.");
        return;
      }

      // Claim the screen by updating its user_id
      const { error: updateErr } = await supabase
        .from("screens")
        .update({ user_id: user.id, pairing_code: null })
        .eq("id", screen.id)
        .eq("pairing_code", pairingCode);

      if (updateErr) {
        toast.error("Failed to pair screen: " + updateErr.message);
        return;
      }

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
    if (error) {
      toast.error(error.message);
      return;
    }
    // Log activity
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Screens</h1>
        <div className="flex gap-2">
          {/* Pair Screen Modal */}
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
                  <InputOTP
                    maxLength={6}
                    value={pairingCode}
                    onChange={setPairingCode}
                  >
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
                <Button
                  onClick={pairScreen}
                  className="w-full"
                  disabled={pairingCode.length !== 6 || pairing}
                >
                  {pairing ? "Linking..." : "Link Screen"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Screen Dialog */}
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
                <Button onClick={createScreen} className="w-full">
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {screens.map((screen) => (
          <ScreenStatusCard
            key={screen.id}
            screen={screen}
            playlists={playlists}
            onPublish={publishPlaylist}
            onDelete={deleteScreen}
            onCopyUrl={copyDisplayUrl}
          />
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
