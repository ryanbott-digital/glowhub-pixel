

# Studio Tablet UI Overhaul

## Problem
The Studio page currently treats tablet as a shrunken desktop. Sidebars appear as overlays but remain desktop-sized, touch targets are too small (7-8px controls), the toolbar is cramped, and there's no touch-optimized workflow for designing on iPad/tablet.

## Key Changes

### 1. Touch-Friendly Toolbar Redesign
- Reorganize the top toolbar into two rows on tablet: top row for layout name + save, bottom row for tools (zoom, grid, undo, preview)
- Increase all button touch targets to minimum 44x44px on tablet
- Replace tiny zoom percentage buttons with a proper zoom slider
- Add prominent floating action buttons for the two sidebar toggles (Assets / Properties)

### 2. Bottom Action Bar for Tablet
- Add a fixed bottom bar (above the timeline) with the most-used actions: Add Element, Layers, Properties, Undo, Preview
- This replaces the need to reach the top toolbar while designing
- Icons-only with labels, 48px tap targets, glassmorphism styling

### 3. Improved Sidebar Drawers
- Increase drawer width from `w-72` to `w-80` for more breathing room
- Add a visible drag handle / close button at the top of each drawer
- Increase all widget card tap targets in the Asset Tray (from `aspect-square` tiny cards to larger grid with `min-h-[72px]`)
- Increase layer row height from `h-9` to `h-12` with larger visibility/lock toggle buttons
- Make media library thumbnails larger (grid-cols-2 instead of grid-cols-3)

### 4. Canvas Interaction Improvements
- Increase the Rnd resize handles hit area on tablet (larger corner/edge handles)
- Add a visible selection toolbar floating above the selected element with quick actions (delete, lock, duplicate)
- Show a "tap canvas to deselect" hint when an element is selected

### 5. Timeline Touch Optimization
- Increase timeline row height from `h-9` to `h-12` on tablet
- Make the timing control sliders larger with bigger thumb targets
- Collapse timeline by default on tablet to maximize canvas space

### 6. Properties Panel Touch Sizing
- Increase all input heights from `h-7`/`h-8` to `h-10` on tablet
- Increase slider thumb sizes for easier touch dragging
- Add more padding between property groups
- Make color picker inputs larger

## Files Modified
- `src/pages/Studio.tsx` -- Main layout restructuring, bottom action bar, responsive classes
- `src/components/studio/StudioTimeline.tsx` -- Larger rows and controls for tablet
- `src/hooks/use-mobile.tsx` -- Already has `useIsTablet` (no changes needed)

## Technical Approach
- Use the existing `isTablet` boolean to conditionally apply tablet-specific classes
- No new dependencies -- all changes are Tailwind responsive classes and conditional rendering
- Maintain full desktop experience unchanged

