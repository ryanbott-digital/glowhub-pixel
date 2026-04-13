import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { GlowLogoImage } from "@/components/GlowHubLogo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Hotel, CalendarClock, Map, Bell, Check, ArrowRight } from "lucide-react";
import { RelatedSolutions } from "@/components/RelatedSolutions";
import lobbyMockup from "@/assets/hospitality-lobby-mockup.jpg";
import eventDisplay from "@/assets/hospitality-event-display.jpg";
import wayfindingImg from "@/assets/hospitality-wayfinding.jpg";
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
      (entries) =>
        entries.forEach((e) => {
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
    q: "Can I use the TVs already in my hotel?",
    a: "Yes. Any TV with an HDMI port works — just plug in a £30 Amazon Fire TV Stick, install Glow, and your lobby display is live in under 5 minutes. No proprietary hardware or expensive integrations.",
  },
  {
    q: "Can I manage displays across multiple properties?",
    a: "Absolutely. Glow's dashboard lets you manage screens across every property from a single login. Group screens by location, push content to all sites at once, or tailor each lobby individually.",
  },
  {
    q: "Does it work if the internet goes down?",
    a: "Yes — Glow caches all content locally on the device. If connectivity drops, your welcome screens and event boards keep running flawlessly. Changes sync automatically when the connection returns.",
  },
  {
    q: "Can I display live event schedules?",
    a: "Yes. Create playlists for each event or conference day, schedule them to auto-switch at specific times, and update last-minute room changes from your phone in seconds.",
  },
  {
    q: "How do I update content across the hotel?",
    a: "Log in to the Glow dashboard from any device — phone, tablet, or laptop. Upload new images or videos, assign them to a playlist, and publish to every screen with one click.",
  },
];

const HOSPITALITY_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Hotel & Venue Digital Signage | Glow",
    description:
      "Transform hotel lobbies and event venues with cloud-managed digital signage. Welcome screens, event boards, and wayfinding displays — 5-minute setup.",
    url: "https://glowhub-pixel.lovable.app/solutions/hospitality",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_DATA.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }
];

