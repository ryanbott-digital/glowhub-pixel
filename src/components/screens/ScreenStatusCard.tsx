import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Send, Trash2, Copy, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { WeeklyScheduleGrid } from "@/components/screens/WeeklyScheduleGrid";

interface Playlist {
  id: string;
  title: string;
}

interface ScreenStatusCardProps {
  screen: {
    id: string;
    name: string;
    pairing_code: string | null;
    status: string;
    current_playlist_id: string | null;
    last_ping: string | null;
  };
  playlists: Playlist[];
  onPublish: (screenId: string, playlistId: string) => void;
  onDelete: (id: string) => void;
  onCopyUrl: (id: string) => void;
}

interface CurrentMedia {
  name: string;
  storage_path: string;
  type: string;
}

export function ScreenStatusCard({ screen, playlists, onPublish, onDelete, onCopyUrl }: ScreenStatusCardProps) {
  const [media, setMedia] = useState<CurrentMedia | null>(null);

  // Determine if screen is alive based on last_ping (within 2 minutes)
  const isAlive = (() => {
    if (!screen.last_ping) return false;
    const diff = Date.now() - new Date(screen.last_ping).getTime();
    return diff < 2 * 60 * 1000;
  })();

  // Fetch the first media item from the current playlist for the thumbnail
  const fetchThumbnail = useCallback(async () => {
    if (!screen.current_playlist_id) { setMedia(null); return; }
    const { data } = await supabase
      .from("playlist_items")
      .select("media:media_id(name, storage_path, type)")
      .eq("playlist_id", screen.current_playlist_id)
      .order("position")
      .limit(1);
    if (data && data.length > 0) {
      const m = (data[0] as any).media;
      setMedia(m);
    } else {
      setMedia(null);
    }
  }, [screen.current_playlist_id]);

  useEffect(() => { fetchThumbnail(); }, [fetchThumbnail]);

  const thumbnailUrl = media
    ? supabase.storage.from("signage-content").getPublicUrl(media.storage_path).data.publicUrl
    : null;

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-lg">
      {/* Mini-Monitor with Radiant Glow */}
      <div className="relative p-4 pb-2">
        {/* Radiant backlight glow (subtle, behind the monitor) */}
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

        {/* 16:9 monitor frame */}
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
          {/* Inner bezel */}
          <div className="absolute inset-[3px] rounded-md bg-black overflow-hidden">
            {thumbnailUrl ? (
              <>
                {media?.type === "video" ? (
                  <video
                    src={thumbnailUrl}
                    muted
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={thumbnailUrl}
                    alt={media?.name || ""}
                    className="w-full h-full object-cover"
                  />
                )}
                {/* HUD overlay */}
                <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
                  <span className="text-[8px] text-white/60 font-medium truncate max-w-[70%]">
                    {media?.name}
                  </span>
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

          {/* Pulse badge — top right */}
          <div className="absolute top-1.5 right-1.5 z-10">
            <span className="relative flex h-3 w-3">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isAlive ? "bg-green-400" : "bg-red-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 border border-black/30 ${
                  isAlive ? "bg-green-500" : "bg-red-500"
                }`}
                style={{
                  boxShadow: isAlive
                    ? "0 0 6px hsla(120, 70%, 50%, 0.6)"
                    : "0 0 6px hsla(0, 70%, 50%, 0.6)",
                }}
              />
            </span>
          </div>
        </div>
      </div>

      {/* Card info */}
      <div className="px-4 pt-2 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground truncate">{screen.name}</h3>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
            isAlive
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-red-500/10 text-red-600 dark:text-red-400"
          }`}>
            {isAlive ? "Online" : "Offline"}
          </span>
        </div>

        {screen.pairing_code && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Code:</span>
            <span className="font-mono text-sm tracking-widest text-foreground">{screen.pairing_code}</span>
          </div>
        )}

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
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => screen.current_playlist_id && onPublish(screen.id, screen.current_playlist_id)}
            title="Publish"
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" className="text-xs h-7 flex-1" onClick={() => onCopyUrl(screen.id)}>
            <Copy className="h-3 w-3 mr-1" /> Copy URL
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onDelete(screen.id)}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>

        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground text-xs h-7">
              Weekly Schedule
              <ChevronDown className="h-3 w-3" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <WeeklyScheduleGrid screenId={screen.id} playlists={playlists} />
          </CollapsibleContent>
        </Collapsible>
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
