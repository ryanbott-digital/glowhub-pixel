import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { GlowLogoImage } from "@/components/GlowHubLogo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DollarSign, Sun, Moon, Zap, Check, WifiOff, Clock, ArrowRight } from "lucide-react";
import { RelatedSolutions } from "@/components/RelatedSolutions";
import restaurantMockup from "@/assets/restaurant-menu-mockup.jpg";
import menuEditorMockup from "@/assets/glow-menu-editor-mockup.jpg";
import moodSyncImg from "@/assets/mood-sync-restaurant.jpg";
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
    q: "Can I use my existing TVs?",
    a: "Absolutely. Glow works with any TV that has an HDMI port. Just plug in a £30 Amazon Fire TV Stick or any Android device, install Glow, and you're live in under 5 minutes. No proprietary hardware needed."
  },
  {
    q: "Does it work offline?",
    a: "Yes. Glow caches all your menu content locally on the device. If your Wi-Fi drops during the lunch rush, your menu keeps displaying flawlessly. Changes sync automatically when the connection returns."
  },
  {
    q: "Is it hard to set up?",
    a: "Not at all — setup takes about 5 minutes. Install Glow on your Firestick, enter a pairing code from the dashboard, and your menu is live. No IT department, no technician, no complicated wiring."
  },
  {
    q: "Can I change prices remotely?",
    a: "Yes. Log in to the Glow dashboard from any device — phone, tablet, or laptop — change a price or add a daily special, and it appears on every screen instantly."
  },
  {
    q: "How does scheduled menu switching work?",
    a: "Use the weekly schedule feature to assign different playlists to time slots. Your breakfast menu auto-switches to lunch at 11am, then to dinner at 5pm — no staff intervention needed."
  },
];

const RESTAURANT_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Digital Menu Boards for Restaurants | Glow",
  description: "Turn any Firestick into a cloud-controlled digital menu board. Dynamic pricing, mood sync, and flash promos for restaurants and cafés.",
  url: "https://glowhub-pixel.lovable.app/solutions/restaurants",
  mainEntity: {
    "@type": "FAQPage",
    mainEntity: FAQ_DATA.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    }))
  }
};

