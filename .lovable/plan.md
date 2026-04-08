

## Finalize Glow Studio — Layer Stack, Shortcuts, Zoom, Properties & Save Flow

### Overview
Major upgrade to the Studio workspace: a Layers panel with z-index drag reordering, keyboard shortcuts, multi-select, zoom controls, enhanced widget properties (glow/flicker/blur sliders), and a polished save/preview flow.

### Changes

**1. Extend `CanvasElement` type with `visible` and `locked` fields**
- Add `visible: boolean` (default `true`) and `locked: boolean` (default `false`) to the interface
- Ensure `addElement` sets these defaults

**2. Layer Stack Panel (Right Sidebar — new tab/mode)**
- Add a `sidebarMode` state: `"properties"` | `"layers"`
- Two small tab buttons at the top of the right sidebar to switch between "Properties" and "Layers"
- **Layers view**: lists all elements in reverse order (top = front). Each row shows:
  - Widget-type icon thumbnail (reuse icons from WIDGET_LIBRARY)
  - Truncated label (type name or text content)
  - Eye icon toggle → sets `visible` on the element
  - Lock icon toggle → sets `locked` on the element (prevents drag/resize)
  - Entire list is reorderable via drag-and-drop (use native HTML5 drag or a simple swap-on-drop approach) — reordering changes array position which controls z-index
- Clicking a layer row selects that element on canvas
- Selected layer gets a `ring-1 ring-primary` highlight

**3. Canvas respects `visible` and `locked`**
- Hidden elements (`visible === false`): render with `opacity-0 pointer-events-none` in edit mode (or skip rendering)
- Locked elements: ignore `handleCanvasMouseDown` drag initiation, show a small lock badge overlay

**4. Keyboard Shortcuts**
- Add a `useEffect` with global `keydown` listener:
  - `Ctrl/Cmd + Z`: Undo (implement a simple history stack — push to `history` array on every `setElements` change, pop on undo)
  - `Ctrl/Cmd + S`: Save (call `handleSave`, `preventDefault`)
  - `Delete` / `Backspace`: Delete selected element(s)
- Display a small "Shortcuts" hint in the toolbar or as a tooltip

**5. Multi-Select**
- Add `selectedIds: Set<string>` state alongside existing `selectedId`
- Shift+click on canvas elements adds to selection set
- Regular click replaces selection
- When multiple selected: drag moves all selected elements together
- Delete removes all selected
- Properties panel shows "N elements selected" when multi-select active

**6. Zoom Controls**
- Add `zoom` state: `0.5 | 0.75 | 1` (default `1`)
- Place zoom buttons (50%, 75%, 100%) in the canvas toolbar area or bottom-right corner
- Apply `transform: scale(zoom)` + `transform-origin: center` to the canvas container
- Element coordinates remain in the 960x540 space — zoom only affects visual scaling

**7. Enhanced Widget Properties**
- **Text widgets**: Add "Glow Intensity" slider (0-100, maps to `textShadow` blur radius) and "Flicker Speed" slider (0-10, maps to animation-duration of neon-flicker)
- **Image widgets**: Add "Glass Blur" slider (0-20, applies `backdrop-filter: blur(Xpx)` + semi-transparent overlay)
- Store these as style properties on the element (`glowIntensity`, `flickerSpeed`, `glassBlur`)
- Apply in `renderElement`

**8. Save/Preview Flow Polish**
- **Save button**: On click, show a "Saving to Cloud..." overlay with a spinning neon ring animation (CSS `border-t` spinner with `border-color: hsl(var(--primary))` and `animate-spin`), dismiss after save completes
- **Live Preview button**: Already exists — opens `/studio/preview/:id` in new tab. Just ensure it's more prominent and only visible after first save

### Technical Details
- History stack for undo: store last 30 snapshots of `elements` array. Push on every meaningful change (add, delete, move-end, property edit). `Ctrl+Z` pops.
- Layer drag reorder: use `onDragStart`/`onDragOver`/`onDrop` on layer rows. Swap indices in the `elements` array — elements later in the array render on top (higher z-index).
- Zoom: wrap canvas in an extra div with `transform: scale(zoom)`. Adjust mouse coordinates in drag handlers by dividing by `zoom`.
- All new sliders use the existing `Slider` component from `src/components/ui/slider.tsx`.
- File changes: **only `src/pages/Studio.tsx`** — this is a single-file workspace. Approximately 200-300 lines of additions/modifications across the existing ~1300 lines.

### Scope Notes
- Redo (`Ctrl+Shift+Z`) is excluded for simplicity — can be added later.
- Multi-select visual: dashed bounding box around the group is optional polish.
- The saving overlay is a simple inline state, not a modal.

