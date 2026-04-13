import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { GlowLogoImage } from "@/components/GlowHubLogo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Layers, CalendarClock, Zap, Check, ArrowRight, X, Monitor, DollarSign } from "lucide-react";
import { RelatedSolutions } from "@/components/RelatedSolutions";
import retailBefore from "@/assets/retail-before-disconnected.jpg";
import retailAfter from "@/assets/retail-after-synced.jpg";
import retailAmbient from "@/assets/retail-ambient-glow.jpg";
import StarField from "@/components/StarField";
import { useEffect, useRef } from "react";

/* ── Scroll reveal ── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = root.querySelectorAll("[data-animate]");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add("in-view");
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.15 }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);
  return ref;
}

const FAQ_DATA = [
  {
    q: "How many screens can I synchronize?",
    a: "Glow's Sync-Glow Canvas supports NxM grid arrangements — 2x2, 3x1, 4x1, or any configuration you need. Each screen in the group plays its calculated portion of the content in millisecond-perfect sync via a Master/Slave heartbeat system."
  },
  {
    q: "Do I need a special video wall controller?",
    a: "No. Traditional video walls need controllers costing £2,000–£10,000+. Glow uses consumer-grade Firesticks (£30 each) and handles all the sync logic in the cloud. You save thousands on day one."
  },
  {
    q: "What if my screens have different bezels?",
    a: "Glow includes bezel compensation controls in the Canvas editor. You set the gap in pixels, and the system automatically adjusts each screen's video offset so content flows seamlessly across bezels."
  },
  {
    q: "Does it work with different screen sizes?",
    a: "Yes. The Canvas supports per-screen resolution overrides, so you can mix different TVs in the same wall. Glow calculates the bounding box and applies pixel-accurate CSS translations for each display."
  },
  {
    q: "What happens if one screen loses connection?",
    a: "The system uses drift correction: rubber-banding for minor offsets (50–500ms) and automatic hard re-syncs for larger drops. Follower screens also send 'sync-wait' signals during buffering to pause the wall briefly, keeping everything aligned."
  },
];

const RETAIL_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Multi-Screen Retail Window Displays | Glow",
    description: "Synchronize multiple Firestick-powered screens into one seamless video wall for retail storefronts. No proprietary hardware needed.",
    url: "https://glowhub-pixel.lovable.app/solutions/retail",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_DATA.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    }))
  }
];

const SAVINGS = [
  { label: "Video Wall Controller", legacy: "$2,000–$10,000", glow: "$0" },
  { label: "Media Players (×4)", legacy: "$1,200+ (proprietary)", glow: "$120 (4× Firestick)" },
  { label: "Software License", legacy: "$50–$100/mo per screen", glow: "$9/mo (unlimited)" },
  { label: "Setup / Installation", legacy: "Professional install required", glow: "5-minute DIY" },
];

const SolutionsRetail = () => {
  const revealRef = useScrollReveal();

  return (
    <div ref={revealRef} className="min-h-screen bg-[#0B1120] text-[#E2E8F0] overflow-x-hidden font-['Satoshi',system-ui,sans-serif]">
      <SEOHead
        title="Multi-Screen Retail Window Displays | Glow"
        description="Synchronize multiple Firestick-powered screens into one seamless video wall for retail storefronts. Automated scheduling, instant product launches, no proprietary hardware."
        canonical="/solutions/retail"
        jsonLd={RETAIL_JSON_LD}
      />

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-xl bg-[#0B1120]/70 border-b border-white/5">
        <Link to="/home" className="flex items-center gap-2">
          <GlowLogoImage className="h-8 w-8" />
          <span className="text-lg font-bold tracking-tight text-white">Glow</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/solutions" className="text-sm text-[#94A3B8] hover:text-white transition-colors hidden sm:inline">Solutions</Link>
          <Link to="/home#comparison" className="text-sm text-[#94A3B8] hover:text-white transition-colors hidden sm:inline">Compare</Link>
          <Link to="/home#pricing" className="text-sm text-[#94A3B8] hover:text-white transition-colors hidden sm:inline">Pricing</Link>
          <Link
            to="/auth"
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#00A3A3] to-[#00C2B7] text-[#0B1120] hover:shadow-[0_0_30px_hsla(180,100%,40%,0.4)] transition-all duration-300"
          >
            <span className="hidden sm:inline">INITIALIZE DASHBOARD</span>
            <span className="sm:hidden">Login</span>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <StarField />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1120] via-transparent to-[#0B1120] pointer-events-none z-[1]" />

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/25 mb-6">
            Solution Blueprint — Retail
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 bg-gradient-to-br from-white via-[#E2E8F0] to-[#94A3B8] bg-clip-text text-transparent">
            Turn Your Storefront into a Digital Canvas.
          </h1>
          <p className="text-lg sm:text-xl text-[#94A3B8] max-w-3xl mx-auto leading-relaxed mb-10">
            Synchronize every screen in your window with millisecond precision. Create immersive, multi-screen experiences that stop foot traffic and drive sales.
          </p>
        </div>
      </section>

      {/* ── Before vs After ── */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 tracking-tight">Before vs. After</h2>
        <p className="text-center text-[#64748B] max-w-2xl mx-auto mb-12">The difference between disconnected screens and a unified Glow-powered storefront.</p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Before */}
          <div data-animate className="reveal-card rounded-2xl border border-red-500/20 bg-white/[0.02] backdrop-blur-xl overflow-hidden group">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/15">
                <X className="w-4 h-4 text-red-400" aria-label="Not recommended" />
              </span>
              <span className="font-semibold text-red-300">The Old Way</span>
            </div>
            <div className="relative">
              <img
                src={retailBefore}
                alt="Disconnected retail screens showing different random content at different times — chaotic and unprofessional"
                width={1280}
                height={720}
                loading="lazy"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/80 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <ul className="space-y-1.5 text-sm text-red-300/80">
                  {["Each screen plays random content", "No synchronization whatsoever", "Chaotic, unprofessional appearance"].map(t => (
                    <li key={t} className="flex items-center gap-2">
                      <X className="w-3 h-3 shrink-0" aria-label="Drawback" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* After */}
          <div data-animate className="reveal-card rounded-2xl border border-[#00A3A3]/30 bg-white/[0.02] backdrop-blur-xl overflow-hidden group shadow-[0_0_40px_hsla(180,100%,40%,0.08)]">
            <div className="px-6 py-4 border-b border-[#00A3A3]/15 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#00A3A3]/15">
                <Check className="w-4 h-4 text-[#00E5CC]" aria-label="Recommended" />
              </span>
              <span className="font-semibold text-[#00E5CC]">The Glow Way</span>
              <span className="ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#00A3A3]/20 text-[#00E5CC] border border-[#00A3A3]/30">60fps Sync</span>
            </div>
            <div className="relative">
              <img
                src={retailAfter}
                alt="Four retail screens displaying one continuous synchronized panoramic fashion video — seamless and stunning"
                width={1280}
                height={720}
                loading="lazy"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/80 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <ul className="space-y-1.5 text-sm text-[#00E5CC]/90">
                  {["One panoramic video across all screens", "Millisecond-perfect synchronization", "Cinematic, traffic-stopping impact"].map(t => (
                    <li key={t} className="flex items-center gap-2">
                      <Check className="w-3 h-3 shrink-0" aria-label="Benefit" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Sections ── */}
      <section className="px-6 py-24 max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 tracking-tight">High-Impact Retail Features</h2>
        <p className="text-center text-[#64748B] max-w-2xl mx-auto mb-16">Built for storefronts that need to dominate the street.</p>

        <div className="space-y-24">
          {/* 1 — Canvas Mode */}
          <div data-animate className="reveal-card grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#3B82F6]/15 text-[#60A5FA]">
                  <Layers className="w-5 h-5" />
                </span>
                <h3 className="text-2xl font-bold">The 'Canvas' Mode</h3>
              </div>
              <p className="text-[#94A3B8] leading-relaxed mb-6">
                Glow treats multiple Firesticks as <strong className="text-white">one single synchronized engine</strong>. Upload a panoramic video, define your grid layout (2×2, 4×1, 3×2 — anything), and Glow's Automatic Video Offset Engine calculates pixel-accurate crop regions for each screen. The result? One seamless, 60fps canvas spanning your entire storefront.
              </p>
              <ul className="space-y-3">
                {[
                  "NxM grid arrangements — any configuration",
                  "Automatic bezel compensation for seamless edges",
                  "Master/Slave heartbeat with 200ms sync interval",
                  "Mixed-resolution support with per-screen overrides",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-[#94A3B8]">
                    <Check className="w-4 h-4 text-[#00E5CC] mt-0.5 shrink-0" aria-label="Feature included" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            {/* Canvas diagram */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 shadow-[0_0_40px_hsla(220,80%,55%,0.08)]">
              <div className="grid grid-cols-4 gap-1.5 aspect-[16/9]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-[#3B82F6]/30 bg-gradient-to-br from-[#3B82F6]/10 to-[#0B1120] flex items-center justify-center relative overflow-hidden group/cell"
                  >
                    <Monitor className="w-6 h-6 text-[#3B82F6]/40" />
                    <span className="absolute bottom-1.5 text-[10px] font-mono text-[#3B82F6]/50">S{i + 1}</span>
                    <div className="absolute inset-0 border-2 border-[#00E5CC]/0 group-hover/cell:border-[#00E5CC]/30 rounded-lg transition-all duration-300" />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#3B82F6]/30 to-transparent" />
                <span className="text-xs text-[#64748B] font-mono">4×1 Sync Group</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#3B82F6]/30 to-transparent" />
              </div>
            </div>
          </div>

          {/* 2 — Schedule for the Street */}
          <div data-animate className="reveal-card grid lg:grid-cols-2 gap-10 items-center">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0B1120]/50 backdrop-blur-xl shadow-[0_0_40px_hsla(180,100%,40%,0.08)]">
              <img
                src={retailAmbient}
                alt="After-hours retail storefront with subtle ambient glow branding on screens — elegant and low-power"
                width={1280}
                height={720}
                loading="lazy"
                className="w-full h-auto"
              />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400">
                  <CalendarClock className="w-5 h-5" />
                </span>
                <h3 className="text-2xl font-bold">Schedule for the Street</h3>
              </div>
              <p className="text-[#94A3B8] leading-relaxed mb-6">
                Daytime shoppers need high-brightness, attention-grabbing product videos. After hours, switch to <strong className="text-white">'Ambient Glow' mode</strong> — soft, elegant brand loops that reinforce your identity to passers-by without wasting energy. Glow's weekly scheduler handles the transition automatically.
              </p>
              <ul className="space-y-3">
                {[
                  "High-brightness daytime content for maximum impact",
                  "'Ambient Glow' after-hours branding on autopilot",
                  "Weekly scheduler — set once, runs forever",
                  "Different content for weekdays vs weekends",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-[#94A3B8]">
                    <Check className="w-4 h-4 text-[#00E5CC] mt-0.5 shrink-0" aria-label="Feature included" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 3 — Instant Product Launches */}
          <div data-animate className="reveal-card grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400">
                  <Zap className="w-5 h-5" />
                </span>
                <h3 className="text-2xl font-bold">Instant Product Launches</h3>
              </div>
              <p className="text-[#94A3B8] leading-relaxed mb-6">
                New collection dropping? Hit the <strong className="text-white">Hype Button</strong> and every screen in every store erupts simultaneously with your launch campaign. Full-screen, cinematic, synchronized across all locations. No USB sticks, no waiting, no manual updates at each branch.
              </p>
              <ul className="space-y-3">
                {[
                  "One-tap broadcast to all stores simultaneously",
                  "Full-screen cinematic takeover with transitions",
                  "Schedule launches in advance — go live at midnight",
                  "Roll back to normal content automatically after the event",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-[#94A3B8]">
                    <Check className="w-4 h-4 text-[#00E5CC] mt-0.5 shrink-0" aria-label="Feature included" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl overflow-hidden border border-violet-500/20 bg-[#0B1120]/50 backdrop-blur-xl shadow-[0_0_40px_hsla(270,60%,55%,0.1)] p-8 flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-violet-500/20 blur-2xl animate-pulse" />
                <button className="relative px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-extrabold text-lg tracking-wide shadow-[0_0_40px_hsla(270,60%,55%,0.3)] cursor-default">
                  🚀 LAUNCH NOW
                </button>
              </div>
              <p className="text-[#64748B] text-sm mt-6 text-center">Every store. Every screen. One moment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── No Proprietary Hardware ── */}
      <section className="px-6 py-20 bg-gradient-to-b from-transparent via-[#0B1120] to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <DollarSign className="w-6 h-6 text-[#00E5CC]" />
            <h2 className="text-3xl font-bold text-center tracking-tight">Save Thousands on Hardware</h2>
          </div>
          <p className="text-center text-[#64748B] max-w-2xl mx-auto mb-10">
            Retailers using traditional signage spend $5,000–$15,000+ on proprietary controllers and players. Glow does the same job with off-the-shelf Firesticks.
          </p>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden">
            <div className="grid grid-cols-3 text-xs font-semibold uppercase tracking-wider border-b border-white/5">
              <div className="px-6 py-4 text-[#64748B]">Component</div>
              <div className="px-6 py-4 text-red-300/70 text-center">Legacy Hardware</div>
              <div className="px-6 py-4 text-[#00E5CC] text-center border-l border-[#00A3A3]/10">Glow</div>
            </div>
            {SAVINGS.map((row, i) => (
              <div key={i} className="grid grid-cols-3 text-sm border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors">
                <div className="px-6 py-4 text-[#E2E8F0] font-medium">{row.label}</div>
                <div className="px-6 py-4 text-[#94A3B8] text-center">{row.legacy}</div>
                <div className="px-6 py-4 text-[#00E5CC] text-center font-semibold border-l border-[#00A3A3]/10">{row.glow}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="px-6 py-20 max-w-3xl mx-auto" aria-label="Frequently asked questions about multi-screen retail digital signage">
        <h2 className="text-3xl font-bold text-center mb-10 tracking-tight">Retail Window Display FAQ</h2>
        <Accordion type="single" collapsible className="space-y-3">
          {FAQ_DATA.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border border-white/5 rounded-xl bg-white/[0.02] backdrop-blur-xl px-6 overflow-hidden">
              <AccordionTrigger className="text-left text-[#E2E8F0] hover:text-white font-medium py-5 text-sm sm:text-base">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-[#94A3B8] text-sm leading-relaxed pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xl sm:text-2xl font-bold text-white mb-3">
            Stop overpaying for 2010 technology.
          </p>
          <p className="text-lg text-[#00E5CC] font-semibold mb-8">
            Join the Glow Ecosystem today.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold bg-gradient-to-r from-[#00A3A3] to-[#00C2B7] text-[#0B1120] hover:shadow-[0_0_40px_hsla(180,100%,40%,0.5)] transition-all duration-300 tracking-wide"
          >
            INITIALIZE DASHBOARD
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-xs text-[#475569] mt-4">Free plan available · No credit card required · 5-minute setup</p>
        </div>
      </section>

      <RelatedSolutions currentPath="/solutions/retail" />

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 px-6 py-10 text-center text-xs text-[#475569]">
        <div className="flex items-center justify-center gap-2 mb-3">
          <GlowLogoImage className="h-5 w-5 opacity-50" />
          <span>Glow — Digital Signage, Reinvented</span>
        </div>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/home" className="hover:text-[#94A3B8] transition-colors">Home</Link>
          <Link to="/solutions/restaurants" className="hover:text-[#94A3B8] transition-colors">Restaurants</Link>
          <Link to="/use-cases" className="hover:text-[#94A3B8] transition-colors">Use Cases</Link>
          <Link to="/download" className="hover:text-[#94A3B8] transition-colors">Download</Link>
          <Link to="/terms" className="hover:text-[#94A3B8] transition-colors">Terms</Link>
        </div>
      </footer>

      <style>{`
        [data-animate] {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.7s ease-out, transform 0.7s ease-out;
        }
        [data-animate].in-view {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default SolutionsRetail;
