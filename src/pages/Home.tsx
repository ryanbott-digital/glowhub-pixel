import { Link } from "react-router-dom";
import { GlowHubLogo } from "@/components/GlowHubLogo";
import { Check, Wifi, WifiOff, Smartphone, Activity } from "lucide-react";

const Home = () => {
  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#E2E8F0] font-sans overflow-x-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <GlowHubLogo size="md" />
        <Link
          to="/auth"
          className="text-sm font-medium px-5 py-2 rounded-lg border border-[#1E293B] hover:border-[#00A3A3]/50 transition-colors"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center text-center px-6 pt-16 pb-24 max-w-5xl mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
          Your Content. Any Screen.{" "}
          <span className="bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] bg-clip-text text-transparent">
            Pure Glow.
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-[#94A3B8] max-w-2xl mb-10 leading-relaxed">
          The most reliable, affordable way to turn any Firestick or Android TV
          into professional digital signage.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link
            to="/auth"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-semibold text-[#0B1120] bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] hover:shadow-[0_0_24px_rgba(0,163,163,0.4)] transition-shadow"
          >
            Start Glowing for Free
          </Link>
          <button
            onClick={scrollToFeatures}
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-semibold border border-[#1E293B] hover:border-[#00A3A3]/50 transition-colors"
          >
            See how it works
          </button>
        </div>

        {/* TV Mockup */}
        <div className="relative w-full max-w-xl mx-auto">
          <div className="radiant-glow rounded-2xl">
            <div className="bg-[#1E293B] rounded-2xl p-3">
              <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-[#00A3A3]/30 via-[#3B82F6]/20 to-[#EC4899]/20 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl font-bold tracking-widest bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] bg-clip-text text-transparent">
                  GLOW
                </span>
              </div>
            </div>
            <div className="mx-auto w-24 h-3 bg-[#1E293B] rounded-b-lg" />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-24 max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight mb-4">
          Disruptive Pricing
        </h2>
        <p className="text-[#94A3B8] text-center mb-14 text-lg">
          No hidden fees. No per-screen surprises.
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Starter */}
          <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A]/60 backdrop-blur-xl p-8 flex flex-col">
            <h3 className="text-xl font-semibold mb-1">The Starter</h3>
            <p className="text-sm text-[#94A3B8] mb-6">Free Forever</p>
            <div className="text-4xl font-bold mb-8">
              $0<span className="text-base font-normal text-[#94A3B8]">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {["1 Screen", "Basic Scheduling", "500MB Storage", "'Powered by GLOW' watermark"].map(
                (f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#CBD5E1]">
                    <Check className="w-4 h-4 mt-0.5 text-[#00A3A3] shrink-0" />
                    {f}
                  </li>
                )
              )}
            </ul>
            <Link
              to="/auth"
              className="block text-center py-3 rounded-xl font-semibold border border-[#1E293B] hover:border-[#00A3A3]/50 transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Pro */}
          <div className="relative rounded-2xl border border-[#00A3A3]/40 bg-[#0F172A]/60 backdrop-blur-xl p-8 flex flex-col shadow-[0_0_40px_rgba(0,163,163,0.12)]">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] text-[#0B1120]">
              Recommended
            </span>
            <h3 className="text-xl font-semibold mb-1">The Pro Glow</h3>
            <p className="text-sm text-[#94A3B8] mb-6">For serious signage</p>
            <div className="text-4xl font-bold mb-2">
              $9<span className="text-base font-normal text-[#94A3B8]">/mo</span>
            </div>
            <p className="text-sm font-bold text-[#00A3A3] mb-8">
              Covers up to 5 screens
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "No Watermarks",
                "Offline Mode (Cache)",
                "Screen Health Monitoring",
                "5GB Storage",
                "Priority Support",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-[#CBD5E1]">
                  <Check className="w-4 h-4 mt-0.5 text-[#00A3A3] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/auth"
              className="block text-center py-3 rounded-xl font-semibold bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] text-[#0B1120] hover:shadow-[0_0_24px_rgba(0,163,163,0.4)] transition-shadow"
            >
              Go Pro
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24 max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight mb-4">
          The Elements
        </h2>
        <p className="text-[#94A3B8] text-center mb-14 text-lg">
          Everything you need. Nothing you don't.
        </p>

        <div className="grid sm:grid-cols-3 gap-8">
          {[
            {
              icon: <WifiOff className="w-8 h-8" />,
              title: "Reliability",
              desc: "'Offline-First' technology. Your content keeps playing even if the Wi-Fi drops.",
            },
            {
              icon: <Smartphone className="w-8 h-8" />,
              title: "Simplicity",
              desc: "Use the 'Downloader' app to install on any Firestick in under 60 seconds.",
            },
            {
              icon: <Activity className="w-8 h-8" />,
              title: "Intelligence",
              desc: "Real-time 'Health Heartbeat' tells you exactly which screens are online from your dashboard.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-[#1E293B] bg-[#0F172A]/60 backdrop-blur-xl p-8 text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#00A3A3]/10 text-[#00A3A3] mb-5">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1E293B] py-10 text-center text-sm text-[#64748B]">
        <GlowHubLogo size="sm" />
        <p className="mt-4">© {new Date().getFullYear()} Glow. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
