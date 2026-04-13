import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isProTier } from "@/lib/subscription";
import { GlowLogoImage } from "@/components/GlowHubLogo";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash2, Copy, ChevronDown, Clock, Calendar, History, HardDrive, FolderOpen, Repeat, Shuffle, ShieldCheck, Power, Zap, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { WeeklyScheduleGrid } from "@/components/screens/WeeklyScheduleGrid";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface Playlist {
  id: string;
  title: string;
}

interface ScreenGroup {
  id: string;
  name: string;
}

export interface ScreenStatusCardProps {
  screen: {
    id: string;
    name: string;
    pairing_code: string | null;
    status: string;
    current_playlist_id: string | null;
    last_ping: string | null;
    group_id?: string | null;
    transition_type?: string;
    crossfade_ms?: number;
    loop_enabled?: boolean;
    launch_on_boot?: boolean;
    last_remote_trigger?: string | null;
  };
  playlists: Playlist[];
  onPublish: (screenId: string, playlistId: string) => void;
  onDelete: (id: string) => void;
  onCopyUrl: (id: string) => void;
  groups?: ScreenGroup[];
  onMoveToGroup?: (screenId: string, groupId: string | null) => void;
  tier?: string;
}

interface CurrentMedia {
  name: string;
  storage_path: string;
  type: string;
}

interface ActivityLog {
  id: string;
  action: string;
  playlist_title: string | null;
  created_at: string;
}

function SyncStatusIndicator({ screenId, playlistId }: { screenId: string; playlistId: string }) {
  const { subscriptionTier } = useAuth();
  const [totalItems, setTotalItems] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from("playlist_items")
      .select("id", { count: "exact", head: true })
      .eq("playlist_id", playlistId)
      .then(({ count }) => {
        setTotalItems(count ?? 0);
        setLoaded(true);
      });
  }, [playlistId]);

  if (!loaded || totalItems === 0) return null;

  return (
    <div>
      <h4 className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1.5">
        <HardDrive className="h-3 w-3 text-primary" /> Sync Status
        {!isProTier(subscriptionTier) && <span className="pro-badge">PRO</span>}
      </h4>
      <div className="flex items-center gap-2">
        <Progress value={100} className="h-1.5 flex-1" />
        <span className="text-[10px] text-muted-foreground font-mono">{totalItems} file{totalItems !== 1 ? "s" : ""}</span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">
        Cache-first • Files served from device storage when offline
      </p>
    </div>
  );
}

