import { Link } from "react-router-dom";
import { GlowLogoImage } from "@/components/GlowHubLogo";
import { Check, WifiOff, Activity, CalendarClock, UserPlus, Download, Tv } from "lucide-react";
import { useEffect, useRef } from "react";

/** Hook: observes elements with data-animate and adds "in-view" class on scroll */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = root.querySelectorAll("[data-animate]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("in-view");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);
  return ref;
}

const Home = () => {
  const wrapperRef = useScrollReveal();

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

      {/* ── Hero ── */}
      <section className="relative px-6 pt-20 sm:pt-28 pb-28 max-w-6xl mx-auto">
        {/* Radiant background blurs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] rounded-full bg-[#00A3A3]/[0.07] blur-[120px]" />
          <div className="absolute top-[0%] right-[5%] w-[400px] h-[400px] rounded-full bg-[#3B82F6]/[0.06] blur-[100px]" />
          <div className="absolute bottom-[10%] left-[30%] w-[350px] h-[350px] rounded-full bg-[#EC4899]/[0.05] blur-[110px]" />
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left — Copy */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#1E293B] bg-[#0F172A]/60 backdrop-blur-sm text-xs text-[#94A3B8] mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A3A3] animate-pulse" />
              Digital signage made simple
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight leading-[1.05] mb-6 uppercase">
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
                to="/auth"
                className="group inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-semibold text-[#0B1120] bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] hover:shadow-[0_0_30px_rgba(0,163,163,0.45)] transition-all duration-300"
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
              {/* Shadow underneath */}
              <div className="absolute -bottom-6 left-[10%] right-[10%] h-12 bg-[#00A3A3]/10 blur-[40px] rounded-full" />

              <div className="radiant-glow rounded-2xl">
                <div className="bg-[#131C2E] rounded-2xl p-2.5 border border-[#1E293B]/60 shadow-2xl">
                  <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-[#00A3A3]/20 via-[#3B82F6]/15 to-[#EC4899]/10 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(0,163,163,0.15),transparent_60%)]" />
                    <GlowLogoImage className="h-14 sm:h-20 relative z-10 drop-shadow-[0_0_20px_rgba(0,163,163,0.3)]" />
                  </div>
                </div>
                {/* Stand */}
                <div className="mx-auto w-20 h-3 bg-[#131C2E] rounded-b-lg border-x border-b border-[#1E293B]/60" />
                <div className="mx-auto w-32 h-1.5 bg-[#131C2E] rounded-b-lg border-x border-b border-[#1E293B]/40 mt-[-1px]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Process: 3 Simple Steps ── */}
      <section id="process" className="px-6 py-24 max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight mb-3">
          3 Simple Steps
        </h2>
        <p className="text-[#94A3B8] text-center mb-16 text-base max-w-lg mx-auto">
          Up and running in under 60 seconds.
        </p>

        <div className="grid sm:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop only) */}
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
            {
              icon: <WifiOff className="w-7 h-7" />,
              title: "Offline-First",
              desc: "Content is cached locally. Your screens keep playing even when the internet drops.",
              accent: "#00A3A3",
            },
            {
              icon: <Activity className="w-7 h-7" />,
              title: "Heartbeat Monitoring",
              desc: "Real-time health pings tell you exactly which screens are online from your dashboard.",
              accent: "#3B82F6",
            },
            {
              icon: <CalendarClock className="w-7 h-7" />,
              title: "Easy Scheduling",
              desc: "Set weekly time-slot schedules per screen. The right playlist plays at the right time.",
              accent: "#EC4899",
            },
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

      {/* ── Pricing ── */}
      <section id="pricing" className="px-6 py-24 max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight mb-3">
          Simple, Honest Pricing
        </h2>
        <p className="text-[#94A3B8] text-center mb-16 text-base max-w-lg mx-auto">
          No hidden fees. No per-screen surprises. Start free, upgrade when ready.
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Starter */}
          <div
            data-animate
            className="reveal-card rounded-2xl border border-[#1E293B] bg-[#0F172A]/60 backdrop-blur-xl p-8 flex flex-col hover:border-[#1E293B]/80 transition-all duration-300"
          >
            <h3 className="text-xl font-semibold mb-1">The Starter</h3>
            <p className="text-sm text-[#94A3B8] mb-6">Free forever</p>
            <div className="text-5xl font-extrabold mb-8">
              $0<span className="text-lg font-normal text-[#94A3B8]">/mo</span>
            </div>
            <ul className="space-y-3.5 mb-8 flex-1">
              {["1 Screen", "Basic Scheduling", "500MB Storage", "'Powered by GLOW' watermark"].map(
                (f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#CBD5E1]">
                    <Check className="w-4 h-4 mt-0.5 text-[#00A3A3] shrink-0" />
                    {f}
                  </li>
                )
              )}
            </ul>
            <Link
              to="/auth"
              className="block text-center py-3 rounded-xl font-semibold border border-[#1E293B] hover:border-[#00A3A3]/50 hover:shadow-[0_0_16px_rgba(0,163,163,0.1)] transition-all duration-300"
            >
              Get Started
            </Link>
          </div>

          {/* Pro Glow — animated glowing border */}
          <div
            data-animate
            className="reveal-card relative rounded-2xl p-8 flex flex-col transition-all duration-300 pro-glow-card"
            style={{ transitionDelay: "120ms" }}
          >
            {/* Best Value badge */}
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] text-[#0B1120] shadow-[0_0_20px_rgba(0,163,163,0.3)]">
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
              {[
                "No Watermarks",
                "Offline Mode (Cache)",
                "Screen Health Monitoring",
                "5GB Storage",
                "Priority Support",
              ].map((f) => (
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

      {/* Inline styles for animations */}
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

        /* Animated glowing border for Pro card */
        @keyframes border-glow {
          0%, 100% {
            border-color: rgba(0,163,163,0.4);
            box-shadow: 0 0 30px rgba(0,163,163,0.1), 0 0 60px rgba(59,130,246,0.05);
          }
          50% {
            border-color: rgba(59,130,246,0.5);
            box-shadow: 0 0 40px rgba(0,163,163,0.18), 0 0 80px rgba(59,130,246,0.1);
          }
        }
        .pro-glow-card {
          border: 1px solid rgba(0,163,163,0.4);
          background: rgba(15,23,42,0.6);
          backdrop-filter: blur(16px);
          animation: border-glow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Home;
