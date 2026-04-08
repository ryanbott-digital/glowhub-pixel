

## Redesign /download as Lead Capture & Installation Funnel

### What We're Building
A two-phase download page: first an email gate (glassmorphism card with email capture), then a cross-fade reveal of the full installation dashboard with device-specific accordion guides. Emails are saved to a new `leads` table.

### Changes

**1. Database Migration — Create `leads` table**
```sql
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert leads" ON public.leads FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can view leads" ON public.leads FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
```
No auth required for insert — this is a public lead capture form.

**2. Rewrite `src/pages/Download.tsx`**

- **State**: `unlocked` boolean, `email` string, `submitting` boolean, `flashActive` boolean
- **Phase 1 — The Gate**: Centered glassmorphism card with:
  - Glow logo + "GET THE GLOW PLAYER" headline
  - Subtext about unlocking download link
  - Neon-bordered email input (validated with basic regex)
  - "Unlock Access" button that inserts into `leads` table, then triggers flash animation and sets `unlocked = true`
- **Transition**: On submit, briefly show a white/neon flash overlay (`flashActive` for ~400ms), then cross-fade to Phase 2 using opacity + CSS transitions
- **Phase 2 — The Payload**:
  - Top: Massive glowing Downloader code (reuse existing neon digit style)
  - Secondary: Download APK button + Browser mode URL
  - Below: "How to install on your device" section with three device icons (Firestick, Android TV, Tablet/PC) using Accordion components — collapsed by default, each with a 3-step visual guide
  - Footer: consent note about receiving Glow updates
- **Design**: Keep Deep Space background, mesh gradients, glass classes, existing nav bar

### Technical Details
- One new database table with public INSERT, admin-only SELECT
- Single page file rewrite — no new components needed
- Uses existing Accordion, Input, and Button UI components
- Email validation client-side before insert
- Flash effect: absolute overlay div with `bg-white/90` that fades in/out over 400ms via CSS transition
- No authentication required for the email capture