const SolutionsHospitality = () => {
  const revealRef = useScrollReveal();

  return (
    <div
      ref={revealRef}
      className="min-h-screen bg-[#0B1120] text-[#E2E8F0] overflow-x-hidden font-['Satoshi',system-ui,sans-serif]"
    >
      <SEOHead
        title="Hotel & Venue Digital Signage | Glow"
        description="Transform hotel lobbies and event venues with cloud-managed digital signage. Welcome screens, event boards, and wayfinding — 5-minute setup, $9/mo."
        canonical="/solutions/hospitality"
        jsonLd={HOSPITALITY_JSON_LD}
      />

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-xl bg-[#0B1120]/70 border-b border-white/5">
        <Link to="/home">
          <GlowLogoImage className="h-8" />
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
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-[#00A3A3]/15 text-[#00E5CC] border border-[#00A3A3]/25 mb-6">
            Solution Blueprint — Hospitality
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 bg-gradient-to-br from-white via-[#E2E8F0] to-[#94A3B8] bg-clip-text text-transparent">
            Lobby Displays &amp; Event Screens That Impress.
          </h1>
          <p className="text-lg sm:text-xl text-[#94A3B8] max-w-3xl mx-auto leading-relaxed mb-10">
            Welcome guests, showcase event schedules, and guide visitors — all from a single dashboard. No IT department required.
          </p>

          <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_80px_hsla(180,100%,40%,0.12)]">
            <img
              src={lobbyMockup}
              alt="Hotel lobby with large digital welcome display showing event schedule and guest information"
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
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 tracking-tight">
          The Glow Advantage for Hospitality
        </h2>
        <p className="text-center text-[#64748B] max-w-2xl mx-auto mb-16">
          Three features that elevate your guest experience from check-in to checkout.
        </p>

        <div className="space-y-24">
          {/* 1 — Welcome Displays */}
          <div data-animate className="reveal-card grid lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#00A3A3]/15 text-[#00E5CC]">
                  <Hotel className="w-5 h-5" />
                </span>
                <h3 className="text-2xl font-bold">Welcome Displays</h3>
              </div>
              <p className="text-[#94A3B8] leading-relaxed mb-6">
                Greet every guest with a <strong className="text-white">personalised lobby experience</strong>. Display welcome messages for VIP arrivals, conference groups, or wedding parties — update it from your phone in seconds.
              </p>
              <ul className="space-y-3">
                {[
                  "Branded welcome screens for groups & events",
                  "Update messaging from any device, anywhere",
                  "Schedule seasonal or time-of-day content automatically",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-[#94A3B8]">
                    <Check className="w-4 h-4 text-[#00E5CC] mt-0.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 lg:order-2 rounded-2xl overflow-hidden border border-white/10 bg-[#0B1120]/50 backdrop-blur-xl shadow-[0_0_40px_hsla(180,100%,40%,0.08)]">
              <img
                src={lobbyMockup}
                alt="Digital welcome display in a hotel lobby showing guest information"
                width={1280}
                height={720}
                loading="lazy"
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* 2 — Event & Conference Boards */}
          <div data-animate className="reveal-card grid lg:grid-cols-2 gap-10 items-center">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0B1120]/50 backdrop-blur-xl shadow-[0_0_40px_hsla(180,100%,40%,0.08)]">
              <img
                src={eventDisplay}
                alt="Conference room with digital event schedule display showing meeting agenda"
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
                <h3 className="text-2xl font-bold">Event &amp; Conference Boards</h3>
              </div>
              <p className="text-[#94A3B8] leading-relaxed mb-6">
                Running a conference, wedding reception, or corporate retreat? Glow's <strong className="text-white">weekly scheduler</strong> auto-switches event agendas throughout the day. Last-minute room change? Update from your phone and it's live on every screen instantly.
              </p>
              <ul className="space-y-3">
                {[
                  "Auto-switch agendas by day and time slot",
                  "Last-minute room changes updated in seconds",
                  "Multi-day event support with playlist scheduling",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-[#94A3B8]">
                    <Check className="w-4 h-4 text-[#00E5CC] mt-0.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 3 — Wayfinding & Amenities */}
          <div data-animate className="reveal-card grid lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400">
                  <Map className="w-5 h-5" />
                </span>
                <h3 className="text-2xl font-bold">Wayfinding &amp; Amenities</h3>
              </div>
              <p className="text-[#94A3B8] leading-relaxed mb-6">
                Guide guests to their room, the spa, or the conference hall. Place screens at elevators and hallways to display <strong className="text-white">dynamic directional content</strong> — no printed signs gathering dust.
              </p>
              <ul className="space-y-3">
                {[
                  "Interactive maps and directional signage",
                  "Highlight amenities, dining hours, and offers",
                  "Update wayfinding content without reprinting",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-[#94A3B8]">
                    <Check className="w-4 h-4 text-[#00E5CC] mt-0.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 lg:order-2 rounded-2xl overflow-hidden border border-white/10 bg-[#0B1120]/50 backdrop-blur-xl shadow-[0_0_40px_hsla(180,100%,40%,0.08)]">
              <img
                src={wayfindingImg}
                alt="Hotel hallway with digital wayfinding screen showing room directions and amenities"
                width={1280}
                height={720}
                loading="lazy"
                className="w-full h-auto"
              />
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
              {
                step: "01",
                title: "Plug In a Firestick",
                desc: "Any Amazon Fire TV Stick or Android device. Plug it into your lobby, corridor, or conference room TV.",
              },
              {
                step: "02",
                title: "Pair with Glow",
                desc: "Enter the pairing code from your dashboard. The screen connects instantly — no IT required.",
              },
              {
                step: "03",
                title: "Upload & Go Live",
                desc: "Drag your welcome graphics, event schedules, and wayfinding images into playlists. They appear on screen in seconds.",
              },
            ].map((s) => (
              <div
                key={s.step}
                data-animate
                className="reveal-card rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-6 text-center hover:border-[#00A3A3]/20 hover:shadow-[0_0_30px_hsla(180,100%,40%,0.08)] transition-all duration-500"
              >
                <span className="text-3xl font-extrabold text-[#00A3A3]/40 mb-3 block">{s.step}</span>
                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="px-6 py-20 max-w-3xl mx-auto" aria-label="Frequently asked questions about hotel and venue digital signage">
        <h2 className="text-3xl font-bold text-center mb-10 tracking-tight">
          Hospitality Signage FAQ
        </h2>
        <Accordion type="single" collapsible className="space-y-3">
          {FAQ_DATA.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-white/5 rounded-xl bg-white/[0.02] backdrop-blur-xl px-6 overflow-hidden"
            >
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
            Your lobby deserves more than a static TV.
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

      <RelatedSolutions currentPath="/solutions/hospitality" />

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

export default SolutionsHospitality;
