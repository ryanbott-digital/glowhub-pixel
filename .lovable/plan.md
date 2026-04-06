

# New `/player` Entry Point for Android TV App

## Problem
The current Player lives at `/player/:pairingCode`, requiring the code in the URL. The wrapped Android app needs a standalone `/player` route that self-manages pairing — generating its own code, persisting `screen_id` in localStorage, and auto-transitioning to playback.

## Plan

### 1. Create `/player` route (no params)
Create a new page component `src/pages/PlayerEntry.tsx` that consolidates the full player experience:

**Pairing flow:**
- On mount, check `localStorage.getItem("glowhub_screen_id")`
- If **no screen_id**: generate a random 6-digit code, insert a new row into `screens` table with `pairing_code`, `status: 'pending'`, and a placeholder `user_id` (the anon session). Subscribe to Realtime on that screen row. When `user_id` changes (admin claims it), store the `screen.id` in localStorage and transition to playback.
- If **screen_id exists**: fetch the screen's `current_playlist_id` and begin playback immediately.

**Player logic:**
- Reuse the entire double-buffer system, HLS.js, crossfade, service worker caching, heartbeat pings, screenshot capture, error logging, Wake Lock, Power Settings panel, offline overlay — all from the existing `Player.tsx`.

**Remote management:**
- Realtime listener for `remote-refresh` broadcast to force-reload.
- Realtime listener for playlist changes on the screen row.

### 2. Add route to App.tsx
Add: `<Route path="/player" element={<PlayerEntry />} />`
This is a public route (no `ProtectedRoute` wrapper) since TV devices won't be authenticated.

### 3. RLS consideration
The existing screens table allows public SELECT and has an "Anyone can insert" policy pattern. However, the current INSERT policy requires `auth.uid() = user_id`. Since the TV player won't be authenticated, we need a new RLS policy:
- **Add migration**: `CREATE POLICY "Anon can insert pending screens" ON screens FOR INSERT TO anon WITH CHECK (status = 'pending' AND pairing_code IS NOT NULL);`
- Also need anon UPDATE for heartbeat pings: `CREATE POLICY "Anon can update own pending screens" ON screens FOR UPDATE TO anon USING (pairing_code IS NOT NULL OR id = id) WITH CHECK (true);`

Actually, the existing Player already does unauthenticated updates (heartbeat pings) via the `public` role policies. The current INSERT policy checks `auth.uid() = user_id` which won't work for anon. We'll need to handle this differently — the TV can create the screen row via an edge function or we set `user_id` to a sentinel value.

**Better approach**: Use an edge function `create-pending-screen` that uses the service role to insert the screen row, returning the screen_id and pairing_code. This avoids RLS issues entirely.

### 4. Edge function: `supabase/functions/create-pending-screen/index.ts`
- Generates a random 6-digit code
- Inserts into `screens` with `status: 'pending'`, `pairing_code`, and a placeholder `user_id` (will be overwritten when claimed)
- Returns `{ screen_id, pairing_code }`

### 5. Implementation approach
Rather than duplicating the 1200-line Player.tsx, **refactor** the existing `Player.tsx` to work both ways:
- Accept an optional `pairingCode` param OR read from localStorage
- If neither exists, call the edge function to generate one
- The rest of the logic stays identical

This means modifying `Player.tsx` to handle the no-param case and adding the `/player` route pointing to the same component.

## Technical Details

**Files to create:**
- `supabase/functions/create-pending-screen/index.ts` — edge function to insert pending screen

**Files to modify:**
- `src/pages/Player.tsx` — handle no-param entry: check localStorage, call edge function if needed
- `src/App.tsx` — add `/player` route (no param)

**Database migration:**
- None needed if using edge function with service role

**localStorage keys:**
- `glowhub_screen_id` — persisted screen UUID after pairing

