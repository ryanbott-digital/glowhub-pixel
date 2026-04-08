import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { isProTier } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Trash2, Monitor, Layers, Crown, ArrowRight, ArrowDown,
  Heart, Link2, Unlink, Sparkles, Lock, ListMusic, Send, Eye, X, RefreshCw,
} from "lucide-react";

interface Playlist {
  id: string;
  title: string;
}

interface Screen {
  id: string;
  name: string;
  status: string;
  current_playlist_id: string | null;
}

interface PlaylistPreview {
  url: string;
  type: string; // "image" or "video"
}

interface SyncGroup {
  id: string;
  name: string;
  orientation: "horizontal" | "vertical";
  playlist_id: string | null;
  screens: { id: string; screen_id: string; position: number; screen?: Screen }[];
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
  const [newOrientation, setNewOrientation] = useState<"horizontal" | "vertical">("horizontal");
  const [addScreenOpen, setAddScreenOpen] = useState<string | null>(null);
  const [groupPreviews, setGroupPreviews] = useState<Record<string, PlaylistPreview | null>>({});
  const [previewGroupId, setPreviewGroupId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [screenRes, profileRes, groupRes, playlistRes] = await Promise.all([
      supabase.from("screens").select("id, name, status, current_playlist_id").eq("user_id", user.id),
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
          .select("id, screen_id, position")
          .eq("sync_group_id", g.id)
          .order("position");

        const screensInGroup = (members || []).map((m: any) => ({
          ...m,
          screen: screenRes.data?.find((s: Screen) => s.id === m.screen_id),
        }));

        groups.push({
          id: g.id,
          name: g.name,
          orientation: g.orientation as "horizontal" | "vertical",
          playlist_id: (g as any).playlist_id ?? null,
          screens: screensInGroup,
        });
      }
      setSyncGroups(groups);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch first media thumbnail for each sync group with an assigned playlist
  useEffect(() => {
    const fetchPreviews = async () => {
      const previews: Record<string, PlaylistPreview | null> = {};
      for (const group of syncGroups) {
        if (!group.playlist_id) { previews[group.id] = null; continue; }
        const { data } = await supabase
          .from("playlist_items")
          .select("media:media_id(storage_path, type)")
          .eq("playlist_id", group.playlist_id)
          .order("position")
          .limit(1)
          .maybeSingle();
        if (data?.media) {
          const m = data.media as any;
          const path = m.storage_path as string;
          const url = path.startsWith("https://")
            ? path
            : supabase.storage.from("signage-content").getPublicUrl(path).data.publicUrl;
          previews[group.id] = { url, type: (m.type as string).startsWith("video") ? "video" : "image" };
        } else {
          previews[group.id] = null;
        }
      }
      setGroupPreviews(previews);
    };
    if (syncGroups.length > 0) fetchPreviews();
  }, [syncGroups]);

  // Realtime sync heartbeat
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("sync-groups-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sync_groups", filter: `user_id=eq.${user.id}` }, () => fetchData())
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

  const handleDeleteGroup = async (groupId: string) => {
    const { error } = await supabase.from("sync_groups").delete().eq("id", groupId);
    if (error) { toast.error(error.message); return; }
    toast.success("Sync group deleted");
    fetchData();
  };

  const handleAddScreen = async (groupId: string, screenId: string) => {
    const group = syncGroups.find((g) => g.id === groupId);
    const nextPosition = group ? group.screens.length : 0;
    const { error } = await supabase.from("sync_group_screens").insert({
      sync_group_id: groupId,
      screen_id: screenId,
      position: nextPosition,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Screen added to sync group");
    setAddScreenOpen(null);
    fetchData();
  };

  const handleRemoveScreen = async (memberId: string) => {
    const { error } = await supabase.from("sync_group_screens").delete().eq("id", memberId);
    if (error) { toast.error(error.message); return; }
    toast.success("Screen removed");
    fetchData();
  };

  const handleAssignPlaylist = async (groupId: string, playlistId: string | null) => {
    const { error } = await supabase.from("sync_groups").update({ playlist_id: playlistId } as any).eq("id", groupId);
    if (error) { toast.error(error.message); return; }
    toast.success(playlistId ? "Playlist assigned to sync group" : "Playlist removed from sync group");
    fetchData();
  };

  const handlePushToAllScreens = async (group: SyncGroup) => {
    if (!group.playlist_id || group.screens.length === 0) {
      toast.error("Assign a playlist and add screens first");
      return;
    }
    const screenIds = group.screens.map((s) => s.screen_id);
    const { error } = await supabase
      .from("screens")
      .update({ current_playlist_id: group.playlist_id })
      .in("id", screenIds);
    if (error) { toast.error(error.message); return; }
    toast.success(`Playlist pushed to ${screenIds.length} screen${screenIds.length !== 1 ? "s" : ""}`);
  };

  const handleToggleOrientation = async (groupId: string, current: string) => {
    const next = current === "horizontal" ? "vertical" : "horizontal";
    const { error } = await supabase.from("sync_groups").update({ orientation: next }).eq("id", groupId);
    if (error) { toast.error(error.message); return; }
    fetchData();
  };

  const getMismatchedScreens = (group: SyncGroup) => {
    if (!group.playlist_id) return [];
    return group.screens.filter(
      (s) => s.screen?.current_playlist_id !== group.playlist_id
    );
  };

  const handleSyncMismatched = async (group: SyncGroup) => {
    const mismatched = getMismatchedScreens(group);
    if (mismatched.length === 0) return;
    const ids = mismatched.map((s) => s.screen_id);
    const { error } = await supabase
      .from("screens")
      .update({ current_playlist_id: group.playlist_id })
      .in("id", ids);
    if (error) { toast.error(error.message); return; }
    toast.success(`Synced ${ids.length} screen${ids.length !== 1 ? "s" : ""}`);
    fetchData();
  };

  // Screens already assigned to any sync group
  const assignedScreenIds = new Set(syncGroups.flatMap((g) => g.screens.map((s) => s.screen_id)));
  const availableScreens = screens.filter((s) => !assignedScreenIds.has(s.id));

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
                <span>Snap screens together horizontally or vertically</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span>Phase-synced rendering via realtime heartbeat</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Layers className="h-4 w-4 text-primary shrink-0" />
                <span>Automatic offset rendering (e.g. 5760×1080 across 3 screens)</span>
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-wide flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            Sync-Glow Canvas
          </h1>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mt-0.5">
            Multi-Screen Content Spanning
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

      {/* Sync Groups */}
      {syncGroups.length === 0 ? (
        <div className="glass glass-spotlight rounded-2xl p-12 text-center">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Sync Groups Yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Create a sync group and snap your screens together to span content across multiple displays.
          </p>
          <Button onClick={() => setCreateOpen(true)} variant="outline" className="glass">
            <Plus className="h-4 w-4 mr-1.5" />
            Create Your First Group
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {syncGroups.map((group) => {
            const totalWidth = group.orientation === "horizontal" ? group.screens.length * 1920 : 1920;
            const totalHeight = group.orientation === "vertical" ? group.screens.length * 1080 : 1080;

            return (
              <div
                key={group.id}
                className="glass glass-spotlight rounded-2xl p-6 relative overflow-hidden"
              >
                {/* Blueprint grid background */}
                <div
                  className="absolute inset-0 opacity-[0.04] pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                      linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
                    `,
                    backgroundSize: "40px 40px",
                  }}
                />

                {/* Header */}
                <div className="flex items-center justify-between mb-5 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Layers className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{group.name}</h3>
                      <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
                        {group.screens.length} screen{group.screens.length !== 1 ? "s" : ""} · {totalWidth}×{totalHeight}
                      </p>
                    </div>
                    {/* Sync heartbeat */}
                    {group.screens.length > 1 && (
                      <div className="flex items-center gap-1.5 ml-3">
                        <Heart className="h-3.5 w-3.5 text-primary animate-pulse" />
                        <span className="text-[10px] font-bold tracking-widest uppercase text-primary">SYNCED</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleOrientation(group.id, group.orientation)}
                      className="text-xs gap-1.5"
                    >
                      {group.orientation === "horizontal" ? (
                        <><ArrowRight className="h-3.5 w-3.5" /> Horizontal</>
                      ) : (
                        <><ArrowDown className="h-3.5 w-3.5" /> Vertical</>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAddScreenOpen(group.id)}
                      className="text-xs gap-1.5"
                      disabled={availableScreens.length === 0}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Playlist Assignment */}
                <div className="flex items-center gap-3 mb-5 relative z-10">
                  <ListMusic className="h-4 w-4 text-primary shrink-0" />
                  <Select
                    value={group.playlist_id || "none"}
                    onValueChange={(v) => handleAssignPlaylist(group.id, v === "none" ? null : v)}
                  >
                    <SelectTrigger className="glass flex-1 h-9 text-xs">
                      <SelectValue placeholder="Assign a playlist…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No playlist</SelectItem>
                      {playlists.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewGroupId(group.id)}
                    disabled={!group.playlist_id || group.screens.length === 0}
                    className="glass text-xs gap-1.5 rounded-lg font-semibold tracking-wider"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handlePushToAllScreens(group)}
                    disabled={!group.playlist_id || group.screens.length === 0}
                    className="bg-gradient-to-r from-primary to-glow-blue text-primary-foreground text-xs gap-1.5 rounded-lg font-semibold tracking-wider"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Push to All
                  </Button>
                  {(() => {
                    const mismatched = getMismatchedScreens(group);
                    if (mismatched.length === 0) return null;
                    return (
                      <Button
                        size="sm"
                        onClick={() => handleSyncMismatched(group)}
                        className="text-xs gap-1.5 rounded-lg font-semibold tracking-wider border-amber-500/50 text-amber-400 hover:bg-amber-500/20 animate-pulse"
                        variant="outline"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Sync All ({mismatched.length})
                      </Button>
                    );
                  })()}
                </div>
                        aspectRatio: group.orientation === "horizontal"
                          ? `${16 * group.screens.length}/9`
                          : `16/${9 * group.screens.length}`,
                        maxHeight: "140px",
                      }}
                    >
                      {/* Full content image */}
                      {groupPreviews[group.id]!.type === "image" ? (
                        <img
                          src={groupPreviews[group.id]!.url}
                          alt="Content preview"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={groupPreviews[group.id]!.url}
                          muted
                          className="absolute inset-0 w-full h-full object-cover"
                          onLoadedData={(e) => { (e.target as HTMLVideoElement).currentTime = 1; }}
                        />
                      )}
                      {/* Dim overlay */}
                      <div className="absolute inset-0 bg-background/40" />
                      {/* Segment dividers + labels */}
                      <div className={`absolute inset-0 flex ${group.orientation === "vertical" ? "flex-col" : "flex-row"}`}>
                        {group.screens.map((member, idx) => {
                          const pct = 100 / group.screens.length;
                          return (
                            <div
                              key={member.id}
                              className="relative flex-1 flex items-center justify-center"
                              style={{
                                borderRight: group.orientation === "horizontal" && idx < group.screens.length - 1
                                  ? "2px dashed hsl(var(--primary))"
                                  : undefined,
                                borderBottom: group.orientation === "vertical" && idx < group.screens.length - 1
                                  ? "2px dashed hsl(var(--primary))"
                                  : undefined,
                              }}
                            >
                              <div className="bg-background/70 backdrop-blur-sm rounded px-2 py-0.5 text-center">
                                <span className="text-[9px] font-mono font-bold text-primary block">
                                  {member.screen?.name || `Screen ${idx + 1}`}
                                </span>
                                <span className="text-[8px] font-mono text-muted-foreground">
                                  {Math.round(pct)}% {group.orientation === "horizontal" ? "width" : "height"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Canvas workspace */}
                <div className="relative z-10">
                  {group.screens.length === 0 ? (
                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        Add screens to this group to start building your canvas
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Neon teal border around the group */}
                      <div
                        className="absolute -inset-1 rounded-xl pointer-events-none"
                        style={{
                          border: "2px solid hsl(var(--primary))",
                          boxShadow: "0 0 15px hsla(180, 100%, 32%, 0.3), inset 0 0 15px hsla(180, 100%, 32%, 0.1)",
                          animation: "syncBorderPulse 3s ease-in-out infinite",
                        }}
                      />
                      <div
                        className={`flex gap-0.5 ${group.orientation === "vertical" ? "flex-col" : "flex-row"}`}
                      >
                        {group.screens.map((member, idx) => {
                          const preview = groupPreviews[group.id];
                          const total = group.screens.length;
                          const isHoriz = group.orientation === "horizontal";
                          return (
                          <div
                            key={member.id}
                            className="relative group flex-1 min-w-0"
                          >
                            <Card className="bg-card/80 border-border/50 rounded-lg p-4 h-full">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Monitor className="h-4 w-4 text-primary" />
                                  <span className="text-sm font-medium text-foreground truncate">
                                    {member.screen?.name || "Unknown"}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveScreen(member.id)}
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Unlink className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>

                              {/* Per-screen cropped preview */}
                              <div
                                className="rounded-md overflow-hidden border border-border/30 relative"
                                style={{ aspectRatio: "16/9" }}
                              >
                                {preview ? (
                                  <div className="absolute inset-0 overflow-hidden">
                                    {preview.type === "image" ? (
                                      <img
                                        src={preview.url}
                                        alt={`Screen ${idx + 1} crop`}
                                        className="absolute"
                                        style={{
                                          width: isHoriz ? `${total * 100}%` : "100%",
                                          height: isHoriz ? "100%" : `${total * 100}%`,
                                          left: isHoriz ? `-${idx * 100}%` : "0",
                                          top: isHoriz ? "0" : `-${idx * 100}%`,
                                          objectFit: "cover",
                                        }}
                                      />
                                    ) : (
                                      <video
                                        src={preview.url}
                                        muted
                                        className="absolute"
                                        style={{
                                          width: isHoriz ? `${total * 100}%` : "100%",
                                          height: isHoriz ? "100%" : `${total * 100}%`,
                                          left: isHoriz ? `-${idx * 100}%` : "0",
                                          top: isHoriz ? "0" : `-${idx * 100}%`,
                                          objectFit: "cover",
                                        }}
                                        onLoadedData={(e) => { (e.target as HTMLVideoElement).currentTime = 1; }}
                                      />
                                    )}
                                    {/* Crop label overlay */}
                                    <div className="absolute bottom-1 left-1 bg-background/70 backdrop-blur-sm rounded px-1.5 py-0.5">
                                      <span className="text-[8px] font-mono text-primary font-bold">
                                        {Math.round(100 / total)}% {isHoriz ? "W" : "H"} · Pos {idx + 1}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center gap-1">
                                    <span className="text-[10px] font-mono text-muted-foreground/60 tracking-wider">
                                      SCREEN {idx + 1} OF {total}
                                    </span>
                                    <span className="text-[9px] font-mono text-muted-foreground/40">
                                      {isHoriz
                                        ? `Renders ${Math.round(100 / total)}% width`
                                        : `Renders ${Math.round(100 / total)}% height`}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Status dot */}
                              <div className="flex items-center gap-1.5 mt-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${member.screen?.status === "online" ? "bg-emerald-400" : "bg-muted-foreground/30"}`} />
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                  {member.screen?.status || "offline"}
                                </span>
                                {group.screens.length > 1 && member.screen?.status === "online" && (
                                  <Heart
                                    className="h-2.5 w-2.5 text-primary ml-auto"
                                    style={{ animation: `syncHeartbeat 1.5s ease-in-out infinite ${idx * 0.2}s` }}
                                  />
                                )}
                              </div>

                              {/* Currently playing playlist indicator */}
                              {(() => {
                                const screenPlaylistId = member.screen?.current_playlist_id;
                                const screenPlaylist = screenPlaylistId ? playlists.find(p => p.id === screenPlaylistId) : null;
                                const isSynced = group.playlist_id && screenPlaylistId === group.playlist_id;
                                const hasPlaylist = !!screenPlaylistId;
                                return (
                                  <div className="flex items-center gap-1.5 mt-1.5 px-1.5 py-1 rounded-md bg-muted/30">
                                    <ListMusic className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                                    {hasPlaylist ? (
                                      <>
                                        <span className="text-[9px] text-muted-foreground truncate flex-1">
                                          {screenPlaylist?.title || "Unknown playlist"}
                                        </span>
                                        {isSynced ? (
                                          <span className="text-[8px] font-bold text-emerald-400 tracking-wider shrink-0">✓ SYNCED</span>
                                        ) : (
                                          <span className="text-[8px] font-bold text-amber-400 tracking-wider shrink-0">⚠ OUT OF SYNC</span>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-[9px] text-muted-foreground/40 italic">No playlist</span>
                                    )}
                                  </div>
                                );
                              })()}
                            </Card>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateGroup} className="w-full bg-gradient-to-r from-primary to-glow-blue text-primary-foreground font-semibold tracking-wider">
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Screen Dialog */}
      <Dialog open={!!addScreenOpen} onOpenChange={() => setAddScreenOpen(null)}>
        <DialogContent className="glass sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Add Screen to Group
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            {availableScreens.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                All screens are already assigned to sync groups.
              </p>
            ) : (
              availableScreens.map((screen) => (
                <button
                  key={screen.id}
                  onClick={() => addScreenOpen && handleAddScreen(addScreenOpen, screen.id)}
                  className="w-full glass rounded-xl p-3 flex items-center gap-3 hover:bg-primary/5 transition-colors text-left"
                >
                  <Monitor className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{screen.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{screen.status}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${screen.status === "online" ? "bg-emerald-400" : "bg-muted-foreground/30"}`} />
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Span Preview */}
      {previewGroupId && (() => {
        const group = syncGroups.find(g => g.id === previewGroupId);
        const preview = group ? groupPreviews[group.id] : null;
        if (!group) return null;
        const isHoriz = group.orientation === "horizontal";
        const total = group.screens.length;
        return (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-foreground tracking-wide">Span Preview — {group.name}</h3>
                  <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
                    {total} screen{total !== 1 ? "s" : ""} · {isHoriz ? "Horizontal" : "Vertical"} · {isHoriz ? total * 1920 : 1920}×{isHoriz ? 1080 : total * 1080}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPreviewGroupId(null)} className="gap-1.5">
                <X className="h-4 w-4" /> Close
              </Button>
            </div>

            {/* Combined view */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 overflow-auto">
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Combined Canvas</p>
              <div
                className="relative rounded-xl overflow-hidden border-2 border-primary/40 shadow-[0_0_30px_hsla(180,100%,32%,0.2)]"
                style={{
                  aspectRatio: isHoriz ? `${16 * total}/9` : `16/${9 * total}`,
                  maxWidth: isHoriz ? "90vw" : "40vw",
                  maxHeight: isHoriz ? "35vh" : "70vh",
                  width: "100%",
                }}
              >
                {preview ? (
                  <>
                    {preview.type === "image" ? (
                      <img src={preview.url} alt="Span preview" className="w-full h-full object-cover" />
                    ) : (
                      <video src={preview.url} muted autoPlay loop className="w-full h-full object-cover" />
                    )}
                    {/* Screen divider lines */}
                    <div className={`absolute inset-0 flex ${isHoriz ? "flex-row" : "flex-col"}`}>
                      {group.screens.map((member, idx) => (
                        <div
                          key={member.id}
                          className="flex-1 relative"
                          style={{
                            borderRight: isHoriz && idx < total - 1 ? "2px dashed hsl(var(--primary))" : undefined,
                            borderBottom: !isHoriz && idx < total - 1 ? "2px dashed hsl(var(--primary))" : undefined,
                          }}
                        >
                          <div className="absolute top-1 left-1 bg-background/70 backdrop-blur-sm rounded px-1.5 py-0.5">
                            <span className="text-[8px] font-mono font-bold text-primary">
                              {member.screen?.name || `Screen ${idx + 1}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">No content to preview</span>
                  </div>
                )}
              </div>

              {/* Individual screen crops */}
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-2">Per-Screen Crops</p>
              <div className={`flex gap-4 ${isHoriz ? "flex-row" : "flex-col"} items-center`}>
                {group.screens.map((member, idx) => (
                  <div key={member.id} className="flex flex-col items-center gap-1.5">
                    <div
                      className="relative rounded-lg overflow-hidden border border-border/40"
                      style={{ width: isHoriz ? `${Math.min(280, 80 / total)}vw` : "200px", aspectRatio: "16/9" }}
                    >
                      {preview ? (
                        <div className="absolute inset-0 overflow-hidden">
                          {preview.type === "image" ? (
                            <img
                              src={preview.url}
                              alt={`Screen ${idx + 1}`}
                              className="absolute"
                              style={{
                                width: isHoriz ? `${total * 100}%` : "100%",
                                height: isHoriz ? "100%" : `${total * 100}%`,
                                left: isHoriz ? `-${idx * 100}%` : "0",
                                top: isHoriz ? "0" : `-${idx * 100}%`,
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <video
                              src={preview.url}
                              muted
                              autoPlay
                              loop
                              className="absolute"
                              style={{
                                width: isHoriz ? `${total * 100}%` : "100%",
                                height: isHoriz ? "100%" : `${total * 100}%`,
                                left: isHoriz ? `-${idx * 100}%` : "0",
                                top: isHoriz ? "0" : `-${idx * 100}%`,
                                objectFit: "cover",
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                          <span className="text-[9px] text-muted-foreground/40">No content</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {member.screen?.name || `Screen ${idx + 1}`} — {Math.round(100 / total)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes syncBorderPulse {
          0%, 100% { box-shadow: 0 0 15px hsla(180, 100%, 32%, 0.3), inset 0 0 15px hsla(180, 100%, 32%, 0.1); }
          50% { box-shadow: 0 0 25px hsla(180, 100%, 32%, 0.5), inset 0 0 25px hsla(180, 100%, 32%, 0.15); }
        }
        @keyframes syncHeartbeat {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
