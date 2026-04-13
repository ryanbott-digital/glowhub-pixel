import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Check, X, ArrowRight, Zap, Radio, Tv, DollarSign, Shield, Clock, Smartphone, MonitorPlay, Timer, Rocket } from "lucide-react";
import StarField from "@/components/StarField";

/* ── JSON-LD ── */
const COMPARE_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "OptiSigns Alternative | Best Value Digital Signage for Firestick",
    description:
      "Looking for a cheaper OptiSigns alternative? Glow offers professional 5-screen management, millisecond sync, and live UK radio for only $9. Switch today.",
    url: "https://glowhub-pixel.lovable.app/compare/optisigns-alternative",
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://glowhub-pixel.lovable.app/home" },
      { "@type": "ListItem", position: 2, name: "Compare", item: "https://glowhub-pixel.lovable.app/compare/optisigns-alternative" },
    ],
  },
];

/* ── Price-Gap Table ── */
const priceGap = [
  {
    label: "Price for 5 Screens",
    glow: "$9/mo",
    competitor: "~$75/mo",
    icon: DollarSign,
  },
  {
    label: "Sync Performance",
    glow: "60fps Native Sync",
    competitor: "Standard Web-view",
    icon: Zap,
  },
  {
    label: "Background Audio",
    glow: "Built-in UK Radio",
    competitor: "Extra add-on",
    icon: Radio,
  },
  {
    label: "Hardware",
    glow: "Optimized for $30 Firesticks",
    competitor: "Pushes $80+ players",
    icon: Tv,
  },
  {
    label: "Remote Screen Management",
    glow: "Instant triggers from phone",
    competitor: "Delayed web dashboard",
    icon: Smartphone,
  },
  {
    label: "Offline Caching",
    glow: "Full cache-first engine",
    competitor: "Limited support",
    icon: Shield,
  },
];

/* ── Feature Cards ── */
const featureCards = [
  {
    icon: Zap,
    title: "The Hype Trigger",
    description:
      "Instant remote takeovers that legacy Firestick digital signage apps can't match. Push a promo, alert, or message to every screen in under 200ms — directly from your phone.",
  },
  {
    icon: Timer,
    title: "The Timeline Engine",
    description:
      "A modern, tactile scheduler built for remote screen management. Drag-and-drop time blocks beat old-school calendars — perfect for cheap menu boards that need daily rotations.",
  },
  {
    icon: Rocket,
    title: "Native Android Power",
    description:
      "Our native APK outperforms laggy web-wrappers on every $30 Firestick. Hardware-accelerated 60fps rendering means zero dropped frames, even on budget Firestick digital signage hardware.",
  },
];

/* ── Stats ── */
const stats = [
  { value: "$9", label: "Flat monthly fee" },
  { value: "5", label: "Screens included" },
  { value: "60fps", label: "Native sync" },
  { value: "0", label: "Contracts required" },
];

function CellValue({ value }: { value: string }) {
  return <span className="font-semibold text-foreground text-sm">{value}</span>;
}

