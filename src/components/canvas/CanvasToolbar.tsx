import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ZoomIn, ZoomOut, Maximize, Rocket, ListMusic } from "lucide-react";

interface SyncGroup {
  id: string;
  name: string;
  playlist_id: string | null;
  screens: { id: string; screen_id: string; position: number }[];
}

interface Playlist {
  id: string;
  title: string;
}

interface CanvasToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  syncGroups: SyncGroup[];
  playlists: Playlist[];
  onDeploy: (groupId: string) => void;
  onAssignPlaylist: (groupId: string, playlistId: string | null) => void;
  selectedGroup: string | null;
  onSelectGroup: (id: string | null) => void;
}

export function CanvasToolbar({
  zoom, onZoomIn, onZoomOut, onReset,
  syncGroups, playlists, onDeploy, onAssignPlaylist,
  selectedGroup, onSelectGroup,
}: CanvasToolbarProps) {
  const group = syncGroups.find(g => g.id === selectedGroup);

  return (
    <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between gap-3 pointer-events-none">
      {/* Left: zoom controls */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="glass rounded-xl px-3 py-2 flex items-center gap-2 backdrop-blur-xl border border-border/30">
          <Button variant="ghost" size="sm" onClick={onZoomOut} className="h-7 w-7 p-0">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs font-mono text-muted-foreground min-w-[3ch] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="sm" onClick={onZoomIn} className="h-7 w-7 p-0">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-4 bg-border/50" />
          <Button variant="ghost" size="sm" onClick={onReset} className="h-7 w-7 p-0">
            <Maximize className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Right: group select + playlist + deploy */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {syncGroups.length > 0 && (
          <div className="glass rounded-xl px-3 py-2 flex items-center gap-2 backdrop-blur-xl border border-border/30">
            <Select value={selectedGroup || "none"} onValueChange={v => onSelectGroup(v === "none" ? null : v)}>
              <SelectTrigger className="h-7 text-xs border-0 bg-transparent min-w-[120px]">
                <SelectValue placeholder="Select group…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">All Groups</SelectItem>
                {syncGroups.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name} ({g.screens.length})</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {group && (
              <>
                <div className="w-px h-4 bg-border/50" />
                <ListMusic className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Select
                  value={group.playlist_id || "none"}
                  onValueChange={v => onAssignPlaylist(group.id, v === "none" ? null : v)}
                >
                  <SelectTrigger className="h-7 text-xs border-0 bg-transparent min-w-[100px]">
                    <SelectValue placeholder="Playlist…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No playlist</SelectItem>
                    {playlists.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="w-px h-4 bg-border/50" />
                <Button
                  size="sm"
                  onClick={() => onDeploy(group.id)}
                  disabled={!group.playlist_id || group.screens.length === 0}
                  className="h-7 text-xs gap-1.5 bg-gradient-to-r from-primary to-glow-blue text-primary-foreground font-semibold tracking-wider rounded-lg"
                >
                  <Rocket className="h-3.5 w-3.5" />
                  Deploy
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
