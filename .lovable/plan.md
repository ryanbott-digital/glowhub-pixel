

## Build the Pro-Glow Ticker Widget

### What We're Building
A premium "Live News Crawl" widget for the Studio's widget library — a full-width glassmorphism ticker bar with a pulsing LIVE badge, smooth CSS-only horizontal scroll, and dedicated configuration controls in the right sidebar.

### Changes

**1. Add `widget-ticker` to the type system and widget library** (`src/pages/Studio.tsx`)

- Extend the `CanvasElement["type"]` union with `"widget-ticker"`
- Add a new entry to `WIDGET_LIBRARY` (Pro section) with:
  - Label: "Pro-Glow Ticker"
  - Icon: `Newspaper` (from lucide)
  - Default dimensions: full canvas width (~920) x 50px
  - Preview tile: miniature glassmorphism bar with a tiny red LIVE dot and scrolling sample text
- Add `"widget-ticker"` to the `contentMap` with default JSON config: `{"messages":"Breaking News · Welcome to GLOW · Stay tuned","speed":"normal","color":"teal"}`

**2. Canvas element renderer** (`src/pages/Studio.tsx` — `renderElement`)

Add a new `widget-ticker` render block:
- Full-width glassmorphism container: `backdrop-blur-[25px]`, `bg-white/5`, teal glow top border (`border-t-2 border-primary shadow-[0_-2px_15px_hsla(180,100%,32%,0.3)]`)
- Left side: red LIVE badge with pulse animation (`animate-pulse`, red bg, bold white text)
- Content area: `overflow-hidden` with an inner `<span>` using pure CSS `translateX` animation (`@keyframes tickerScroll`) for 60fps hardware-accelerated scrolling
- Typography: `font-mono font-bold tracking-wider` with configurable color (teal or white)
- Speed mapped from config: slow = 30s, normal = 18s, fast = 10s animation duration

**3. Right sidebar properties panel** (`src/pages/Studio.tsx` — properties section)

When selected element is `widget-ticker`, show a custom config panel:
- **Messages**: Text input for custom ticker text (pipe-separated or free text)
- **Speed**: Slider with three stops (Slow / Normal / Fast) 
- **Color**: Toggle between "Neon Teal" and "Classic White"

All changes write back to the element's `content` field as JSON.

**4. CSS animations** (inline `<style>` block at bottom of Studio)

Add `@keyframes tickerScroll`:
```css
@keyframes tickerScroll {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}
```
Uses `transform` only for GPU compositing — no layout thrashing, smooth on Firestick.

**5. Paywall** — already handled: `addElement(w.type, true)` calls `gatePro()` for Pro widgets, which triggers the existing "Level Up Your Glow" modal.

### Technical Details
- Single file edit: `src/pages/Studio.tsx`
- Config stored as JSON string in `CanvasElement.content`, parsed with `JSON.parse` in renderer and properties panel
- No new dependencies — uses existing lucide icons (`Newspaper` or `Radio`), existing Slider, Input, and Select components
- CSS `will-change: transform` on the scrolling span for GPU acceleration

