import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GlowLogoImage } from "@/components/GlowHubLogo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, WifiOff, Activity, CalendarClock, UserPlus, Download, Tv, Coffee, Dumbbell, ShoppingBag, Send, Loader2 } from "lucide-react";
import firestickIcon from "@/assets/firestick-icon.png";
import googletvIcon from "@/assets/googletv-remote-icon.png";
import { useEffect, useRef, useState, useCallback } from "react";

/* ── Scroll reveal hook ── */
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

/* ── Magnetic button hook ── */
function useMagnetic() {
  const ref = useRef<HTMLAnchorElement>(null);

  const handleMove = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
  }, []);

  const handleLeave = useCallback(() => {
    const el = ref.current;
    if (el) el.style.transform = "translate(0,0)";
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [handleMove, handleLeave]);

  return ref;
}

/* ── Live menu items for the mockup ── */
const MENU_ITEMS = [
  [
    { name: "Flat White", price: "$4.50", tag: "Popular" },
    { name: "Avocado Toast", price: "$12.00", tag: "" },
    { name: "Açaí Bowl", price: "$14.00", tag: "New" },
  ],
  [
    { name: "Espresso", price: "$3.50", tag: "" },
    { name: "Croissant", price: "$5.00", tag: "Fresh" },
    { name: "Matcha Latte", price: "$6.00", tag: "Popular" },
  ],
  [
    { name: "Cold Brew", price: "$5.50", tag: "Bestseller" },
    { name: "Salmon Bagel", price: "$13.00", tag: "" },
    { name: "Smoothie Bowl", price: "$11.00", tag: "Healthy" },
  ],
];

