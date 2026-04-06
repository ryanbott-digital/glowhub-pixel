import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Send, Trash2, Copy, ChevronDown, Clock, Calendar, History, HardDrive, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { WeeklyScheduleGrid } from "@/components/screens/WeeklyScheduleGrid";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";

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
  };
  playlists: Playlist[];
  onPublish: (screenId: string, playlistId: string) => void;
  onDelete: (id: string) => void;
  onCopyUrl: (id: string) => void;
  groups?: ScreenGroup[];
  onMoveToGroup?: (screenId: string, groupId: string | null) => void;
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

/** Sync status indicator — shows playlist item count vs screen ping freshness as a proxy. */
function SyncStatusIndicator({ screenId, playlistId }: { screenId: string; playlistId: string }) {
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

export function ScreenStatusCard({ screen, playlists, onPublish, onDelete, onCopyUrl, groups, onMoveToGroup }: ScreenStatusCardProps) {
  const [media, setMedia] = useState<CurrentMedia | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

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

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg">
      {/* Clickable top area — monitor + name */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
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
              background: `
                radial-gradient(ellipse at 20% 50%, hsla(330, 80%, 60%, 0.5) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 50%, hsla(180, 100%, 45%, 0.5) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 80%, hsla(120, 60%, 50%, 0.3) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 20%, hsla(24, 95%, 53%, 0.4) 0%, transparent 50%)
              `,
              animation: "radiantPulseCard 4s ease-in-out infinite",
            }}
          />

          <div
            className="relative w-full aspect-video rounded-lg overflow-hidden border border-secondary/60 bg-secondary"
            style={{
              boxShadow: `
                0 0 20px hsla(180, 100%, 45%, 0.1),
                0 0 40px hsla(330, 80%, 60%, 0.07),
                0 12px 24px -6px rgba(0, 0, 0, 0.3)
              `,
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
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-[hsl(215,55%,10%)]">
                  <div className="text-sm font-bold font-['Poppins']">
                    <span className="text-glow">Glow</span>
                    <span style={{ color: "hsl(210, 20%, 90%)" }}>Hub</span>
                  </div>
                  <p className="text-[8px] text-[hsl(210,20%,50%)]">No content assigned</p>
                </div>
              )}
            </div>

            {/* Pulse badge */}
            <div className="absolute top-1.5 right-1.5 z-10">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isAlive ? "bg-green-400" : "bg-red-400"}`} />
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 border border-black/30 ${isAlive ? "bg-green-500" : "bg-red-500"}`}
                  style={{ boxShadow: isAlive ? "0 0 6px hsla(120, 70%, 50%, 0.6)" : "0 0 6px hsla(0, 70%, 50%, 0.6)" }}
                />
              </span>
            </div>
          </div>
        </div>

        {/* Name + status row */}
        <div className="px-4 pt-2 pb-3 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground truncate">{screen.name}</h3>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
              isAlive
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}>
              {isAlive ? "Online" : "Offline"}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </div>
        </div>
      </button>

      {/* Expandable detail section */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: expanded ? "800px" : "0", opacity: expanded ? 1 : 0 }}
      >
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
          {/* Quick info */}
          {screen.last_ping && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last seen {formatDistanceToNow(new Date(screen.last_ping), { addSuffix: true })}
            </div>
          )}

          {screen.pairing_code && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Code:</span>
              <span className="font-mono text-sm tracking-widest text-foreground">{screen.pairing_code}</span>
            </div>
          )}

          {/* Playlist selector */}
          <div className="flex items-center gap-1.5">
            <Select
              value={screen.current_playlist_id || ""}
              onValueChange={(val) => onPublish(screen.id, val)}
            >
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue placeholder="Select playlist" />
              </SelectTrigger>
              <SelectContent>
                {playlists.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon" variant="outline" className="h-8 w-8"
              onClick={() => screen.current_playlist_id && onPublish(screen.id, screen.current_playlist_id)}
              title="Publish"
            >
              <Send className="h-3 w-3" />
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

          {/* Actions row */}
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="text-xs h-7 flex-1" onClick={() => onCopyUrl(screen.id)}>
              <Copy className="h-3 w-3 mr-1" /> Copy URL
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onDelete(screen.id)}>
              <Trash2 className="h-3 w-3 text-destructive" />
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
            <WeeklyScheduleGrid screenId={screen.id} playlists={playlists} />
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