export function ScreenStatusCard({ screen, playlists, onPublish, onDelete, onCopyUrl, groups, onMoveToGroup, tier }: ScreenStatusCardProps) {
  const [media, setMedia] = useState<CurrentMedia | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [transitionType, setTransitionType] = useState(screen.transition_type || "crossfade");
  const [crossfadeMs, setCrossfadeMs] = useState(screen.crossfade_ms ?? 500);
  const [loopEnabled, setLoopEnabled] = useState(screen.loop_enabled !== false);
  const [launchOnBoot, setLaunchOnBoot] = useState(screen.launch_on_boot === true);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(screen.name);
  const [displayName, setDisplayName] = useState(screen.name);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const handleRename = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === displayName) { setRenaming(false); return; }
    const { error } = await supabase.from("screens").update({ name: trimmed } as any).eq("id", screen.id);
    if (error) { toast.error("Failed to rename screen"); return; }
    setDisplayName(trimmed);
    setRenaming(false);
    toast.success(`Screen renamed to "${trimmed}"`);
  };

  const updateScreenSetting = useCallback(async (updates: Partial<{ transition_type: string; crossfade_ms: number; loop_enabled: boolean; launch_on_boot: boolean }>) => {
    const { error } = await supabase.from("screens").update(updates as any).eq("id", screen.id);
    if (error) toast.error("Failed to save setting");
  }, [screen.id]);

  const isAlive = (() => {
    if (!screen.last_ping) return false;
    const diff = Date.now() - new Date(screen.last_ping).getTime();
    return diff < 2 * 60 * 1000;
  })();

  const fetchThumbnail = useCallback(async () => {
    if (!screen.current_playlist_id) { setMedia(null); return; }
    const { data } = await supabase
      .from("playlist_items")
      .select("media:media_id(name, storage_path, type)")
      .eq("playlist_id", screen.current_playlist_id)
      .order("position")
      .limit(1);
    if (data && data.length > 0) {
      setMedia((data[0] as any).media);
    } else {
      setMedia(null);
    }
  }, [screen.current_playlist_id]);

  const fetchActivityLogs = useCallback(async () => {
    setLoadingLogs(true);
    const { data } = await supabase
      .from("screen_activity_logs")
      .select("id, action, playlist_title, created_at")
      .eq("screen_id", screen.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setActivityLogs(data);
    setLoadingLogs(false);
  }, [screen.id]);

  useEffect(() => { fetchThumbnail(); }, [fetchThumbnail]);

  useEffect(() => {
    if (expanded) fetchActivityLogs();
  }, [expanded, fetchActivityLogs]);

  const thumbnailUrl = media
    ? supabase.storage.from("signage-content").getPublicUrl(media.storage_path).data.publicUrl
    : null;

  // Neon Crimson palette for offline state
  const crimson = "348, 100%, 50%"; // #FF003C

  return (
    <div
      className={`group relative flex flex-col rounded-2xl glass overflow-hidden transition-all duration-300 hover:shadow-lg ${!isAlive ? "watchdog-offline-pulse" : ""}`}
      style={{
        boxShadow: isAlive
          ? "0 0 20px hsla(180, 100%, 45%, 0.08), 0 4px 20px rgba(0,0,0,0.1)"
          : `0 0 25px hsla(${crimson}, 0.25), 0 0 60px hsla(${crimson}, 0.12), 0 4px 20px rgba(0,0,0,0.15)`,
      }}
    >
      {/* Clickable top area — monitor + name */}
      <button
        type="button"
        onClick={() => { if (longPressTriggered.current) { longPressTriggered.current = false; return; } setExpanded((v) => !v); }}
        className="text-left w-full focus:outline-none"
      >
        {/* Mini-Monitor with Radiant Glow */}
        <div className="relative p-4 pb-2">
          <div
            className="absolute rounded-2xl pointer-events-none"
            style={{
              inset: "8px",
              filter: "blur(28px)",
              opacity: 0.45,
              background: isAlive
                ? `
                  radial-gradient(ellipse at 20% 50%, hsla(330, 80%, 60%, 0.5) 0%, transparent 50%),
                  radial-gradient(ellipse at 80% 50%, hsla(180, 100%, 45%, 0.5) 0%, transparent 50%),
                  radial-gradient(ellipse at 50% 80%, hsla(120, 60%, 50%, 0.3) 0%, transparent 50%),
                  radial-gradient(ellipse at 50% 20%, hsla(24, 95%, 53%, 0.4) 0%, transparent 50%)
                `
                : `
                  radial-gradient(ellipse at 30% 50%, hsla(${crimson}, 0.6) 0%, transparent 50%),
                  radial-gradient(ellipse at 70% 50%, hsla(${crimson}, 0.4) 0%, transparent 50%),
                  radial-gradient(ellipse at 50% 80%, hsla(${crimson}, 0.3) 0%, transparent 60%)
                `,
              animation: isAlive ? "radiantPulseCard 4s ease-in-out infinite" : "watchdogPulse 2.5s ease-in-out infinite",
            }}
          />

          <div
            className="relative w-full aspect-video rounded-lg overflow-hidden bg-secondary"
            style={{
              border: isAlive ? "1px solid hsla(0, 0%, 100%, 0.08)" : `1px solid hsla(${crimson}, 0.3)`,
              boxShadow: isAlive
                ? `0 0 20px hsla(180, 100%, 45%, 0.1), 0 0 40px hsla(330, 80%, 60%, 0.07), 0 12px 24px -6px rgba(0,0,0,0.3)`
                : `0 0 20px hsla(${crimson}, 0.15), 0 0 40px hsla(${crimson}, 0.08), 0 12px 24px -6px rgba(0,0,0,0.4)`,
            }}
          >
            <div className="absolute inset-[3px] rounded-md bg-black overflow-hidden">
              {thumbnailUrl ? (
                <>
                  {media?.type === "video" ? (
                    <video src={thumbnailUrl} muted className="w-full h-full object-cover" preload="metadata" />
                  ) : (
                    <img src={thumbnailUrl} alt={media?.name || ""} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
                    <span className="text-[8px] text-white/60 font-medium truncate max-w-[70%]">{media?.name}</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[hsl(220,60%,7%)]">
                  <div className="empty-state-pulse">
                    <GlowLogoImage className="h-8 drop-shadow-[0_0_15px_hsla(180,100%,45%,0.3)]" />
                  </div>
                  <p className="text-[9px] text-muted-foreground">No content assigned</p>
                </div>
              )}

              {/* Offline scanline overlay */}
              {!isAlive && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `
                      repeating-linear-gradient(0deg, transparent, transparent 2px, hsla(${crimson}, 0.03) 2px, hsla(${crimson}, 0.03) 4px)
                    `,
                    mixBlendMode: "screen",
                  }}
                />
              )}
            </div>

            {/* Glowing status pulse */}
            <div className="absolute top-1.5 right-1.5 z-10">
              <span className="relative flex h-3.5 w-3.5">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{
                    backgroundColor: isAlive
                      ? "hsla(150, 70%, 50%, 0.7)"
                      : `hsla(${crimson}, 0.7)`,
                  }}
                />
                <span
                  className="relative inline-flex rounded-full h-3.5 w-3.5 border border-black/30"
                  style={{
                    backgroundColor: isAlive ? "hsl(150, 70%, 50%)" : `hsl(${crimson})`,
                    boxShadow: isAlive
                      ? "0 0 8px hsla(150, 70%, 50%, 0.6), 0 0 20px hsla(150, 70%, 50%, 0.3)"
                      : `0 0 8px hsla(${crimson}, 0.8), 0 0 20px hsla(${crimson}, 0.4)`,
                  }}
                />
              </span>
            </div>
          </div>
        </div>

        {/* Name + status row */}
        <div className="px-4 pt-2 pb-3 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3
              className="font-semibold text-sm text-foreground truncate min-w-0 select-none"
              onTouchStart={(e) => {
                longPressTriggered.current = false;
                longPressTimer.current = setTimeout(() => {
                  longPressTriggered.current = true;
                  e.preventDefault();
                  setRenameValue(displayName);
                  setRenaming(true);
                }, 500);
              }}
              onTouchEnd={() => {
                if (longPressTimer.current) clearTimeout(longPressTimer.current);
              }}
              onTouchMove={() => {
                if (longPressTimer.current) clearTimeout(longPressTimer.current);
              }}
              onContextMenu={(e) => e.preventDefault()}
            >{displayName}</h3>
            {launchOnBoot && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0"
                style={{
                  background: "hsla(180, 100%, 40%, 0.12)",
                  color: "hsl(180, 100%, 40%)",
                  border: "1px solid hsla(180, 100%, 40%, 0.2)",
                }}
                title="Hardware Protected — Auto-Start enabled"
              >
                <ShieldCheck className="h-3 w-3" />
                Protected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAlive ? (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: "hsla(150, 70%, 50%, 0.1)",
                  color: "hsl(150, 70%, 50%)",
                }}
              >
                Online
              </span>
            ) : (
              <span
                className="badge-flicker text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase"
                style={{
                  background: `hsla(${crimson}, 0.15)`,
                  color: `hsl(${crimson})`,
                  boxShadow: `0 0 12px hsla(${crimson}, 0.3), inset 0 0 8px hsla(${crimson}, 0.1)`,
                  border: `1px solid hsla(${crimson}, 0.25)`,
                }}
              >
                ⚠️ OFFLINE
              </span>
            )}
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </div>
        </div>

        {/* Time since last seen — visible even when collapsed */}
        {!isAlive && screen.last_ping && (
          <div className="px-4 pb-2 -mt-1">
            <span
              className="text-[10px] font-medium"
              style={{ color: `hsl(${crimson})` }}
            >
              Last active {formatDistanceToNow(new Date(screen.last_ping), { addSuffix: true })}
            </span>
          </div>
        )}
      </button>

      {/* Expandable detail section */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: expanded ? "800px" : "0", opacity: expanded ? 1 : 0 }}
      >
        <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-3">
          {/* Rename */}
          <div className="flex items-center gap-2">
            {renaming ? (
              <>
                <Input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="h-10 sm:h-8 text-sm flex-1"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setRenaming(false); }}
                />
                <Button size="icon" variant="ghost" className="h-10 w-10 sm:h-8 sm:w-8 shrink-0" onClick={handleRename}>
                  <Check className="h-4 w-4 text-primary" />
                </Button>
                <Button size="icon" variant="ghost" className="h-10 w-10 sm:h-8 sm:w-8 shrink-0" onClick={() => { setRenaming(false); setRenameValue(displayName); }}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setRenameValue(displayName); setRenaming(true); }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-1 -ml-1 min-h-[44px]"
              >
                <Pencil className="h-4 w-4" /> Rename screen
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {screen.last_ping
              ? `Last seen ${formatDistanceToNow(new Date(screen.last_ping), { addSuffix: true })}`
              : <span className="animate-pulse text-primary">Just paired</span>}
          </div>

          {screen.last_remote_trigger && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-primary" />
              Last remote trigger {formatDistanceToNow(new Date(screen.last_remote_trigger), { addSuffix: true })}
            </div>
          )}

          {screen.pairing_code && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Code:</span>
              <span className="font-mono text-sm tracking-widest text-foreground">{screen.pairing_code}</span>
            </div>
          )}

          {/* Playlist selector */}
          <div className="flex items-center gap-2">
            <Select
              value={screen.current_playlist_id || ""}
              onValueChange={(val) => onPublish(screen.id, val)}
            >
              <SelectTrigger className="flex-1 h-10 sm:h-8 text-xs glass">
                <SelectValue placeholder="Select playlist" />
              </SelectTrigger>
              <SelectContent>
                {playlists.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon" variant="outline" className="h-10 w-10 sm:h-8 sm:w-8 shrink-0"
              onClick={() => screen.current_playlist_id && onPublish(screen.id, screen.current_playlist_id)}
              title="Publish"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Move to group */}
          {groups && groups.length > 0 && onMoveToGroup && (
            <div className="flex items-center gap-1.5">
              <FolderOpen className="h-3 w-3 text-muted-foreground" />
              <Select
                value={screen.group_id || "none"}
                onValueChange={(val) => onMoveToGroup(screen.id, val === "none" ? null : val)}
              >
                <SelectTrigger className="flex-1 h-7 text-xs">
                  <SelectValue placeholder="Move to group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ungrouped</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Transition & Loop settings */}
          <div className="space-y-3 rounded-xl bg-muted/30 p-3">
            <h4 className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Shuffle className="h-3 w-3 text-primary" /> Playback Settings
            </h4>

            {/* Transition type */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground w-20 shrink-0">Transition</Label>
              <Select
                value={transitionType}
                onValueChange={(val) => {
                  setTransitionType(val);
                  updateScreenSetting({ transition_type: val });
                }}
              >
                <SelectTrigger className="flex-1 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crossfade">Crossfade</SelectItem>
                  <SelectItem value="cut">Cut (instant)</SelectItem>
                  <SelectItem value="fade-black">Fade to Black</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Crossfade duration — only show when crossfade or fade-black */}
            {transitionType !== "cut" && (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground w-20 shrink-0">Duration</Label>
                <Slider
                  min={100}
                  max={2000}
                  step={100}
                  value={[crossfadeMs]}
                  onValueChange={([val]) => setCrossfadeMs(val)}
                  onValueCommit={([val]) => updateScreenSetting({ crossfade_ms: val })}
                  className="flex-1"
                />
                <span className="text-[10px] text-muted-foreground font-mono w-10 text-right">
                  {(crossfadeMs / 1000).toFixed(1)}s
                </span>
              </div>
            )}

            {/* Loop toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Repeat className="h-3 w-3 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground">Loop playlist</Label>
              </div>
              <Switch
                checked={loopEnabled}
                onCheckedChange={(checked) => {
                  setLoopEnabled(checked);
                  updateScreenSetting({ loop_enabled: checked });
                }}
              />
            </div>
          </div>

          {/* Auto-Start on Boot */}
          <div className="space-y-2 rounded-xl bg-muted/30 p-3">
            <h4 className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Power className="h-3 w-3 text-primary" /> Hardware Persistence
            </h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground">Auto-Start on Power Up</Label>
              </div>
              <Switch
                checked={launchOnBoot}
                onCheckedChange={(checked) => {
                  setLaunchOnBoot(checked);
                  updateScreenSetting({ launch_on_boot: checked });
                  toast.success(checked ? "Auto-Start enabled — screen is now Hardware Protected" : "Auto-Start disabled");
                }}
              />
            </div>
            {launchOnBoot && (
              <p className="text-[10px] text-primary/70 flex items-center gap-1">
                <ShieldCheck className="h-2.5 w-2.5" /> This screen will auto-launch Glow Player on device boot
              </p>
            )}
          </div>

          {/* Actions row */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs h-10 sm:h-8 flex-1" onClick={() => onCopyUrl(screen.id)}>
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy URL
            </Button>
            <Button variant="ghost" size="sm" className="h-10 sm:h-8 w-10 sm:w-8 p-0" onClick={() => onDelete(screen.id)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>

          {/* Sync Status */}
          {screen.current_playlist_id && (
            <SyncStatusIndicator screenId={screen.id} playlistId={screen.current_playlist_id} />
          )}

          {/* Weekly Schedule */}
          <div>
            <h4 className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-2">
              <Calendar className="h-3 w-3 text-primary" /> Weekly Schedule
            </h4>
            <WeeklyScheduleGrid screenId={screen.id} playlists={playlists} tier={tier} />
          </div>

          {/* Playback History */}
          <div>
            <h4 className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-2">
              <History className="h-3 w-3 text-primary" /> Recent Activity
            </h4>
            {loadingLogs ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : activityLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No activity recorded yet</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground">{log.action}</span>
                      {log.playlist_title && (
                        <span className="text-muted-foreground"> — {log.playlist_title}</span>
                      )}
                      <p className="text-muted-foreground/70 text-[10px]">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes radiantPulseCard {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.01); }
        }
      `}</style>
    </div>
  );
}
