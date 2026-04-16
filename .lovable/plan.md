

## Add Drag Handles to Studio Sidebar Drawers (Tablet)

### Problem
On tablet, the left (Assets) and right (Properties) sidebar drawers open as fixed overlays but lack a visible drag handle, making them harder to dismiss via touch.

### Changes

**File: `src/pages/Studio.tsx`**

1. **Left Sidebar (Assets) -- line ~994**: After the inner `<div className="relative z-40 ...">` opens, insert a drag handle bar at the top (only on tablet):
   ```tsx
   {isTablet && (
     <div className="flex justify-center py-2 cursor-grab" onClick={() => setLeftPanelOpen(false)}>
       <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
     </div>
   )}
   ```

2. **Right Sidebar (Properties) -- line ~1340**: Same treatment after the inner wrapper div opens:
   ```tsx
   {isTablet && (
     <div className="flex justify-center py-2 cursor-grab" onClick={() => setRightPanelOpen(false)}>
       <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
     </div>
   )}
   ```

Both handles are styled as a small rounded pill (matching the Drawer component pattern), centered at the top of each panel. Tapping dismisses the panel. Desktop is unaffected since these only render when `is