

## Plan: Add "Dismiss All Broadcasts" Button for Admins

### What it does
Adds a button in the Admin broadcast section that deletes all `screen_broadcasts` records for the selected user and sends a Realtime signal to immediately clear any active broadcast overlay on their screens.

### Changes

**1. `src/pages/Admin.tsx`**
- Add a `handleDismissAllBroadcasts` function that:
  - Deletes all rows from `screen_broadcasts` where `target_user_id = selectedUser.id`
  - Sends a Realtime broadcast on `user-broadcast-{userId}` with event `screen-message` and payload `{ dismiss: true }`
- Add a "Dismiss All" button (destructive variant, small) next to the "Send" button in the broadcast composer section, with a confirmation dialog

**2. `src/pages/Player.tsx`**
- Update the Realtime listener to handle `{ dismiss: true }` payloads by immediately clearing the broadcast overlay

No database or migration changes needed — admins already have DELETE policy on `screen_broadcasts`.

