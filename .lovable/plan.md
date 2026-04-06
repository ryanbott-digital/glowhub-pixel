

## Onboarding Checklist on Dashboard

### Overview
Add a collapsible onboarding checklist card between the stats grid and SystemHealth section. It auto-computes completion from existing data (no new tables needed) and can be permanently dismissed.

### Checklist Steps
1. **Pair a Screen** -- complete when `screens.length > 0`
2. **Upload Media** -- complete when `media` table has rows for this user
3. **Create a Playlist** -- complete when `playlists.length > 0`
4. **Assign to Screen** -- complete when any screen has `current_playlist_id` set

### Data Source
The Dashboard already fetches `screens` and `playlists`. Add one more query for `media` count (head-only, `select("*", { count: "exact", head: true })`). For step 4, check `screens.some(s => s.current_playlist_id)`.

### UI Design
- Glassmorphism card matching existing `glass rounded-2xl p-5` style
- Header: "Get Started" with a progress indicator (e.g., "2 of 4 complete") and a dismiss/close button
- Each step: checkbox icon (filled teal when complete, empty ring when not), label, and a CTA button that navigates to the relevant page (e.g., "Go to Media" links to `/media`)
- Completed steps get a subtle strikethrough or muted style
- A thin glowing progress bar at the top of the card
- When all 4 are done, show a "You're all set!" message with option to dismiss permanently

### Dismissal
- Store dismissal in `localStorage` (`glowhub_onboarding_dismissed`)
- Once dismissed, the checklist never shows again

### File Changes

**`src/components/OnboardingChecklist.tsx`** (new)
- Component accepting `screens`, `playlists`, `mediaCount` props
- Computes completion state for each step
- Renders the glassmorphism card with steps, progress bar, and CTA buttons
- Handles dismiss via localStorage

**`src/pages/Dashboard.tsx`**
- Add `mediaCount` state, fetch media count in the existing `useEffect`
- Import and render `<OnboardingChecklist>` between the stats grid and `<SystemHealth />`
- Only render if not dismissed (check localStorage on mount)