export default function CompareOptiSigns() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <StarField />

      <SEOHead
        title="OptiSigns Alternative | Best Value Digital Signage for Firestick"
        description="Looking for a cheaper OptiSigns alternative? Glow offers professional 5-screen management, millisecond sync, and live UK radio for only $9. Switch today."
        canonical="/compare/optisigns-alternative"
        jsonLd={COMPARE_JSON_LD}
      />

      {/* ── Nav ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link to="/home" className="text-xl font-bold tracking-wider text-primary">
          Glow
        </Link>
        <Link
          to="/auth"
          className="text-sm px-5 py-2 rounded-full border border-primary/40 text-primary hover:bg-primary/10 transition"
        >
          Get Started Free
        </Link>
      </nav>

      {/* ══════════════════════════════════════════════════
          SECTION 1 — Hero (The Hook)
         ══════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-16 sm:pt-24 pb-16 text-center">
        <p className="text-xs font-mono tracking-[0.3em] text-primary/70 uppercase mb-6">
          [ 2026 COMPARISON ]
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
          The High-Performance Alternative{" "}
          <span className="block text-primary">to OptiSigns.</span>
        </h1>
        <p className="text-muted-foreground text-lg sm:text-xl max-w-3xl mx-auto mb-10 leading-relaxed">
          Stop paying per screen. Get the full Glow Ecosystem — including{" "}
          <span className="text-foreground font-medium">60fps sync</span>,{" "}
          <span className="text-foreground font-medium">UK Radio</span>, and{" "}
          <span className="text-foreground font-medium">5 screen slots</span> — for just{" "}
          <span className="text-primary font-bold">$9/month</span>.
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-primary text-primary-foreground text-lg font-bold hover:bg-primary/90 transition-all shadow-[0_0_40px_hsl(var(--primary)/0.35)] hover:shadow-[0_0_60px_hsl(var(--primary)/0.5)]"
        >
          SWITCH TO GLOW <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="text-xs text-muted-foreground mt-4">No credit card required · Free starter plan available</p>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 2 — Stats Bar
         ══════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm p-5 text-center"
            >
              <p className="text-3xl font-extrabold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 3 — Price Gap Table
         ══════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 pb-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">
          The Price Gap Is <span className="text-primary">Massive</span>
        </h2>
        <p className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">
          A direct, side-by-side breakdown targeting the legacy signage pain points that cost your business money every month.
        </p>

        <div className="rounded-2xl border border-border/20 bg-card/30 backdrop-blur-md overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-3 text-center text-sm font-semibold border-b border-border/20">
            <div className="p-4 text-muted-foreground">Feature</div>
            <div className="p-4 text-primary bg-primary/5 border-x border-border/10">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Glow
              </span>
            </div>
            <div className="p-4 text-muted-foreground">OptiSigns</div>
          </div>

          {/* Rows */}
          {priceGap.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-3 text-center items-center ${
                i % 2 === 0 ? "bg-card/20" : ""
              } ${i < priceGap.length - 1 ? "border-b border-border/10" : ""}`}
            >
              <div className="p-4 text-left flex items-center gap-2.5 text-muted-foreground text-sm">
                <row.icon className="w-4 h-4 text-primary/60 shrink-0" />
                <span>{row.label}</span>
              </div>
              <div className="p-4 bg-primary/5 border-x border-border/10">
                <span className="text-sm font-semibold text-foreground">{row.glow}</span>
              </div>
              <div className="p-4">
                <span className="text-sm text-muted-foreground">{row.competitor}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 4 — Why Pros Are Switching (Glass Cards)
         ══════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
          Why Pros Are <span className="text-primary">Switching</span>
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Exclusive 2026 features that make Glow the best Firestick digital signage platform for cheap menu boards and remote screen management.
        </p>

        <div className="grid sm:grid-cols-3 gap-6">
          {featureCards.map((card) => (
            <div
              key={card.title}
              className="group relative rounded-2xl border border-border/20 bg-card/30 backdrop-blur-[24px] p-6 hover:border-primary/40 transition-all duration-300 overflow-hidden"
            >
              {/* Spotlight glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(300px_circle_at_50%_0%,hsl(var(--primary)/0.12),transparent_70%)]" />

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-4">
                  <card.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 5 — Social Proof / Trust
         ══════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24 text-center">
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] backdrop-blur-md p-10 sm:p-14">
          <p className="text-xs font-mono tracking-[0.3em] text-primary/70 uppercase mb-4">
            THE 2026 SIGNAGE REVOLUTION
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Join the 2026 Signage Revolution.
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-lg mx-auto">
            <span className="text-foreground font-semibold">One Flat Fee.</span>{" "}
            <span className="text-foreground font-semibold">Zero Contracts.</span>{" "}
            <span className="text-primary font-semibold">Infinite Control.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full bg-primary text-primary-foreground text-lg font-bold hover:bg-primary/90 transition-all shadow-[0_0_40px_hsl(var(--primary)/0.35)] hover:shadow-[0_0_60px_hsl(var(--primary)/0.5)]"
            >
              SWITCH TO GLOW <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/home"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all text-lg font-medium"
            >
              Learn More
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-5">
            Free forever on 1 screen · Upgrade to Pro for $9/mo · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-border/10 py-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Glow Digital Signage. All rights reserved.</p>
        <div className="flex flex-wrap justify-center gap-4 mt-2">
          <Link to="/home" className="hover:text-primary transition">Home</Link>
          <Link to="/compare/screencloud-alternative" className="hover:text-primary transition">Glow vs ScreenCloud</Link>
          <Link to="/compare/yodeck-alternative" className="hover:text-primary transition">Glow vs Yodeck</Link>
          <Link to="/terms" className="hover:text-primary transition">Terms</Link>
          <Link to="/download" className="hover:text-primary transition">Download</Link>
        </div>
      </footer>
    </div>
  );
}
