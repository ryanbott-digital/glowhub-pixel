import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { isProTier } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import { Layers, Crown, Monitor, Sparkles, Plus, Grid2x2 } from "lucide-react";
import { InfiniteCanvas } from "@/components/canvas/InfiniteCanvas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowDown } from "lucide-react";

interface Playlist {
  id: string;
  title: string;
}

interface Screen {
  id: string;
  name: string;
  status: string;
  last_ping: string | null;
  current_playlist_id: string | null;
}

interface SyncGroup {
  id: string;
  name: string;
  orientation: "horizontal" | "vertical" | "grid";
  playlist_id: string | null;
  screens: { id: string; screen_id: string; position: number }[];
}

export default function Canvas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [syncGroups, setSyncGroups] = useState<SyncGroup[]>([]);
  const [subscriptionTier, setSubscriptionTier] = useState("free");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("Sync Group");
  const [newOrientation, setNewOrientation] = useState<"horizontal" | "vertical" | "grid">("horizontal");

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [screenRes, profileRes, groupRes, playlistRes] = await Promise.all([
      supabase.from("screens").select("id, name, status, last_ping, current_playlist_id").eq("user_id", user.id),
      supabase.from("profiles").select("subscription_tier").eq("id", user.id).single(),
      supabase.from("sync_groups").select("*").eq("user_id", user.id),
      supabase.from("playlists").select("id, title").eq("user_id", user.id).order("title"),
    ]);

    setScreens(screenRes.data || []);
    setPlaylists(playlistRes.data || []);
    setSubscriptionTier(profileRes.data?.subscription_tier || "free");

    if (groupRes.data) {
      const groups: SyncGroup[] = [];
      for (const g of groupRes.data) {
        const { data: members } = await supabase
          .from("sync_group_screens")
          .select("id, screen_id, position, bezel_compensation, color_r, color_g, color_b, brightness_offset, resolution_w, resolution_h, grid_col, grid_row")
          .eq("sync_group_id", g.id)
          .order("position");

        groups.push({
          id: g.id,
          name: g.name,
          orientation: g.orientation as "horizontal" | "vertical" | "grid",
          playlist_id: (g as any).playlist_id ?? null,
          screens: members || [],
        });
      }
      setSyncGroups(groups);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime refresh
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("canvas-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sync_groups", filter: `user_id=eq.${user.id}` }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "sync_group_screens" }, () => fetchData())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "screens", filter: `user_id=eq.${user.id}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchData]);

  const isPro = isProTier(subscriptionTier);

  const handleCreateGroup = async () => {
    if (!user) return;
    const { error } = await supabase.from("sync_groups").insert({
      user_id: user.id,
      name: newGroupName,
      orientation: newOrientation,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Sync group created");
    setCreateOpen(false);
    setNewGroupName("Sync Group");
    fetchData();
  };

  // Pro gate
  if (!isPro) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="glass glass-spotlight rounded-3xl p-10 max-w-lg w-full text-center space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 border border-primary/20">
              <Layers className="h-10 w-10 text-primary" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-accent" />
              <span className="text-sm font-bold tracking-widest uppercase text-accent">Pro Feature</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Sync-Glow Canvas</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-2">
              Span a single piece of content across multiple screens — like a McDonald's menu board.
              Create stunning multi-screen displays with perfectly synchronized content.
            </p>
            <div className="glass rounded-xl p-4 my-6 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Monitor className="h-4 w-4 text-primary shrink-0" />
                <span>Drag &amp; snap screens on an infinite neon canvas</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span>Heartbeat sync with rubber-banding for perfect timing</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Layers className="h-4 w-4 text-primary shrink-0" />
                <span>Offset rendering: 4K across 3 screens with one deploy</span>
              </div>
            </div>
            <Button
              onClick={() => navigate("/subscription")}
              className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold tracking-wider rounded-xl h-12 text-base animate-[breathe_3s_ease-in-out_infinite]"
            >
              <Crown className="h-5 w-5 mr-2" />
              Upgrade to Pro — $9/mo
            </Button>
          </div>
        </div>
        <style>{`
          @keyframes breathe {
            0%, 100% { box-shadow: 0 0 20px hsla(180, 100%, 32%, 0.3); }
            50% { box-shadow: 0 0 35px hsla(180, 100%, 32%, 0.5), 0 0 60px hsla(180, 100%, 32%, 0.2); }
          }
        `}</style>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-wide flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            Sync-Glow Canvas
          </h1>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mt-0.5">
            Drag screens together to auto-create sync groups · Deploy to all hardware simultaneously
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-gradient-to-r from-primary to-glow-blue text-primary-foreground rounded-xl font-semibold tracking-wider"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Sync Group
        </Button>
      </div>

      {/* Infinite Canvas */}
      {user && (
        <InfiniteCanvas
          screens={screens}
          syncGroups={syncGroups}
          playlists={playlists}
          userId={user.id}
          onRefresh={fetchData}
        />
      )}

      {/* Create Group Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="glass sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              New Sync Group
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-muted-foreground tracking-wider uppercase mb-1.5 block">Group Name</label>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g. Menu Board"
                className="glass"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground tracking-wider uppercase mb-1.5 block">Orientation</label>
              <Select value={newOrientation} onValueChange={(v) => setNewOrientation(v as any)}>
                <SelectTrigger className="glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">
                    <span className="flex items-center gap-2"><ArrowRight className="h-3.5 w-3.5" /> Horizontal</span>
                  </SelectItem>
                  <SelectItem value="vertical">
                    <span className="flex items-center gap-2"><ArrowDown className="h-3.5 w-3.5" /> Vertical</span>
                  </SelectItem>
                  <SelectItem value="grid">
                    <span className="flex items-center gap-2"><Grid2x2 className="h-3.5 w-3.5" /> Grid (2D)</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateGroup} className="w-full bg-gradient-to-r from-primary to-glow-blue text-primary-foreground font-semibold tracking-wider">
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Canvas-specific animations */}
      <style>{`
        @keyframes syncNodeLag {
          0%, 100% { box-shadow: 0 0 15px hsla(45, 100%, 50%, 0.2); }
          50% { box-shadow: 0 0 30px hsla(45, 100%, 50%, 0.4), 0 0 60px hsla(45, 100%, 50%, 0.15); }
        }
        @keyframes syncNodeOffline {
          0%, 100% { box-shadow: 0 0 10px hsla(0, 100%, 50%, 0.15); }
          50% { box-shadow: 0 0 25px hsla(0, 100%, 50%, 0.3); }
        }
      `}</style>
    </div>
  );
}
