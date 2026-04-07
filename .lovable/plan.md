

## Broadcast Success Modal

### What This Does
Creates a new `BroadcastSuccessModal` component that triggers when a user publishes a playlist to a screen for the first time. It features a spiraling particle burst, glassmorphism card with rotating conic gradient border, 3D checkmark bloom, countdown, shimmer effects, and haptic feedback. The dashboard also gets a live "LIVE" badge on screen cards after the first broadcast.

### Trigger Logic
- The modal fires from the `publishPlaylist` function in `src/pages/Screens.tsx` (and bulk publish) -- only on the **first time** a playlist is assigned to any screen (check if user has ever had a `current_playlist_id` set before).
- Store a `glowhub_first_broadcast_done` flag in `localStorage` to ensure it only shows once per account.

### Files to Create

**`src/components/BroadcastSuccessModal.tsx`**
- Spiraling particle burst in neon teal (#00A3A3) and electric blue, particles move outward in a spiral pattern
- Glassmorphism card with `backdrop-filter: blur(40px)`, rotating conic gradient border (teal/blue/pink) using `@property --conic-angle`
- Large geometric 3D checkmark with green heartbeat glow animation
- Header: "BROADCAST IS ACTIVE" in uppercase, geometric sans-serif
- Subtext with countdown: "Your screen is now Glowing. Managing the playlist in 3... 2... 1..."
- "View My Live Screen" button with breathe animation and rocket icon
- CSS shimmer effect on the logo area and CTA button
- Haptic vibration pattern on open
- "I'll do this later" dismiss link
- Auto-navigates to `/screens` after countdown

### Files to Modify

**`src/pages/Screens.tsx`**
- Import and render `BroadcastSuccessModal`
- Add state for modal open/close and the screen name
- In `publishPlaylist`: check `localStorage` for `glowhub_first_broadcast_done`; if not set, show modal and set the flag
- Same check in `handleBulkPublish`

**`src/pages/Dashboard.tsx`**
- Add a "LIVE" pulsing red badge on the screen count stat card when `onlineCount > 0` and screens have an assigned playlist
- When `onlineFlash` triggers, animate the screen count from 0 to the new value with a neon green flash

### Technical Details
- Reuse animation patterns from `PairSuccessModal` (conic border, particle burst, breathe button)
- Spiral particles: offset angle by golden ratio increments for spiral distribution
- Shimmer: CSS `@keyframes shimmer` moving a diagonal gradient highlight across elements
- Green heartbeat: `box-shadow` pulse between `hsla(150, 100%, 45%, 0.3)` and `hsla(150, 100%, 45%, 0.6)` on a 1.5s loop
- All animations use CSS keyframes (no framer-motion dependency needed) for performance on Fire TV