function LiveMenuMockup() {
  const [menuIndex, setMenuIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setMenuIndex((i) => (i + 1) % MENU_ITEMS.length);
        setFading(false);
      }, 600);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const items = MENU_ITEMS[menuIndex];

  return (
    <div className="w-full h-full bg-gradient-to-br from-[#0B1120] via-[#0F172A] to-[#131C2E] p-4 sm:p-6 flex flex-col justify-between overflow-hidden relative">
      {/* Ambient light */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00A3A3]/10 rounded-full blur-[60px]" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#3B82F6]/10 rounded-full blur-[50px]" />

      {/* Header */}
      <div className="relative z-10 mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-xs sm:text-sm font-bold text-[#E2E8F0] tracking-widest uppercase">Today's Menu</h4>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A3A3] animate-pulse" />
            <span className="text-[8px] sm:text-[10px] text-[#00A3A3] font-medium">LIVE</span>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-[#00A3A3]/40 via-[#3B82F6]/30 to-transparent" />
      </div>

      {/* Menu items with crossfade */}
      <div className={`relative z-10 flex-1 flex flex-col justify-center gap-2 sm:gap-3 transition-all duration-500 ${fading ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
        {items.map((item) => (
          <div key={item.name} className="flex items-center justify-between py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-[#E2E8F0]">{item.name}</span>
              {item.tag && (
                <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#00A3A3]/15 text-[#00A3A3] uppercase tracking-wider">{item.tag}</span>
              )}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-[#94A3B8]">{item.price}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-2 sm:mt-3 flex items-center justify-between">
        <span className="text-[8px] sm:text-[10px] text-[#475569]">Powered by GLOW</span>
        <div className="flex gap-0.5">
          {MENU_ITEMS.map((_, i) => (
            <div key={i} className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-colors duration-300 ${i === menuIndex ? "bg-[#00A3A3]" : "bg-[#1E293B]"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

const Home = () => {
  const wrapperRef = useScrollReveal();
  const ctaRef = useMagnetic();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      ref={wrapperRef}
      className="min-h-screen bg-[#0B1120] text-[#E2E8F0] font-sans overflow-x-hidden scroll-smooth"
    >
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0B1120]/80 border-b border-[#1E293B]/50">
        <div className="flex items-center justify-between px-6 py-3.5 max-w-6xl mx-auto">
          <GlowLogoImage className="h-8" />
          <div className="flex items-center gap-6">
            <button onClick={() => scrollTo("process")} className="hidden sm:block text-sm text-[#94A3B8] hover:text-[#E2E8F0] transition-colors">How it works</button>
            <button onClick={() => scrollTo("features")} className="hidden sm:block text-sm text-[#94A3B8] hover:text-[#E2E8F0] transition-colors">Features</button>
            <button onClick={() => scrollTo("pricing")} className="hidden sm:block text-sm text-[#94A3B8] hover:text-[#E2E8F0] transition-colors">Pricing</button>
            <Link
              to="/auth"
              className="text-sm font-medium px-5 py-2 rounded-lg bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] text-[#0B1120] hover:shadow-[0_0_20px_rgba(0,163,163,0.35)] transition-all"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero with mesh gradient ── */}
      <section className="relative px-6 pt-20 sm:pt-28 pb-28 max-w-6xl mx-auto">
        {/* Animated mesh gradient background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="mesh-blob mesh-blob-1" />
          <div className="mesh-blob mesh-blob-2" />
          <div className="mesh-blob mesh-blob-3" />
          <div className="mesh-blob mesh-blob-4" />
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left — Copy */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#1E293B] bg-[#0F172A]/60 backdrop-blur-sm text-xs text-[#94A3B8] mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A3A3] animate-pulse" />
              Digital signage made simple
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-[0.04em] sm:tracking-[0.06em] leading-[1.05] mb-6 uppercase">
              Your Content.<br /> Any Screen.{" "}
              <span className="bg-gradient-to-r from-[#00A3A3] via-[#3B82F6] to-[#00A3A3] bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                Pure Glow.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[#94A3B8] max-w-xl mb-10 leading-relaxed lg:mx-0 mx-auto">
              Turn any Firestick or Android TV into professional digital signage — reliable, affordable, and stunning.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 lg:justify-start justify-center">
              <Link
                ref={ctaRef}
                to="/auth"
                className="magnetic-cta group inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-semibold text-[#0B1120] bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] transition-all duration-200 will-change-transform"
              >
                Start Glowing for Free
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <button
                onClick={() => scrollTo("process")}
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-semibold border border-[#1E293B] hover:border-[#00A3A3]/50 hover:shadow-[0_0_16px_rgba(0,163,163,0.1)] transition-all duration-300"
              >
                See how it works
              </button>
            </div>
          </div>

          {/* Right — 3D TV Mockup */}
          <div className="flex-1 max-w-md lg:max-w-lg w-full" style={{ perspective: "1200px" }}>
            <div
              className="relative"
              style={{
                transform: "rotateY(-6deg) rotateX(3deg)",
                transformStyle: "preserve-3d",
              }}
            >
              <div className="absolute -bottom-6 left-[10%] right-[10%] h-12 bg-[#00A3A3]/10 blur-[40px] rounded-full" />
              <div className="radiant-glow rounded-2xl">
                <div className="bg-[#131C2E] rounded-2xl p-2.5 border border-[#1E293B]/60 shadow-2xl">
                  <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-[#00A3A3]/20 via-[#3B82F6]/15 to-[#EC4899]/10 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(0,163,163,0.15),transparent_60%)]" />
                    <GlowLogoImage className="h-14 sm:h-20 relative z-10 drop-shadow-[0_0_20px_rgba(0,163,163,0.3)]" />
                  </div>
                </div>
                <div className="mx-auto w-20 h-3 bg-[#131C2E] rounded-b-lg border-x border-b border-[#1E293B]/60" />
                <div className="mx-auto w-32 h-1.5 bg-[#131C2E] rounded-b-lg border-x border-b border-[#1E293B]/40 mt-[-1px]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trusted-for ribbon ── */}
      <section className="border-y border-[#1E293B]/40 bg-[#0B1120]/60 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
          <span className="text-xs text-[#64748B] uppercase tracking-[0.2em] font-medium">Trusted for</span>
          {[
            { Icon: Coffee, label: "Cafés" },
            { Icon: Dumbbell, label: "Gyms" },
            { Icon: ShoppingBag, label: "Retailers" },
          ].map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5 text-[#94A3B8]">
              <Icon className="w-5 h-5 text-[#00A3A3]/70" />
              <span className="text-sm font-medium tracking-wide">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Hardware Compatibility ── */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <h2 className="text-center text-xs uppercase tracking-[0.25em] text-[#64748B] font-medium mb-10">
          Designed for the hardware you already own
        </h2>
        <div className="flex items-center justify-center gap-12 sm:gap-20">
          <div data-animate className="reveal-card flex flex-col items-center gap-4">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl frost-card flex items-center justify-center p-4 group hover:border-[#00A3A3]/30 hover:shadow-[0_0_30px_rgba(0,163,163,0.08)] transition-all duration-300">
              <img src={firestickIcon} alt="Amazon Fire TV Stick" loading="lazy" width={512} height={512} className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] group-hover:scale-105 transition-transform duration-300" />
            </div>
            <span className="text-sm font-medium text-[#94A3B8] tracking-wide">Fire TV Stick</span>
          </div>
          <div className="h-16 w-px bg-gradient-to-b from-transparent via-[#1E293B] to-transparent" />
          <div data-animate className="reveal-card flex flex-col items-center gap-4" style={{ transitionDelay: "120ms" }}>
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl frost-card flex items-center justify-center p-4 group hover:border-[#00A3A3]/30 hover:shadow-[0_0_30px_rgba(0,163,163,0.08)] transition-all duration-300">
              <img src={googletvIcon} alt="Google TV Remote" loading="lazy" width={512} height={512} className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] group-hover:scale-105 transition-transform duration-300" />
            </div>
            <span className="text-sm font-medium text-[#94A3B8] tracking-wide">Google TV</span>
          </div>
        </div>
      </section>


      <section id="process" className="px-6 py-24 max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight mb-3">
          3 Simple Steps
        </h2>
        <p className="text-[#94A3B8] text-center mb-16 text-base max-w-lg mx-auto">
          Up and running in under 60 seconds.
        </p>

        <div className="grid sm:grid-cols-3 gap-6 relative">
          <div className="hidden sm:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-[#00A3A3]/30 via-[#3B82F6]/30 to-[#00A3A3]/30" />
          {[
            { step: "01", icon: <UserPlus className="w-7 h-7" />, title: "Sign Up", desc: "Create your free account in seconds. No credit card required." },
            { step: "02", icon: <Download className="w-7 h-7" />, title: "Sideload with Downloader", desc: "Use the 'Downloader' app to install Glow on any Firestick or Android TV." },
            { step: "03", icon: <Tv className="w-7 h-7" />, title: "Pair & Play", desc: "Enter your 6-digit code and your screen starts playing immediately." },
          ].map((s, i) => (
            <div
              key={s.step}
              data-animate
              className="reveal-card relative flex flex-col items-center text-center group"
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div className="relative z-10 w-24 h-24 rounded-2xl border border-[#1E293B] bg-[#0F172A]/80 backdrop-blur-xl flex items-center justify-center mb-5 group-hover:border-[#00A3A3]/40 group-hover:shadow-[0_0_20px_rgba(0,163,163,0.1)] transition-all duration-300">
                <div className="text-[#00A3A3]">{s.icon}</div>
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-[#00A3A3] to-[#3B82F6] text-[#0B1120] text-xs font-bold flex items-center justify-center">{s.step}</span>
              </div>
              <h3 className="text-lg font-semibold mb-1.5">{s.title}</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed max-w-[240px]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="px-6 py-24 max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight mb-3">
          Built Different
        </h2>
        <p className="text-[#94A3B8] text-center mb-16 text-base max-w-lg mx-auto">
          Everything you need. Nothing you don't.
        </p>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: <WifiOff className="w-7 h-7" />, title: "Offline-First", desc: "Content is cached locally. Your screens keep playing even when the internet drops.", accent: "#00A3A3" },
            { icon: <Activity className="w-7 h-7" />, title: "Heartbeat Monitoring", desc: "Real-time health pings tell you exactly which screens are online from your dashboard.", accent: "#3B82F6" },
            { icon: <CalendarClock className="w-7 h-7" />, title: "Easy Scheduling", desc: "Set weekly time-slot schedules per screen. The right playlist plays at the right time.", accent: "#EC4899" },
          ].map((f, i) => (
            <div
              key={f.title}
              data-animate
              className="reveal-card group rounded-2xl border border-[#1E293B] bg-[#0F172A]/60 backdrop-blur-xl p-7 hover:border-[#1E293B]/80 hover:bg-[#0F172A]/80 transition-all duration-300"
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 transition-shadow duration-300"
                style={{ background: `${f.accent}15`, color: f.accent }}
              >
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live Preview Showcase ── */}
      <section className="px-6 py-24 max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight mb-3">
          Any Content, Perfectly Rendered
        </h2>
        <p className="text-[#94A3B8] text-center mb-16 text-base max-w-lg mx-auto">
          Smooth double-buffered transitions. No flicker. No black screens. Ever.
        </p>

        <div data-animate className="reveal-card max-w-2xl mx-auto" style={{ perspective: "1400px" }}>
          <div
            className="relative"
            style={{ transform: "rotateY(-4deg) rotateX(2deg)", transformStyle: "preserve-3d" }}
          >
            {/* Glow underneath */}
            <div className="absolute -bottom-8 left-[5%] right-[5%] h-16 bg-[#00A3A3]/8 blur-[50px] rounded-full" />

            <div className="bg-[#131C2E] rounded-2xl p-3 border border-[#1E293B]/60 shadow-[0_25px_80px_rgba(0,163,163,0.12),0_10px_30px_rgba(0,0,0,0.4)]">
              <div className="aspect-video rounded-lg overflow-hidden">
                <LiveMenuMockup />
              </div>
            </div>
            {/* Stand */}
            <div className="mx-auto w-24 h-3.5 bg-[#131C2E] rounded-b-xl border-x border-b border-[#1E293B]/60" />
            <div className="mx-auto w-40 h-2 bg-[#131C2E] rounded-b-xl border-x border-b border-[#1E293B]/40 mt-[-1px]" />
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="px-6 py-24 max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight mb-3">
          Simple, Honest Pricing
        </h2>
        <p className="text-[#94A3B8] text-center mb-16 text-base max-w-lg mx-auto">
          No hidden fees. No per-screen surprises. Start free, upgrade when ready.
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Starter — glassmorphism */}
          <div
            data-animate
            className="reveal-card glass-card rounded-2xl p-8 flex flex-col transition-all duration-300"
          >
            <h3 className="text-xl font-semibold mb-1">The Starter</h3>
            <p className="text-sm text-[#94A3B8] mb-6">Free forever</p>
            <div className="text-5xl font-extrabold mb-8">
              $0<span className="text-lg font-normal text-[#94A3B8]">/mo</span>
            </div>
            <ul className="space-y-3.5 mb-8 flex-1">
              {["1 Screen", "Basic Scheduling", "500MB Storage", "'Powered by GLOW' watermark"].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#CBD5E1]">
                  <Check className="w-4 h-4 mt-0.5 text-[#00A3A3] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/auth"
              className="block text-center py-3 rounded-xl font-semibold border border-[#1E293B] hover:border-[#00A3A3]/50 hover:shadow-[0_0_16px_rgba(0,163,163,0.1)] transition-all duration-300"
            >
              Get Started
            </Link>
          </div>

          {/* Pro Glow — rotating conic gradient border */}
          <div
            data-animate
            className="reveal-card relative rounded-2xl flex flex-col transition-all duration-300"
            style={{ transitionDelay: "120ms" }}
          >
            {/* Rotating conic border wrapper */}
            <div className="conic-border-wrapper rounded-2xl p-[2px]">
              <div className="glass-card rounded-[14px] p-8 flex flex-col h-full">
                {/* Best Value badge */}
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] text-[#0B1120] shadow-[0_0_20px_rgba(0,163,163,0.3)]">
                  ✦ Best Value
                </span>

                <h3 className="text-xl font-semibold mb-1">The Pro Glow</h3>
                <p className="text-sm text-[#94A3B8] mb-6">For serious signage</p>
                <div className="text-5xl font-extrabold mb-2">
                  $9<span className="text-lg font-normal text-[#94A3B8]">/mo</span>
                </div>
                <p className="text-base font-bold text-[#00A3A3] mb-8">
                  Up to 5 Screens
                </p>
                <ul className="space-y-3.5 mb-8 flex-1">
                  {["No Watermarks", "Offline Mode (Cache)", "Screen Health Monitoring", "5GB Storage", "Priority Support"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[#CBD5E1]">
                      <Check className="w-4 h-4 mt-0.5 text-[#00A3A3] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/auth"
                  className="block text-center py-3 rounded-xl font-semibold bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] text-[#0B1120] hover:shadow-[0_0_30px_rgba(0,163,163,0.45)] transition-all duration-300"
                >
                  Go Pro
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="px-6 py-24 max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight mb-3">
          Frequently Asked Questions
        </h2>
        <p className="text-[#94A3B8] text-center mb-12 text-base max-w-lg mx-auto">
          Everything you need to know before getting started.
        </p>

        <Accordion type="single" collapsible className="space-y-3">
          {[
            {
              q: "Do I need special hardware?",
              a: "Nope! GLOW works on any Amazon Fire TV Stick or Android TV device. Just sideload the app using the free Downloader tool — no developer account required.",
            },
            {
              q: "Is the free plan really free forever?",
              a: "Yes. The Starter plan gives you 1 screen with basic scheduling and 500 MB of storage at no cost, with no time limit and no credit card required.",
            },
            {
              q: "What happens if my internet goes down?",
              a: "Pro plan screens cache your content locally. If the connection drops, your signage keeps playing the last synced playlist without interruption.",
            },
            {
              q: "Can I cancel Pro anytime?",
              a: "Absolutely. There are no contracts or cancellation fees. You can downgrade back to the Starter plan at any time from your dashboard.",
            },
            {
              q: "How do I pair a screen?",
              a: "Open the GLOW app on your Fire Stick, note the 6-digit pairing code, then enter it in your dashboard. The screen connects in under 10 seconds.",
            },
            {
              q: "What content formats are supported?",
              a: "GLOW supports images (JPEG, PNG, WebP), videos (MP4, WebM), and web URLs. Pro users also get advanced scheduling and playlist transitions.",
            },
          ].map((item, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              data-animate
              className="reveal-card glass-card rounded-xl border-0 px-6 overflow-hidden"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <AccordionTrigger className="py-5 text-left text-[#E2E8F0] hover:no-underline hover:text-[#00A3A3] transition-colors [&[data-state=open]>svg]:text-[#00A3A3]">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-[#94A3B8] text-sm leading-relaxed pb-5">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ── Contact Us ── */}
      <section className="px-6 py-24 max-w-2xl mx-auto">
        <h2 data-animate className="reveal-card text-3xl sm:text-4xl font-bold text-center tracking-tight mb-3">
          Get in Touch
        </h2>
        <p data-animate className="reveal-card text-[#94A3B8] text-center mb-12 text-base max-w-lg mx-auto">
          Have a question or want to learn more? Drop us a message and we'll get back to you within 24 hours.
        </p>
        <form
          data-animate
          className="reveal-card glass-card rounded-2xl p-8 space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
            const formData = new FormData(form);
            const name = (formData.get('name') as string || '').trim();
            const email = (formData.get('email') as string || '').trim();
            const message = (formData.get('message') as string || '').trim();
            if (!name || !email || !message) return;
            btn.disabled = true;
            btn.innerHTML = '<span class="flex items-center justify-center gap-2"><svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Sending…</span>';
            try {
              const { error } = await supabase.from('contact_submissions').insert({ name, email, message });
              if (error) throw error;
              form.reset();
              const msg = document.createElement('div');
              msg.className = 'text-center text-sm text-emerald-400 mt-3 animate-fade-in';
              msg.textContent = '✓ Message sent! We\'ll be in touch soon.';
              form.appendChild(msg);
              setTimeout(() => msg.remove(), 4000);
            } catch (err) {
              console.error('[Contact] Submit failed:', err);
              const msg = document.createElement('div');
              msg.className = 'text-center text-sm text-red-400 mt-3 animate-fade-in';
              msg.textContent = 'Something went wrong. Please try again.';
              form.appendChild(msg);
              setTimeout(() => msg.remove(), 4000);
            } finally {
              btn.disabled = false;
              btn.innerHTML = '<span class="flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>Send Message</span>';
            }
          }}
        >
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-[#CBD5E1] mb-1.5">Name</label>
              <input
                name="name"
                type="text"
                required
                maxLength={100}
                placeholder="Your name"
                className="w-full rounded-lg border border-[#1E293B] bg-[#0F172A]/60 px-4 py-3 text-sm text-[#E2E8F0] placeholder:text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#00A3A3]/50 focus:border-[#00A3A3] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#CBD5E1] mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                required
                maxLength={255}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#1E293B] bg-[#0F172A]/60 px-4 py-3 text-sm text-[#E2E8F0] placeholder:text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#00A3A3]/50 focus:border-[#00A3A3] transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#CBD5E1] mb-1.5">Message</label>
            <textarea
              name="message"
              required
              maxLength={1000}
              rows={4}
              placeholder="How can we help?"
              className="w-full rounded-lg border border-[#1E293B] bg-[#0F172A]/60 px-4 py-3 text-sm text-[#E2E8F0] placeholder:text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#00A3A3]/50 focus:border-[#00A3A3] transition-all resize-none"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 rounded-lg bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] text-white font-semibold text-sm tracking-wide hover:shadow-[0_0_30px_rgba(0,163,163,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send Message
          </button>
        </form>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#1E293B] py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <GlowLogoImage className="h-6" />
          <div className="flex items-center gap-6 text-sm text-[#64748B]">
            <Link to="/auth" className="hover:text-[#E2E8F0] transition-colors">Login</Link>
            <a href="mailto:hello@glowsignage.com" className="hover:text-[#E2E8F0] transition-colors">Contact</a>
            <span className="hover:text-[#E2E8F0] transition-colors cursor-pointer">Terms</span>
          </div>
          <p className="text-xs text-[#475569]">© {new Date().getFullYear()} Glow. All rights reserved.</p>
        </div>
      </footer>

      {/* ── Styles ── */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        /* Scroll reveal */
        .reveal-card {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .reveal-card.in-view {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Mesh gradient blobs ── */
        .mesh-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          will-change: transform;
        }
        .mesh-blob-1 {
          width: 600px; height: 600px;
          top: -15%; left: 5%;
          background: rgba(0,163,163,0.08);
          animation: mesh-drift-1 12s ease-in-out infinite alternate;
        }
        .mesh-blob-2 {
          width: 500px; height: 500px;
          top: 10%; right: 0%;
          background: rgba(59,130,246,0.07);
          animation: mesh-drift-2 14s ease-in-out infinite alternate;
        }
        .mesh-blob-3 {
          width: 400px; height: 400px;
          bottom: 5%; left: 25%;
          background: rgba(236,72,153,0.06);
          animation: mesh-drift-3 16s ease-in-out infinite alternate;
        }
        .mesh-blob-4 {
          width: 350px; height: 350px;
          top: 30%; left: 50%;
          background: rgba(249,115,22,0.04);
          animation: mesh-drift-4 18s ease-in-out infinite alternate;
        }
        @keyframes mesh-drift-1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(60px, 40px) scale(1.15); }
        }
        @keyframes mesh-drift-2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-50px, 50px) scale(1.1); }
        }
        @keyframes mesh-drift-3 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(40px, -30px) scale(1.2); }
        }
        @keyframes mesh-drift-4 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-30px, 20px) scale(1.1); }
        }

        /* ── Magnetic CTA ── */
        .magnetic-cta {
          box-shadow: 0 0 20px rgba(0,163,163,0.2);
          transition: box-shadow 0.3s ease, transform 0.15s ease;
        }
        .magnetic-cta:hover {
          box-shadow: 0 0 50px rgba(0,163,163,0.5), 0 0 100px rgba(59,130,246,0.2);
        }

        /* ── Glassmorphism card ── */
        .glass-card {
          background: rgba(15,23,42,0.5);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.06);
        }

        /* ── Rotating conic gradient border ── */
        @property --conic-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes conic-spin {
          to { --conic-angle: 360deg; }
        }
        .conic-border-wrapper {
          background: conic-gradient(
            from var(--conic-angle),
            #00A3A3, #3B82F6, #EC4899, #F97316, #00A3A3
          );
          animation: conic-spin 4s linear infinite;
          box-shadow: 0 0 40px rgba(0,163,163,0.15), 0 0 80px rgba(59,130,246,0.08);
        }
      `}</style>
    </div>
  );
};

export default Home;
