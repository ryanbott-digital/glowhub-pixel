import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Monitor, Link2, Trash2, Send, X, CheckSquare, Sparkles, Crown, FolderOpen } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ScreenStatusCard } from "@/components/screens/ScreenStatusCard";
import { Checkbox } from "@/components/ui/checkbox";
import { checkScreenLimit } from "@/lib/subscription";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ScreenGroupManager, type ScreenGroup, getGroupColorClass, getGroupIcon } from "@/components/screens/ScreenGroupManager";
import { BroadcastSuccessModal } from "@/components/BroadcastSuccessModal";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { DraggableScreenWrapper } from "@/components/screens/DraggableScreenWrapper";
import { DroppableGroupZone } from "@/components/screens/DroppableGroupZone";
import { FleetAlertBar } from "@/components/FleetAlertBar";

interface Screen {
  id: string;
  name: string;
  pairing_code: string | null;
  status: string;
  current_playlist_id: string | null;
  last_ping: string | null;
  group_id: string | null;
}

interface Playlist {
  id: string;
  title: string;
}

export default function Screens() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [groups, setGroups] = useState<ScreenGroup[]>([]);
  const [newName, setNewName] = useState("");
  const [newGroupId, setNewGroupId] = useState<string>("none");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pairOpen, setPairOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState("");
  const [pairing, setPairing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPlaylistId, setBulkPlaylistId] = useState("");
  const [screenLimit, setScreenLimit] = useState<number | null>(null);
  const [tierName, setTierName] = useState("free");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<{ title: string; description: string; showUpgrade: boolean }>({ title: "", description: "", showUpgrade: true });
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastScreenName, setBroadcastScreenName] = useState("");
  const [filterOfflineOnly, setFilterOfflineOnly] = useState(() => searchParams.get("filter") === "offline");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Auto-open pair dialog from QR code scan (?pair=CODE)
  useEffect(() => {
    const code = searchParams.get("pair");
    if (code && code.length === 6) {
      setPairingCode(code);
      setPairOpen(true);
      searchParams.delete("pair");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const selectionMode = selectedIds.size > 0;
  const atLimit = screenLimit !== null && screens.length >= screenLimit;
  const limitTooltip = atLimit
    ? tierName === "pro"
      ? "Maximum 5 screens reached"
      : "Limit reached — Upgrade to Pro"
    : "";

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [s, p, g] = await Promise.all([
      supabase.from("screens").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("playlists").select("id, title").eq("user_id", user.id),
      supabase.from("screen_groups").select("*").eq("user_id", user.id).order("created_at"),
    ]);
    if (s.data) setScreens(s.data as Screen[]);
    if (p.data) setPlaylists(p.data);
    if (g.data) setGroups(g.data as ScreenGroup[]);

    const { limit, tier } = await checkScreenLimit(user.id);
    setScreenLimit(limit);
    setTierName(tier);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const showUpgradeModal = (tier: string, limit: number) => {
    if (tier === "pro") {
      setUpgradeMessage({ title: "Pro Limit Reached", description: `You've reached the Pro limit of ${limit} screens. Contact us for an Enterprise plan with unlimited screens.`, showUpgrade: false });
    } else {
      setUpgradeMessage({ title: "Upgrade to Pro", description: `Your ${tier === "free" ? "Free" : "Basic"} plan supports ${limit} screen${limit !== 1 ? "s" : ""}. Upgrade to Pro to manage up to 5 screens.`, showUpgrade: true });
    }
    setUpgradeOpen(true);
  };

  const createScreen = async () => {
    if (!user || !newName.trim()) return;
    const { allowed, limit, tier } = await checkScreenLimit(user.id);
    if (!allowed) { showUpgradeModal(tier, limit); return; }

    const code = generateCode();
    const { error } = await supabase.from("screens").insert({
      user_id: user.id,
      name: newName.trim(),
      pairing_code: code,
      group_id: newGroupId === "none" ? null : newGroupId,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Screen created! Pairing code: " + code);
    setNewName("");
    setNewGroupId("none");
    setDialogOpen(false);
    fetchData();
  };

  const pairScreen = async () => {
    if (!user || pairingCode.length !== 6) return;
    setPairing(true);
    const { allowed, limit, tier } = await checkScreenLimit(user.id);
    if (!allowed) { showUpgradeModal(tier, limit); setPairing(false); return; }

    try {
      // Look up the code in the pairings table (created by the player edge function)
      const { data: pairing, error: findErr } = await supabase
        .from("pairings").select("id, screen_id, expires_at")
        .eq("pairing_code", pairingCode).maybeSingle();
      if (findErr) { toast.error("Error looking up code"); return; }
      if (!pairing) { toast.error("Invalid or expired pairing code."); return; }
      if (new Date(pairing.expires_at) < new Date()) { toast.error("This pairing code has expired."); return; }
      if (pairing.screen_id) { toast.error("This code has already been used."); return; }

      // Create a new screen for this user
      const { data: newScreen, error: createErr } = await supabase
        .from("screens").insert({
          user_id: user.id,
          name: "Paired Screen",
          pairing_code: pairingCode,
          status: "online",
        }).select("id, name").single();
      if (createErr || !newScreen) { toast.error("Failed to create screen: " + (createErr?.message || "Unknown error")); return; }

      // Link the pairing record to the new screen so the player detects it
      const { error: linkErr } = await supabase
        .from("pairings").update({ screen_id: newScreen.id })
        .eq("id", pairing.id);
      if (linkErr) { toast.error("Failed to link screen: " + linkErr.message); return; }

      toast.success(`Screen "${newScreen.name}" paired successfully!`);
      setPairingCode("");
      setPairOpen(false);
      fetchData();
    } finally { setPairing(false); }
  };

  const triggerFirstBroadcast = useCallback((sName: string) => {
    if (!localStorage.getItem("glowhub_first_broadcast_done")) {
      localStorage.setItem("glowhub_first_broadcast_done", "1");
      setBroadcastScreenName(sName);
      setBroadcastModalOpen(true);
    }
  }, []);

  const publishPlaylist = async (screenId: string, playlistId: string) => {
    const { error } = await supabase.from("screens").update({ current_playlist_id: playlistId }).eq("id", screenId);
    if (error) { toast.error(error.message); return; }
    const playlist = playlists.find((p) => p.id === playlistId);
    const screen = screens.find((s) => s.id === screenId);
    if (user) {
      await supabase.from("screen_activity_logs").insert({
        screen_id: screenId, user_id: user.id, action: "Playlist published",
        playlist_id: playlistId, playlist_title: playlist?.title || "Unknown",
      });
    }
    triggerFirstBroadcast(screen?.name || "Your screen");
    toast.success("Playlist published to screen!");
    fetchData();
  };

  const deleteScreen = async (id: string) => {
    await supabase.from("screens").delete().eq("id", id);
    toast.success("Screen deleted");
    fetchData();
  };

  const copyDisplayUrl = (screenId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/display/${screenId}`);
    toast.success("Display URL copied!");
  };

  const moveScreenToGroup = async (screenId: string, groupId: string | null) => {
    const { error } = await supabase.from("screens").update({ group_id: groupId }).eq("id", screenId);
    if (error) { toast.error(error.message); return; }
    toast.success("Screen moved");
    fetchData();
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
    setSelectedIds(selectedIds.size === screens.length ? new Set() : new Set(screens.map((s) => s.id)));
  };

  const clearSelection = () => { setSelectedIds(new Set()); setBulkPlaylistId(""); };

  const bulkPublish = async () => {
    if (!bulkPlaylistId || selectedIds.size === 0 || !user) return;
    const ids = Array.from(selectedIds);
    const playlist = playlists.find((p) => p.id === bulkPlaylistId);
    const { error } = await supabase.from("screens").update({ current_playlist_id: bulkPlaylistId }).in("id", ids);
    if (error) { toast.error(error.message); return; }
    await supabase.from("screen_activity_logs").insert(
      ids.map((screenId) => ({
        screen_id: screenId, user_id: user.id, action: "Playlist published (bulk)",
        playlist_id: bulkPlaylistId, playlist_title: playlist?.title || "Unknown",
      }))
    );
    const firstScreen = screens.find((s) => ids.includes(s.id));
    triggerFirstBroadcast(firstScreen?.name || "Your screens");
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

  const bulkMoveToGroup = async (groupId: string | null) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("screens").update({ group_id: groupId }).in("id", ids);
    if (error) { toast.error(error.message); return; }
    toast.success(`${ids.length} screen(s) moved`);
    clearSelection();
    fetchData();
  };

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
      return next;
    });
  };

  // ── Drag and drop ──
  const handleDragStart = (event: DragStartEvent) => {
    setActiveScreenId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveScreenId(null);
    const { active, over } = event;
    if (!over) return;

    const screenId = active.id as string;
    const targetGroupId = over.id as string;
    const newGroupId = targetGroupId === "ungrouped" ? null : targetGroupId;

    const screen = screens.find((s) => s.id === screenId);
    if (!screen) return;
    if (screen.group_id === newGroupId) return;

    // Optimistic update
    setScreens((prev) =>
      prev.map((s) => (s.id === screenId ? { ...s, group_id: newGroupId } : s))
    );

    const { error } = await supabase.from("screens").update({ group_id: newGroupId }).eq("id", screenId);
    if (error) {
      toast.error(error.message);
      fetchData();
      return;
    }

    const targetName = newGroupId ? groups.find((g) => g.id === newGroupId)?.name : "Ungrouped";
    toast.success(`Moved "${screen.name}" to ${targetName}`);
  };

  // ── Filter & organize screens by group ──
  const isScreenOffline = (s: Screen) => {
    if (!s.last_ping) return s.status !== "online";
    return Date.now() - new Date(s.last_ping).getTime() > 2 * 60 * 1000;
  };

  const filteredScreens = filterOfflineOnly
    ? screens.filter(isScreenOffline)
    : screens;

  const ungroupedScreens = filteredScreens.filter((s) => !s.group_id);
  const groupedScreenMap = groups.map((g) => ({
    group: g,
    screens: filteredScreens.filter((s) => s.group_id === g.id),
  }));

  const activeScreen = activeScreenId ? screens.find((s) => s.id === activeScreenId) : null;

  const renderScreenCard = (screen: Screen) => (
    <DraggableScreenWrapper key={screen.id} screenId={screen.id} disabled={selectionMode}>
      <div className="relative">
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
              ? selectedIds.has(screen.id) ? "ring-2 ring-primary rounded-xl" : "opacity-60"
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
            groups={groups}
            onMoveToGroup={moveScreenToGroup}
            tier={tierName}
          />
        </div>
      </div>
    </DraggableScreenWrapper>
  );

  return (
    <div className="space-y-6 animate-fade-in stagger-in">
      {/* Fleet Alert Bar */}
      <FleetAlertBar onFilterOffline={() => setFilterOfflineOnly(true)} />
      <BroadcastSuccessModal open={broadcastModalOpen} onOpenChange={setBroadcastModalOpen} screenName={broadcastScreenName} />
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Screens</h1>
          {filterOfflineOnly && (
            <button
              onClick={() => setFilterOfflineOnly(false)}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors"
              style={{
                background: "hsla(348, 100%, 50%, 0.12)",
                color: "hsl(348, 100%, 60%)",
                border: "1px solid hsla(348, 100%, 50%, 0.2)",
              }}
            >
              Showing offline only
              <X className="h-3 w-3" />
            </button>
          )}
          {screenLimit !== null && (
            <span className="text-sm text-muted-foreground font-medium">
              {screens.length}/{screenLimit} used
            </span>
          )}
          {screenLimit !== null && screenLimit > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-32 h-2 rounded-full bg-muted overflow-hidden cursor-default">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        screens.length >= screenLimit ? "bg-destructive" : screens.length >= screenLimit * 0.8 ? "bg-accent" : "bg-primary"
                      }`}
                      style={{ width: `${Math.min((screens.length / screenLimit) * 100, 100)}%` }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{screens.length} of {screenLimit} screens used — {tierName.charAt(0).toUpperCase() + tierName.slice(1)} plan</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {screens.length > 0 && (
            <Button variant="outline" size="sm" onClick={selectAll}>
              <CheckSquare className="h-4 w-4 mr-1" />
              {selectedIds.size === screens.length ? "Deselect All" : "Select All"}
            </Button>
          )}

          <ScreenGroupManager groups={groups} userId={user?.id || ""} onRefresh={fetchData} />

          {/* Pair Screen */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button variant="outline" disabled={atLimit} onClick={() => !atLimit && setPairOpen(true)}>
                    <Link2 className="h-4 w-4 mr-2" /> Pair Screen
                  </Button>
                </span>
              </TooltipTrigger>
              {atLimit && <TooltipContent><p>{limitTooltip}</p></TooltipContent>}
            </Tooltip>
          </TooltipProvider>

          {/* Add Screen */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button disabled={atLimit} onClick={() => !atLimit && setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Screen
                  </Button>
                </span>
              </TooltipTrigger>
              {atLimit && <TooltipContent><p>{limitTooltip}</p></TooltipContent>}
            </Tooltip>
          </TooltipProvider>

          {/* Pair Dialog */}
          <Dialog open={pairOpen} onOpenChange={setPairOpen}>
            <DialogContent className="sm:max-w-md glass-strong border-white/10">
              <DialogHeader><DialogTitle>Pair a Screen</DialogTitle></DialogHeader>
              <div className="space-y-6 py-4">
                <p className="text-sm text-muted-foreground text-center">
                  Enter the 6-digit code shown on your display device.
                </p>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={pairingCode} onChange={setPairingCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                      <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button onClick={pairScreen} className="w-full" disabled={pairingCode.length !== 6 || pairing}>
                  {pairing ? "Linking..." : "Link Screen"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Screen Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="glass-strong border-white/10">
              <DialogHeader><DialogTitle>Add Screen</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Screen name (e.g. Lobby TV)" value={newName} onChange={(e) => setNewName(e.target.value)} />
                {groups.length > 0 && (
                  <Select value={newGroupId} onValueChange={setNewGroupId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign to group (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No group</SelectItem>
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button onClick={createScreen} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk action toolbar */}
      {selectionMode && (
        <div className="rounded-2xl glass glass-spotlight border-primary/20 px-3 py-3 animate-fade-in space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{selectedIds.size} selected</span>
            <Button size="sm" variant="ghost" className="h-8" onClick={clearSelection}>
              <X className="h-3 w-3 mr-1" /> Cancel
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={bulkPlaylistId} onValueChange={setBulkPlaylistId}>
              <SelectTrigger className="flex-1 min-w-[140px] h-10 sm:h-8 text-xs"><SelectValue placeholder="Choose playlist…" /></SelectTrigger>
              <SelectContent>
                {playlists.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" className="h-10 sm:h-8" disabled={!bulkPlaylistId} onClick={bulkPublish}>
              <Send className="h-3 w-3 mr-1" /> Publish
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {groups.length > 0 && (
              <Select onValueChange={(v) => bulkMoveToGroup(v === "none" ? null : v)}>
                <SelectTrigger className="flex-1 min-w-[120px] h-10 sm:h-8 text-xs"><SelectValue placeholder="Move to group…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ungrouped</SelectItem>
                  {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button size="sm" variant="destructive" className="h-10 sm:h-8" onClick={bulkDelete}>
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Upgrade banner when at limit (non-pro) */}
      {atLimit && tierName !== "pro" && (
        <div className="relative overflow-hidden rounded-2xl glass-strong border border-primary/20 p-5 animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  You've reached your {tierName === "free" ? "Free" : "Basic"} plan limit of {screenLimit} screen{screenLimit !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Upgrade to Pro to manage up to 5 screens, plus unlock scheduling, analytics &amp; more.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/billing")}
              className="flex-shrink-0 bg-gradient-to-r from-primary to-accent hover:shadow-[0_0_16px_hsl(var(--primary)/0.4)] border-0 transition-shadow"
            >
              <Crown className="h-3.5 w-3.5 mr-1.5" /> Upgrade to Pro
            </Button>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Ungrouped screens */}
        <DroppableGroupZone groupId="ungrouped">
          {(ungroupedScreens.length > 0 || groups.length > 0) && (
            <div className="space-y-3 glass glass-spotlight rounded-2xl p-4">
              {groups.length > 0 && (
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  All Screens
                </h2>
              )}
              {ungroupedScreens.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 stagger-in">
                  {ungroupedScreens.map(renderScreenCard)}
                </div>
              ) : groups.length > 0 ? (
                <p className="text-sm text-muted-foreground py-3 pl-2">Drop screens here to ungroup them</p>
              ) : null}
            </div>
          )}
        </DroppableGroupZone>

        {/* Grouped screens */}
        {groupedScreenMap.map(({ group, screens: groupScreens }) => (
          <DroppableGroupZone key={group.id} groupId={group.id} className="glass glass-spotlight rounded-2xl p-4">
            <Collapsible
              open={!collapsedGroups.has(group.id)}
              onOpenChange={() => toggleGroupCollapse(group.id)}
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors w-full text-left py-1">
                  {(() => { const GIcon = getGroupIcon(group.icon); return <GIcon className="h-4 w-4 text-muted-foreground" />; })()}
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${getGroupColorClass(group.color)}`} />
                  {group.name}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({groupScreens.length} screen{groupScreens.length !== 1 ? "s" : ""})
                  </span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {groupScreens.length > 0 ? (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-3 stagger-in">
                    {groupScreens.map(renderScreenCard)}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-3 pl-6">Drop screens here</p>
                )}
              </CollapsibleContent>
            </Collapsible>
          </DroppableGroupZone>
        ))}

        {/* Drag overlay */}
        <DragOverlay>
          {activeScreen && (
            <div className="w-[300px] opacity-90 rotate-2 shadow-2xl">
              <ScreenStatusCard
                screen={activeScreen}
                playlists={playlists}
                onPublish={() => {}}
                onDelete={() => {}}
                onCopyUrl={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {screens.length === 0 && (
        <div className="text-center py-16 glass glass-spotlight rounded-2xl neon-aurora">
          <Monitor className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-60" />
          <p className="text-foreground font-medium">No screens paired yet</p>
          <p className="text-sm text-muted-foreground">Add a screen or pair one with a 6-digit code</p>
        </div>
      )}

      {/* Upgrade / Limit Modal */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="sm:max-w-md text-center glass-strong border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-xl">
              {upgradeMessage.showUpgrade ? <Crown className="h-5 w-5 text-accent" /> : <Sparkles className="h-5 w-5 text-primary" />}
              {upgradeMessage.title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm py-2">{upgradeMessage.description}</p>
          <div className="flex flex-col gap-2 pt-2">
            {upgradeMessage.showUpgrade ? (
              <Button onClick={() => { setUpgradeOpen(false); navigate("/subscription"); }}>
                <Crown className="h-4 w-4 mr-2" /> View Plans
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setUpgradeOpen(false)}>Got it</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
