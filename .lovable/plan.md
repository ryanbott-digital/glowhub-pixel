

## Plan: Time label tooltip during touch drag on Schedule

### What it does
When dragging a media item or playlist onto the schedule grid via touch, a small time label (e.g. "09:15") appears near the drag ghost, showing the exact snapped start time the block would land on. It disappears when the finger leaves the grid area.

### Implementation

**`src/pages/Schedule.tsx`** — one file, two changes:

1. **Compute the time label from existing state**: `touchDropHighlight` already has `hour` and `offsetY`. Derive minutes as `hour * 60 + (offsetY / HOUR_HEIGHT) * 60`, then format as `HH:MM`. This is a simple inline computation in the render — no new state needed.

2. **Render a time pill below the drag ghost** (~line 1271): Inside the existing touch drag ghost block, add a secondary element that shows the formatted time when `touchDropHighlight` is non-null. Positioned as a small pill below the ghost, offset ~40px down from the drag position. Styled with a dark background, primary-colored text, and mono font for readability.

### Visual result
```text
  ┌──────────────┐
  │ 🎬  video.mp4 │  ← existing drag ghost
  └──────────────┘
      ┌───────┐
      │ 09:15 │  ← new time tooltip
      └───────┘
```

No new dependencies, no new state — just a computed label rendered conditionally.

