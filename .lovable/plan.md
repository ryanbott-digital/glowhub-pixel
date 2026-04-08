

## Create /terms Route — Terms of Service & Privacy Policy

### What We're Building
A new `/terms` page with Deep Space background, glassmorphism content blocks, and top tabs to switch between Terms of Service and Privacy Policy. Human-readable tone with summary boxes and placeholder legal content.

### Changes

**1. Create `src/pages/Terms.tsx`**
- Deep Space background (`bg-[#0B1120]`), Satoshi font
- "Last Updated" timestamp at top
- `Tabs` component (from existing `@/components/ui/tabs`) for "Terms of Service" / "Privacy Policy"
- Each tab opens with a "Summary for Humans" glassmorphism box (3 bullet points)
- Content broken into glassmorphism cards (`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl`)
- Text color `text-[#E2E8F0]`, headers in white
- Links styled with `hover:text-cyan-400` neon teal effect
- Sections for Terms: Subscription ($9/mo, 30-day cancel), Content Responsibility, Uptime Disclaimer, Account Termination
- Sections for Privacy: Data Collection, Data Usage (leads table, consent), Cookie Policy, Data Retention
- Back link to home, logo at top

**2. Update `src/App.tsx`**
- Add lazy import for Terms page
- Add public route: `<Route path="/terms" element={<Terms />} />`

**3. Update Download page footer link**
- The consent text in `src/pages/Download.tsx` — link "Glow" text or add a link to `/terms`

### Design Details
- Reuses existing `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` components
- Each section is a separate glassmorphism card with a clear header and body
- Summary box uses a slightly different glass tint (cyan/teal border) to stand out
- Responsive: single column, max-w-4xl centered
- No authentication required — fully public page

