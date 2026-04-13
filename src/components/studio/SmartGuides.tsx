import React from "react";
import type { CanvasElement } from "./types";

const SNAP_THRESHOLD = 5;
const CANVAS_W = 960;
const CANVAS_H = 540;

export interface GuideLine {
  orientation: "h" | "v";
  position: number;
}

/**
 * Compute snap guides + adjusted position for a dragged element.
 */
export function computeSnapGuides(
  dragged: { id: string; x: number; y: number; width: number; height: number },
  others: CanvasElement[],
): { guides: GuideLine[]; snapX: number | null; snapY: number | null } {
  const guides: GuideLine[] = [];
  let snapX: number | null = null;
  let snapY: number | null = null;

  const dCx = dragged.x + dragged.width / 2;
  const dCy = dragged.y + dragged.height / 2;
  const dRight = dragged.x + dragged.width;
  const dBottom = dragged.y + dragged.height;

  // Canvas center guides
  const canvasCx = CANVAS_W / 2;
  const canvasCy = CANVAS_H / 2;

  // vertical center
  if (Math.abs(dCx - canvasCx) < SNAP_THRESHOLD) {
    guides.push({ orientation: "v", position: canvasCx });
    snapX = canvasCx - dragged.width / 2;
  }
  // horizontal center
  if (Math.abs(dCy - canvasCy) < SNAP_THRESHOLD) {
    guides.push({ orientation: "h", position: canvasCy });
    snapY = canvasCy - dragged.height / 2;
  }

  // Canvas edges
  if (Math.abs(dragged.x) < SNAP_THRESHOLD) {
    guides.push({ orientation: "v", position: 0 });
    snapX = 0;
  }
  if (Math.abs(dRight - CANVAS_W) < SNAP_THRESHOLD) {
    guides.push({ orientation: "v", position: CANVAS_W });
    snapX = CANVAS_W - dragged.width;
  }
  if (Math.abs(dragged.y) < SNAP_THRESHOLD) {
    guides.push({ orientation: "h", position: 0 });
    snapY = 0;
  }
  if (Math.abs(dBottom - CANVAS_H) < SNAP_THRESHOLD) {
    guides.push({ orientation: "h", position: CANVAS_H });
    snapY = CANVAS_H - dragged.height;
  }

  // Element-to-element guides
  for (const el of others) {
    if (el.id === dragged.id || !el.visible) continue;
    const eCx = el.x + el.width / 2;
    const eCy = el.y + el.height / 2;
    const eRight = el.x + el.width;
    const eBottom = el.y + el.height;

    // Vertical: left-left, right-right, center-center, left-right, right-left
    const vChecks = [
      { dragVal: dragged.x, elVal: el.x, adjust: 0 },
      { dragVal: dRight, elVal: eRight, adjust: eRight - dragged.width },
      { dragVal: dCx, elVal: eCx, adjust: eCx - dragged.width / 2 },
      { dragVal: dragged.x, elVal: eRight, adjust: eRight },
      { dragVal: dRight, elVal: el.x, adjust: el.x - dragged.width },
    ];
    for (const vc of vChecks) {
      if (snapX === null && Math.abs(vc.dragVal - vc.elVal) < SNAP_THRESHOLD) {
        guides.push({ orientation: "v", position: vc.elVal });
        snapX = vc.adjust;
        break;
      }
    }

    // Horizontal: top-top, bottom-bottom, center-center, top-bottom, bottom-top
    const hChecks = [
      { dragVal: dragged.y, elVal: el.y, adjust: 0 },
      { dragVal: dBottom, elVal: eBottom, adjust: eBottom - dragged.height },
      { dragVal: dCy, elVal: eCy, adjust: eCy - dragged.height / 2 },
      { dragVal: dragged.y, elVal: eBottom, adjust: eBottom },
      { dragVal: dBottom, elVal: el.y, adjust: el.y - dragged.height },
    ];
    for (const hc of hChecks) {
      if (snapY === null && Math.abs(hc.dragVal - hc.elVal) < SNAP_THRESHOLD) {
        guides.push({ orientation: "h", position: hc.elVal });
        snapY = hc.adjust;
        break;
      }
    }
  }

  return { guides, snapX, snapY };
}

/**
 * Renders magenta guide lines on the canvas.
 */
export function SmartGuides({ guides }: { guides: GuideLine[] }) {
  if (guides.length === 0) return null;
  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      <style>{`
        @keyframes snapPulse {
          0% { opacity: 1; box-shadow: 0 0 4px #ff00ff, 0 0 8px #ff00ff80; }
          40% { opacity: 1; box-shadow: 0 0 12px #ff00ff, 0 0 24px #ff00ffaa, 0 0 40px #ff00ff44; }
          100% { opacity: 1; box-shadow: 0 0 4px #ff00ff, 0 0 8px #ff00ff80; }
        }
      `}</style>
      {guides.map((g, i) =>
        g.orientation === "v" ? (
          <div
            key={`v-${i}`}
            className="absolute top-0 h-full"
            style={{
              left: g.position,
              width: 1,
              background: "#ff00ff",
              boxShadow: "0 0 4px #ff00ff, 0 0 8px #ff00ff80",
              animation: "snapPulse 0.4s ease-out",
            }}
          />
        ) : (
          <div
            key={`h-${i}`}
            className="absolute left-0 w-full"
            style={{
              top: g.position,
              height: 1,
              background: "#ff00ff",
              boxShadow: "0 0 4px #ff00ff, 0 0 8px #ff00ff80",
              animation: "snapPulse 0.4s ease-out",
            }}
          />
        )
      )}
    </div>
  );
}