const SolutionsRestaurants = () => {
  const revealRef = useScrollReveal();

  return (
    <div ref={revealRef} className="min-h-screen bg-[#0B1120] text-[#E2E8F0] overflow-x-hidden font-['Satoshi',system-ui,sans-serif]">
      <SEOHead
        title="Digital Menu Boards for Restaurants | Glow"
        description="Turn any Firestick into a cloud-controlled digital menu board. Dynamic pricing, mood sync, and flash promos — 5-minute setup, $9/mo."
        canonical="/solutions/restaurants"
        jsonLd={RESTAURANT_JSON_LD}
      />

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-xl bg-[#0B1120]/70 border-b border-white/5">
        <Link to="/home" className="flex items-center gap-2">
          <GlowLogoImage className="h-8 w-8" />
          <span className="text-lg font-bold tracking-tight text-white">Glow</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/home#comparison" className="text-sm text-[#94A3B8] hover:text-white transition-colors hidden sm:inline">Compare</Link>
          <Link to="/home#pricing" className="text-sm text-[#94A3B8] hover:text-white transition-colors hidden sm:inline">Pricing</Link>
          <Link
            to="/auth"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#00A3A3] to-[#00C2B7] text-[#0B1120] hover:shadow-[0_0_30px_hsla(180,100%,40%,0.4)] transition-all duration-300"
          >
            INITIALIZE DASHBOARD
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
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-[#00A3A3]/15 text-[#00E5CC] border border-[#00A3A3]/25 mb-6">
            Solution Blueprint — Restaurants
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 bg-gradient-to-br from-white via-[#E2E8F0] to-[#94A3B8] bg-clip-text text-transparent">
            Digital Menu Boards That Actually Sell.
          </h1>
          <p className="text-lg sm:text-xl text-[#94A3B8] max-w-3xl mx-auto leading-relaxed mb-10">
            Stop using static TVs. Turn your menu into a high-octane sales engine with millisecond-perfect sync and remote price control.
          </p>

          <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_80px_hsla(180,100%,40%,0.12)]">
            <img
              src={restaurantMockup}
              alt="Restaurant digital menu board displaying food categories and prices on a wall-mounted TV"
              width={1280}
              height={720}
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/60 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* ── The Glow Advantage ── */}
      <section className="px-6 py-24 max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 tracking-tight">The Glow Advantage for Food</h2>
        <p className="text-center text-[#64748B] max-w-2xl mx-auto mb-16">Three features that turn your TV into a revenue machine.</p>

        <div className="space-y-24">
          {/* 1 — Dynamic Pricing */}
          <div data-animate className="reveal-card grid lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#00A3A3]/15 text-[#00E5CC]">
                  <DollarSign className="w-5 h-5" />
                </span>
                <h3 className="text-2xl font-bold">Dynamic Pricing</h3>
              </div>
              <p className="text-[#94A3B8] leading-relaxed mb-6">
                Lunch rush hitting hard? Open the Glow admin app on your phone, tap a price, change it, and it's live across <strong className="text-white">every screen in your restaurant</strong> within seconds. No reprinting, no USB sticks, no walking to each display.
              </p>
              <ul className="space-y-3">
                {["Change any price from your phone in real-time", "Bulk update across all locations simultaneously", "Schedule price changes for happy hour automatically"].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-[#94A3B8]">
                    <Check className="w-4 h-4 text-[#00E5CC] mt-0.5 shrink-0" aria-label="Feature included" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 lg:order-2 rounded-2xl overflow-hidden border border-white/10 bg-[#0B1120]/50 backdrop-blur-xl shadow-[0_0_40px_hsla(180,100%,40%,0.08)]">
              <img
                src={menuEditorMockup}
                alt="Glow Admin App Menu Editor interface showing drag-and-drop menu builder and pricing controls"
                width={1280}
                height={720}
                loading="lazy"
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* 2 — Mood Sync */}
          <div data-animate className="reveal-card grid lg:grid-cols-2 gap-10 items-center">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0B1120]/50 backdrop-blur-xl shadow-[0_0_40px_hsla(180,100%,40%,0.08)]">
              <img
                src={moodSyncImg}
                alt="Split view showing bright morning café atmosphere transitioning to moody evening bistro ambiance"
                width={1280}
                height={640}
                loading="lazy"
                className="w-full h-auto"
              />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400">
                  <Sun className="w-5 h-5" />
                </span>
                <ArrowRight className="w-4 h-4 text-[#475569]" />
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400">
                  <Moon className="w-5 h-5" />
                </span>
                <h3 className="text-2xl font-bold">Mood Sync</h3>
              </div>
              <p className="text-[#94A3B8] leading-relaxed mb-6">
                Your restaurant isn't the same at 8am and 8pm — why should your display be? Glow's <strong className="text-white">weekly scheduler</strong> automatically shifts your video backgrounds from 'Bright Morning Café' to 'Moody Evening Bistro' based on the time of day.
              </p>
              <ul className="space-y-3">
                {["Breakfast → Lunch → Dinner playlists on autopilot", "Match lighting & ambiance with display content", "Zero staff intervention — fully automated transitions"].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-[#94A3B8]">
                    <Check className="w-4 h-4 text-[#00E5CC] mt-0.5 shrink-0" aria-label="Feature included" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 3 — Flash Promos */}
          <div data-animate className="reveal-card grid lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400">
                  <Zap className="w-5 h-5" />
                </span>
                <h3 className="text-2xl font-bold">Flash Promos</h3>
              </div>
              <p className="text-[#94A3B8] leading-relaxed mb-6">
                Hit the <strong className="text-white">Hype Button</strong> from your dashboard and every screen in the building erupts with a 'Happy Hour' or 'Daily Specials' takeover. Full-screen, cinematic, impossible to miss. Perfect for clearing a slow afternoon or driving last-minute orders.
              </p>
              <ul className="space-y-3">
                {["One-tap broadcast to all screens instantly", "Full-screen cinematic takeover animations", "Schedule recurring promos — 'Taco Tuesday' on autopilot"].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-[#94A3B8]">
                    <Check className="w-4 h-4 text-[#00E5CC] mt-0.5 shrink-0" aria-label="Feature included" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 lg:order-2 rounded-2xl overflow-hidden border border-[#F43F5E]/20 bg-[#0B1120]/50 backdrop-blur-xl shadow-[0_0_40px_hsla(350,80%,55%,0.1)] p-8 flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-[#F43F5E]/20 blur-2xl animate-pulse" />
                <button className="relative px-8 py-4 rounded-2xl bg-gradient-to-r from-[#F43F5E] to-[#FB923C] text-white font-extrabold text-lg tracking-wide shadow-[0_0_40px_hsla(350,80%,55%,0.3)] cursor-default">
                  🔥 HYPE BUTTON
                </button>
              </div>
              <p className="text-[#64748B] text-sm mt-6 text-center">One tap. Every screen. Instant takeover.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="px-6 py-20 bg-gradient-to-b from-transparent via-[#0B1120] to-transparent">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 tracking-tight">Live in 5 Minutes</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Plug In a Firestick", desc: "Any Amazon Fire TV Stick or Android device. Plug it into your existing TV." },
              { step: "02", title: "Pair with Glow", desc: "Enter the pairing code from your dashboard. Your screen connects instantly." },
              { step: "03", title: "Upload & Go Live", desc: "Drag your menu images into the playlist builder. They appear on screen in seconds." },
            ].map((s) => (
              <div key={s.step} data-animate className="reveal-card rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-6 text-center hover:border-[#00A3A3]/20 hover:shadow-[0_0_30px_hsla(180,100%,40%,0.08)] transition-all duration-500">
                <span className="text-3xl font-extrabold text-[#00A3A3]/40 mb-3 block">{s.step}</span>
                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="px-6 py-20 max-w-3xl mx-auto" aria-label="Frequently asked questions about digital menu boards for restaurants">
        <h2 className="text-3xl font-bold text-center mb-10 tracking-tight">Restaurant Menu Board FAQ</h2>
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

      <RelatedSolutions currentPath="/solutions/restaurants" />

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 px-6 py-10 text-center text-xs text-[#475569]">
        <div className="flex items-center justify-center gap-2 mb-3">
          <GlowLogoImage className="h-5 w-5 opacity-50" />
          <span>Glow — Digital Signage, Reinvented</span>
        </div>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/home" className="hover:text-[#94A3B8] transition-colors">Home</Link>
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

export default SolutionsRestaurants;
