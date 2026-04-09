

# Tighten Overly Permissive RLS Policies

## Problem

Several tables have `true` conditions that are more open than necessary:

| Table | Issue |
|---|---|
| **pairings** | `Anyone can read` with `USING (true)` — exposes all pairings including expired ones. `Auth users can update` allows any authenticated user to update any pairing. |
| **playback_logs** | `Anyone can insert` with `WITH CHECK (true)` — allows inserting logs for screens that don't exist or aren't paired. |
| **contact_submissions** | `Anyone can insert` with `WITH CHECK (true)` — no validation on input. |
| **leads** | `Anyone can insert` with `WITH CHECK (true)` — no validation on input. |

## Plan

### 1. Tighten `pairings` policies

**SELECT** — restrict public reads to non-expired pairings only:
```sql
DROP POLICY "Anyone can read pairings" ON pairings;
CREATE POLICY "Public can read unexpired pairings" ON pairings
  FOR SELECT TO public
  USING (expires_at > now());
```

**UPDATE** — only allow updating pairings that don't yet have a screen_id (prevents hijacking already-claimed pairings):
```sql
DROP POLICY "Auth users can update pairings" ON pairings;
CREATE POLICY "Auth users can claim unclaimed pairings" ON pairings
  FOR UPDATE TO authenticated
  USING (screen_id IS NULL AND expires_at > now())
  WITH CHECK (screen_id IS NOT NULL);
```

### 2. Tighten `playback_logs` INSERT

Require the screen to actually exist and be paired (has a `pairing_code`):
```sql
DROP POLICY "Anyone can insert playback logs" ON playback_logs;
CREATE POLICY "Players can insert playback logs for paired screens" ON playback_logs
  FOR INSERT TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM screens
      WHERE screens.id = playback_logs.screen_id
        AND screens.pairing_code IS NOT NULL
    )
  );
```

### 3. Tighten `contact_submissions` INSERT

Add basic validation — require non-empty fields:
```sql
DROP POLICY "Anyone can insert contact submissions" ON contact_submissions;
CREATE POLICY "Anyone can insert valid contact submissions" ON contact_submissions
  FOR INSERT TO public
  WITH CHECK (
    length(trim(name)) > 0
    AND length(trim(email)) > 2
    AND length(trim(message)) > 0
  );
```

### 4. Tighten `leads` INSERT