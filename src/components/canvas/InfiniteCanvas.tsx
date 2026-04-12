import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScreenNode, type ScreenNodeData } from "./ScreenNode";
import { CanvasToolbar } from "./CanvasToolbar";
import { SyncHealthPanel } from "./SyncHealthPanel";
import { CalibrationSuite } from "./CalibrationSuite";

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
  orientation: "horizontal" | "vertical";
  playlist_id: string | null;
  screens: { id: string; screen_id: string; position: number }[];
}

interface Playlist {
  id: string;
  title: string;
}

interface InfiniteCanvasProps {
  screens: Screen[];
  syncGroups: SyncGroup[];
  playlists: Playlist[];
  userId: string;
  onRefresh: () => void;
}

const GRID_SIZE = 60;
const SNAP_DISTANCE = 80;
const NODE_WIDTH = 320;
const NODE_HEIGHT = 200;

export function InfiniteCanvas({ screens, syncGroups, playlists, userId, onRefresh }: InfiniteCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [calibrateGroupId, setCalibrateGroupId] = useState<string | null>(null);

  // Build node positions from sync group data or free-floating
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [snapIndicator, setSnapIndicator] = useState<{ x: number; y: number; dir: "h" | "v" } | null>(null);

  // Initialize positions
  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const assignedIds = new Set(syncGroups.flatMap(g => g.screens.map(s => s.screen_id)));

    // Place grouped screens in their sync formation
    syncGroups.forEach((group, gi) => {
      group.screens.forEach((member, idx) => {
        const baseX = 200 + gi * 800;
        const baseY = 200;
        if (group.orientation === "horizontal") {
          positions[member.screen_id] = { x: baseX + idx * (NODE_WIDTH + 4), y: baseY };
        } else {
          positions[member.screen_id] = { x: baseX, y: baseY + idx * (NODE_HEIGHT + 4) };
        }
      });
    });

    // Place unassigned screens below
    let freeIdx = 0;
    screens.forEach(s => {
      if (!assignedIds.has(s.id) && !positions[s.id]) {
        positions[s.id] = { x: 200 + (freeIdx % 4) * (NODE_WIDTH + 40), y: 500 + Math.floor(freeIdx / 4) * (NODE_HEIGHT + 40) };
        freeIdx++;
      }
    });

    setNodePositions(prev => {
      const merged = { ...prev };
      // Only set positions for new nodes
      Object.entries(positions).forEach(([id, pos]) => {
        if (!merged[id]) merged[id] = pos;
      });
      return merged;
    });
  }, [screens, syncGroups]);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== canvasRef.current && !(e.target as HTMLElement).classList.contains("canvas-bg")) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: panStart.current.panX + (e.clientX - panStart.current.x),
        y: panStart.current.panY + (e.clientY - panStart.current.y),
      });
    }

    if (draggingNode) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const canvasX = (e.clientX - rect.left - pan.x) / zoom - dragOffset.current.x;
      const canvasY = (e.clientY - rect.top - pan.y) / zoom - dragOffset.current.y;

      // Check snapping
      let snapped = false;
      let snapX = canvasX;
      let snapY = canvasY;
      setSnapIndicator(null);

      Object.entries(nodePositions).forEach(([id, pos]) => {
        if (id === draggingNode) return;
        // Right edge snap (horizontal)
        if (Math.abs((pos.x + NODE_WIDTH + 4) - canvasX) < SNAP_DISTANCE && Math.abs(pos.y - canvasY) < SNAP_DISTANCE) {
          snapX = pos.x + NODE_WIDTH + 4;
          snapY = pos.y;
          setSnapIndicator({ x: snapX, y: snapY, dir: "h" });
          snapped = true;
        }
        // Left edge snap
        if (Math.abs((pos.x - NODE_WIDTH - 4) - canvasX) < SNAP_DISTANCE && Math.abs(pos.y - canvasY) < SNAP_DISTANCE) {
          snapX = pos.x - NODE_WIDTH - 4;
          snapY = pos.y;
          setSnapIndicator({ x: snapX, y: snapY, dir: "h" });
          snapped = true;
        }
        // Bottom edge snap (vertical)
        if (Math.abs((pos.y + NODE_HEIGHT + 4) - canvasY) < SNAP_DISTANCE && Math.abs(pos.x - canvasX) < SNAP_DISTANCE) {
          snapX = pos.x;
          snapY = pos.y + NODE_HEIGHT + 4;
          setSnapIndicator({ x: snapX, y: snapY, dir: "v" });
          snapped = true;
        }
        // Top edge snap
        if (Math.abs((pos.y - NODE_HEIGHT - 4) - canvasY) < SNAP_DISTANCE && Math.abs(pos.x - canvasX) < SNAP_DISTANCE) {
          snapX = pos.x;
          snapY = pos.y - NODE_HEIGHT - 4;
          setSnapIndicator({ x: snapX, y: snapY, dir: "v" });
          snapped = true;
        }
      });

      setNodePositions(prev => ({ ...prev, [draggingNode]: { x: snapped ? snapX : canvasX, y: snapped ? snapY : canvasY } }));
    }
  }, [isPanning, draggingNode, pan, zoom, nodePositions]);

  const handleMouseUp = useCallback(async () => {
    if (draggingNode && snapIndicator) {
      // Check if snapped to another node - auto-create/update sync group
      const draggedPos = nodePositions[draggingNode];
      if (draggedPos) {
        const adjacentNode = Object.entries(nodePositions).find(([id, pos]) => {
          if (id === draggingNode) return false;
          const isHSnap = Math.abs(pos.y - draggedPos.y) < 10 &&
            (Math.abs((pos.x + NODE_WIDTH + 4) - draggedPos.x) < 10 || Math.abs((pos.x - NODE_WIDTH - 4) - draggedPos.x) < 10);
          const isVSnap = Math.abs(pos.x - draggedPos.x) < 10 &&
            (Math.abs((pos.y + NODE_HEIGHT + 4) - draggedPos.y) < 10 || Math.abs((pos.y - NODE_HEIGHT - 4) - draggedPos.y) < 10);
          return isHSnap || isVSnap;
        });

        if (adjacentNode) {
          const [adjacentId] = adjacentNode;
          const orientation = Math.abs(adjacentNode[1].y - draggedPos.y) < 10 ? "horizontal" : "vertical";

          // Find if either screen is already in a sync group
          const existingGroup = syncGroups.find(g =>
            g.screens.some(s => s.screen_id === adjacentId || s.screen_id === draggingNode)
          );

          if (existingGroup) {
            const alreadyIn = existingGroup.screens.some(s => s.screen_id === draggingNode);
            if (!alreadyIn) {
              await supabase.from("sync_group_screens").insert({
                sync_group_id: existingGroup.id,
                screen_id: draggingNode,
                position: existingGroup.screens.length,
              });
              toast.success("Screen snapped into sync group");
              onRefresh();
            }
          } else {
            // Create new sync group
            const { data: newGroup } = await supabase.from("sync_groups").insert({
              user_id: userId,
              name: `Sync Group ${syncGroups.length + 1}`,
              orientation,
            }).select("id").single();

            if (newGroup) {
              await Promise.all([
                supabase.from("sync_group_screens").insert({ sync_group_id: newGroup.id, screen_id: adjacentId, position: 0 }),
                supabase.from("sync_group_screens").insert({ sync_group_id: newGroup.id, screen_id: draggingNode, position: 1 }),
              ]);
              toast.success("New sync group created by snapping screens together");
              onRefresh();
            }
          }
        }
      }
    }

    setIsPanning(false);
    setDraggingNode(null);
    setSnapIndicator(null);
  }, [draggingNode, snapIndicator, nodePositions, syncGroups, userId, onRefresh]);

  // Zoom with wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(Math.max(z * delta, 0.3), 3));
  }, []);

  const handleNodeDragStart = useCallback((screenId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const pos = nodePositions[screenId];
    if (!pos) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const canvasX = (e.clientX - rect.left - pan.x) / zoom;
    const canvasY = (e.clientY - rect.top - pan.y) / zoom;
    dragOffset.current = { x: canvasX - pos.x, y: canvasY - pos.y };
    setDraggingNode(screenId);
  }, [nodePositions, pan, zoom]);

  // Find which sync group a screen belongs to
  const getScreenGroup = (screenId: string) => syncGroups.find(g => g.screens.some(s => s.screen_id === screenId));

  // Deploy handler
  const handleDeploy = async (groupId: string) => {
    const group = syncGroups.find(g => g.id === groupId);
    if (!group || !group.playlist_id || group.screens.length === 0) {
      toast.error("Assign a playlist and add screens first");
      return;
    }
    const screenIds = group.screens.map(s => s.screen_id);
    const { error } = await supabase
      .from("screens")
      .update({ current_playlist_id: group.playlist_id })
      .in("id", screenIds);
    if (error) { toast.error(error.message); return; }

    // Broadcast sync-start to all screens in the group
    await supabase.channel(`sync-deploy-${groupId}`).send({
      type: "broadcast",
      event: "sync-start",
      payload: { group_id: groupId, playlist_id: group.playlist_id, timestamp: Date.now() },
    });

    toast.success(`Deployed to ${screenIds.length} screen${screenIds.length !== 1 ? "s" : ""} simultaneously`);
  };

  // Build node data
  const nodeData: ScreenNodeData[] = screens.map(s => {
    const group = getScreenGroup(s.id);
    const lastPing = s.last_ping ? new Date(s.last_ping).getTime() : 0;
    const now = Date.now();
    const msSinceLastPing = now - lastPing;
    let syncHealth: "synced" | "lagging" | "offline" = "offline";
    if (s.status === "online" && msSinceLastPing < 120_000) syncHealth = "synced";
    else if (s.status === "online" && msSinceLastPing < 300_000) syncHealth = "lagging";

    return {
      id: s.id,
      name: s.name,
      status: s.status,
      syncHealth,
      groupId: group?.id || null,
      groupName: group?.name || null,
      position: nodePositions[s.id] || { x: 0, y: 0 },
      lastPing: s.last_ping,
    };
  });

  return (
    <div className="relative w-full h-[calc(100vh-140px)] overflow-hidden rounded-2xl border border-border/30">
      {/* Toolbar */}
      <CanvasToolbar
        zoom={zoom}
        onZoomIn={() => setZoom(z => Math.min(z * 1.2, 3))}
        onZoomOut={() => setZoom(z => Math.max(z * 0.8, 0.3))}
        onReset={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
        syncGroups={syncGroups}
        playlists={playlists}
        onDeploy={handleDeploy}
        onAssignPlaylist={async (groupId, playlistId) => {
          await supabase.from("sync_groups").update({ playlist_id: playlistId } as any).eq("id", groupId);
          toast.success("Playlist assigned");
          onRefresh();
        }}
        onCalibrate={(groupId) => setCalibrateGroupId(groupId)}
        selectedGroup={selectedGroup}
        onSelectGroup={setSelectedGroup}
      />

      {/* Sync Health Panel */}
      <SyncHealthPanel nodes={nodeData} syncGroups={syncGroups} />

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing canvas-bg"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ background: "hsl(var(--background))" }}
      >
        {/* Neon grid */}
        <div
          className="absolute inset-0 pointer-events-none canvas-bg"
          style={{
            backgroundImage: `
              linear-gradient(hsla(180, 100%, 32%, 0.06) 1px, transparent 1px),
              linear-gradient(90deg, hsla(180, 100%, 32%, 0.06) 1px, transparent 1px),
              linear-gradient(hsla(180, 100%, 32%, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, hsla(180, 100%, 32%, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: `
              ${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px,
              ${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px,
              ${GRID_SIZE * zoom * 0.2}px ${GRID_SIZE * zoom * 0.2}px,
              ${GRID_SIZE * zoom * 0.2}px ${GRID_SIZE * zoom * 0.2}px
            `,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />

        {/* Radial glow center */}
        <div
          className="absolute pointer-events-none canvas-bg"
          style={{
            width: "800px",
            height: "800px",
            left: `calc(50% + ${pan.x}px)`,
            top: `calc(50% + ${pan.y}px)`,
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, hsla(180, 100%, 32%, 0.08) 0%, transparent 70%)",
          }}
        />

        {/* Transform layer */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Snap indicator */}
          {snapIndicator && (
            <div
              className="absolute pointer-events-none z-30"
              style={{
                left: snapIndicator.x - 2,
                top: snapIndicator.y - 2,
                width: NODE_WIDTH + 4,
                height: NODE_HEIGHT + 4,
                border: "2px dashed hsl(var(--primary))",
                borderRadius: "12px",
                boxShadow: "0 0 20px hsla(180, 100%, 32%, 0.4), 0 0 40px hsla(180, 100%, 32%, 0.2)",
                animation: "snapPulse 0.5s ease-in-out infinite alternate",
              }}
            />
          )}

          {/* Sync group connection lines */}
          {syncGroups.map(group => {
            const groupScreenPositions = group.screens
              .map(s => ({ ...s, pos: nodePositions[s.screen_id] }))
              .filter(s => s.pos);

            return groupScreenPositions.map((s, idx) => {
              if (idx === 0) return null;
              const prev = groupScreenPositions[idx - 1];
              if (!prev.pos || !s.pos) return null;
              const x1 = prev.pos.x + NODE_WIDTH / 2;
              const y1 = prev.pos.y + NODE_HEIGHT / 2;
              const x2 = s.pos.x + NODE_WIDTH / 2;
              const y2 = s.pos.y + NODE_HEIGHT / 2;
              return (
                <svg
                  key={`${group.id}-${idx}`}
                  className="absolute pointer-events-none z-0"
                  style={{ left: 0, top: 0, width: "100%", height: "100%", overflow: "visible" }}
                >
                  <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="hsla(180, 100%, 32%, 0.3)"
                    strokeWidth="2"
                    strokeDasharray="8 4"
                  />
                  {/* Heartbeat pulse on the line */}
                  <circle r="4" fill="hsl(var(--primary))" opacity="0.8">
                    <animateMotion dur="2s" repeatCount="indefinite">
                      <mpath xlinkHref={`#path-${group.id}-${idx}`} />
                    </animateMotion>
                  </circle>
                  <path id={`path-${group.id}-${idx}`} d={`M${x1},${y1} L${x2},${y2}`} fill="none" />
                </svg>
              );
            });
          })}

          {/* Screen Nodes */}
          {nodeData.map(node => (
            <ScreenNode
              key={node.id}
              data={node}
              isDragging={draggingNode === node.id}
              isSelected={selectedGroup === node.groupId}
              onDragStart={(e) => handleNodeDragStart(node.id, e)}
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes snapPulse {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
