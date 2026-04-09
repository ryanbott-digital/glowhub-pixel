
-- 1. Pairings: tighten SELECT
DROP POLICY "Anyone can read pairings" ON pairings;
CREATE POLICY "Public can read unexpired pairings" ON pairings
  FOR SELECT TO public
  USING (expires_at > now());

-- 1b. Pairings: tighten UPDATE
DROP POLICY "Auth users can update pairings" ON pairings;
CREATE POLICY "Auth users can claim unclaimed pairings" ON pairings
  FOR UPDATE TO authenticated
  USING (screen_id IS NULL AND expires_at > now())
  WITH CHECK (screen_id IS NOT NULL);

-- 2. Playback logs: require paired screen
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

-- 3. Contact submissions: basic validation
DROP POLICY "Anyone can insert contact submissions" ON contact_submissions;
CREATE POLICY "Anyone can insert valid contact submissions" ON contact_submissions
  FOR INSERT TO public
  WITH CHECK (
    length(trim(name)) > 0
    AND length(trim(email)) > 2
    AND length(trim(message)) > 0
  );

-- 4. Leads: validate email
DROP POLICY "Anyone can insert leads" ON leads;
CREATE POLICY "Anyone can insert valid leads" ON leads
  FOR INSERT TO public
  WITH CHECK (
    length(trim(email)) > 2
    AND position('@' IN email) > 1
  );
