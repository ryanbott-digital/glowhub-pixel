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

interface SyncGroupMember {
  id: string;
  screen_id: string;
  position: number;
  bezel_compensation?: number;
  resolution_w?: number;
  resolution_h?: number;
  grid_col?: number;
  grid_row?: number;
}

interface SyncGroup {
  id: string;
  name: string;
  orientation: "horizontal" | "vertical" | "grid";
  playlist_id: string | null;
  screens: SyncGroupMember[];
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
        if (group.orientation === "grid") {
          const col = member.grid_col ?? (idx % 2);
          const row = member.grid_row ?? Math.floor(idx / 2);
          positions[member.screen_id] = { x: baseX + col * (NODE_WIDTH + 4), y: baseY + row * (NODE_HEIGHT + 4) };
        } else if (group.orientation === "horizontal") {
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

          // Find if either screen is already in a sync group
          const existingGroup = syncGroups.find(g =>
            g.screens.some(s => s.screen_id === adjacentId || s.screen_id === draggingNode)
          );

          if (existingGroup) {
            const alreadyIn = existingGroup.screens.some(s => s.screen_id === draggingNode);
            if (!alreadyIn) {
              // Auto-detect grid_col/grid_row from canvas positions
              const gridPos = detectGridPosition(existingGroup, draggingNode, draggedPos);
              await supabase.from("sync_group_screens").insert({
                sync_group_id: existingGroup.id,
                screen_id: draggingNode,
                position: existingGroup.screens.length,
                grid_col: gridPos.col,
                grid_row: gridPos.row,
              });

              // If group has screens in multiple rows AND columns, auto-upgrade to grid orientation
              await maybeUpgradeToGrid(existingGroup, gridPos);
              toast.success("Screen snapped into sync group");
              onRefresh();
            }
          } else {
            const orientation = Math.abs(adjacentNode[1].y - draggedPos.y) < 10 ? "horizontal" : "vertical";
            const { data: newGroup } = await supabase.from("sync_groups").insert({
              user_id: userId,
              name: `Sync Group ${syncGroups.length + 1}`,
              orientation,
            }).select("id").single();

            if (newGroup) {
              const adjPos = adjacentNode[1];
              const adjCol = 0, adjRow = 0;
              let dragCol = 0, dragRow = 0;
              if (orientation === "horizontal") {
                dragCol = draggedPos.x > adjPos.x ? 1 : -1;
                if (dragCol < 0) { dragCol = 0; /* swap: adj becomes col 1 */ }
              } else {
                dragRow = draggedPos.y > adjPos.y ? 1 : -1;
                if (dragRow < 0) { dragRow = 0; }
              }
              // Normalize so min is 0
              const minCol = Math.min(adjCol, dragCol);
              const minRow = Math.min(adjRow, dragRow);
              await Promise.all([
                supabase.from("sync_group_screens").insert({ sync_group_id: newGroup.id, screen_id: adjacentId, position: 0, grid_col: adjCol - minCol, grid_row: adjRow - minRow }),
                supabase.from("sync_group_screens").insert({ sync_group_id: newGroup.id, screen_id: draggingNode, position: 1, grid_col: dragCol - minCol, grid_row: dragRow - minRow }),
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

  // ── OFFSET ENGINE: Compute bounding box & per-screen offsets ──
  const computeOffsets = (group: SyncGroup) => {
    const sorted = [...group.screens].sort((a, b) => a.position - b.position);
    const isHorizontal = group.orientation === "horizontal";

    // Per-screen resolution (defaults to 1920×1080)
    const getW = (m: SyncGroupMember) => m.resolution_w || 1920;
    const getH = (m: SyncGroupMember) => m.resolution_h || 1080;

    // Total bounding box with bezel compensation
    let totalW = 0;
    let totalH = 0;

    if (isHorizontal) {
      totalW = sorted.reduce((acc, m, idx) => {
        const bezel = idx > 0 ? (m.bezel_compensation || 0) : 0;
        return acc + getW(m) + bezel;
      }, 0);
      totalH = Math.max(...sorted.map(getH));
    } else {
      totalW = Math.max(...sorted.map(getW));
      totalH = sorted.reduce((acc, m, idx) => {
        const bezel = idx > 0 ? (m.bezel_compensation || 0) : 0;
        return acc + getH(m) + bezel;
      }, 0);
    }

    // Per-screen offset calculation:
    // Offset = cumulative screen sizes + cumulative bezels
    const layouts: { screenId: string; layout: object }[] = [];
    let cumulativeOffset = 0;

    sorted.forEach((member, idx) => {
      const bezel = idx > 0 ? (member.bezel_compensation || 0) : 0;
      if (idx > 0) cumulativeOffset += bezel;

      const offsetX = isHorizontal ? cumulativeOffset : 0;
      const offsetY = isHorizontal ? 0 : cumulativeOffset;

      layouts.push({
        screenId: member.screen_id,
        layout: {
          offset_x: offsetX,
          offset_y: offsetY,
          viewport_width: getW(member),
          viewport_height: getH(member),
          total_width: totalW,
          total_height: totalH,
          bezel_offset: bezel,
          position: idx,
          total_screens: sorted.length,
          orientation: group.orientation,
        },
      });

      cumulativeOffset += isHorizontal ? getW(member) : getH(member);
    });

    return layouts;
  };

  // Deploy handler — computes offsets and pushes to each screen
  const handleDeploy = async (groupId: string) => {
    const group = syncGroups.find(g => g.id === groupId);
    if (!group || !group.playlist_id || group.screens.length === 0) {
      toast.error("Assign a playlist and add screens first");
      return;
    }

    // Compute offset layout for each screen
    const layouts = computeOffsets(group);

    // Push sync_layout + playlist to each screen in parallel
    const updates = layouts.map(({ screenId, layout }) =>
      supabase.from("screens").update({
        current_playlist_id: group.playlist_id,
        sync_layout: layout,
      } as any).eq("id", screenId)
    );
    const results = await Promise.all(updates);
    const failed = results.filter(r => r.error);
    if (failed.length) { toast.error(failed[0].error!.message); return; }

    // Broadcast sync-start to all screens in the group
    await supabase.channel(`sync-deploy-${groupId}`).send({
      type: "broadcast",
      event: "sync-start",
      payload: { group_id: groupId, playlist_id: group.playlist_id, timestamp: Date.now() },
    });

    toast.success(`Deployed offset layout to ${layouts.length} screen${layouts.length !== 1 ? "s" : ""}`);
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

          {/* ── BOUNDING BOX PREVIEW per sync group ── */}
          {syncGroups.map(group => {
            if (group.screens.length === 0) return null;
            const positions = group.screens
              .map(s => ({ ...s, pos: nodePositions[s.screen_id] }))
              .filter(s => s.pos);
            if (positions.length === 0) return null;

            // Compute visual bounding box from node positions on canvas
            const minX = Math.min(...positions.map(s => s.pos!.x));
            const minY = Math.min(...positions.map(s => s.pos!.y));
            const maxX = Math.max(...positions.map(s => s.pos!.x + NODE_WIDTH));
            const maxY = Math.max(...positions.map(s => s.pos!.y + NODE_HEIGHT));
            const PAD = 16;

            // Compute real offsets from the offset engine
            const offsets = computeOffsets(group);
            const totalLayout = offsets[0]?.layout as any;
            const totalW = totalLayout?.total_width || 0;
            const totalH = totalLayout?.total_height || 0;

            return (
              <div key={`bbox-${group.id}`} className="absolute pointer-events-none z-[1]">
                {/* Outer bounding box */}
                <div
                  className="absolute rounded-2xl"
                  style={{
                    left: minX - PAD,
                    top: minY - PAD - 28,
                    width: maxX - minX + PAD * 2,
                    height: maxY - minY + PAD * 2 + 28,
                    border: "1px solid hsla(180, 100%, 32%, 0.2)",
                    background: "hsla(180, 100%, 32%, 0.03)",
                  }}
                >
                  {/* Group label with total resolution */}
                  <div
                    className="absolute flex items-center gap-2"
                    style={{ top: 6, left: 12 }}
                  >
                    <span className="text-[10px] font-bold tracking-widest uppercase text-primary/70">
                      {group.name}
                    </span>
                    <span className="text-[9px] font-mono tracking-wider text-primary/50 bg-primary/10 px-1.5 py-0.5 rounded">
                      {totalW}×{totalH}
                    </span>
                    <span className="text-[9px] text-muted-foreground tracking-wider">
                      {((totalW * totalH) / 1_000_000).toFixed(1)}MP
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {group.orientation === "horizontal" ? "→" : "↓"} {group.screens.length} screens
                    </span>
                  </div>
                </div>

                {/* Per-screen offset labels */}
                {offsets.map(({ screenId, layout }) => {
                  const pos = nodePositions[screenId];
                  if (!pos) return null;
                  const l = layout as any;
                  return (
                    <div
                      key={`offset-${screenId}`}
                      className="absolute"
                      style={{
                        left: pos.x,
                        top: pos.y + NODE_HEIGHT + 4,
                        width: NODE_WIDTH,
                      }}
                    >
                      <div className="flex items-center justify-center gap-1.5 py-1">
                        <span className="text-[9px] font-mono text-primary/60 bg-primary/5 border border-primary/15 rounded px-1.5 py-0.5">
                          offset: {l.offset_x},{l.offset_y}
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground/60 bg-muted/20 border border-border/20 rounded px-1.5 py-0.5">
                          {l.viewport_width}×{l.viewport_height}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
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

      {/* Calibration Suite Dialog */}
      {calibrateGroupId && (() => {
        const calibGroup = syncGroups.find(g => g.id === calibrateGroupId);
        if (!calibGroup) return null;
        return (
          <CalibrationSuite
            open={!!calibrateGroupId}
            onOpenChange={(open) => { if (!open) setCalibrateGroupId(null); }}
            group={calibGroup}
            screens={screens}
            onRefresh={onRefresh}
          />
        );
      })()}
    </div>
  );
}
