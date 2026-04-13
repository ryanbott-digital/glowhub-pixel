import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Check, X, ArrowRight, Zap, DollarSign, Tv, Radio, Wifi, Shield } from "lucide-react";
import StarField from "@/components/StarField";

const COMPARE_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Glow vs OptiSigns — Best Digital Signage Alternative 2026",
    description:
      "Side-by-side comparison of Glow and OptiSigns digital signage software. See why businesses switch to Glow for 80% lower cost.",
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

const features = [
  { label: "Monthly price (5 screens)", glow: "$9", competitor: "$75+", icon: DollarSign },
  { label: "Millisecond multi-screen sync", glow: true, competitor: false, icon: Zap },
  { label: "UK & global live radio built-in", glow: true, competitor: false, icon: Radio },
  { label: "Offline content caching", glow: true, competitor: true, icon: Wifi },
  { label: "Firestick / Android TV native", glow: true, competitor: true, icon: Tv },
  { label: "Instant remote triggers from phone", glow: true, competitor: false, icon: Zap },
  { label: "Screen health monitoring", glow: true, competitor: true, icon: Shield },
  { label: "No per-screen licensing", glow: true, competitor: false, icon: DollarSign },
  { label: "Free starter plan (1 screen)", glow: true, competitor: false, icon: DollarSign },
];

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === "string") return <span className="font-bold text-foreground">{value}</span>;
  return value ? (
    <Check className="w-5 h-5 text-[#00E5A0] mx-auto" />
  ) : (
    <X className="w-5 h-5 text-red-400/60 mx-auto" />
  );
}

export default function CompareOptiSigns() {
  return (
    <div className="min-h-screen bg-[#0B1120] text-foreground relative overflow-hidden">
      <StarField />

      <SEOHead
        title="Glow vs OptiSigns — Best Digital Signage Alternative 2026"
        description="Side-by-side comparison of Glow and OptiSigns. Manage 5 screens for $9/mo vs $75+. Millisecond sync, UK radio, instant triggers."
        canonical="/compare/optisigns-alternative"
        jsonLd={COMPARE_JSON_LD}
      />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link to="/home" className="text-xl font-bold tracking-wider text-[#00A3A3]">
          Glow
        </Link>
        <Link
          to="/auth"
          className="text-sm px-5 py-2 rounded-full border border-[#00A3A3]/40 text-[#00A3A3] hover:bg-[#00A3A3]/10 transition"
        >
          Get Started Free
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <p className="text-xs font-mono tracking-[0.3em] text-[#00A3A3]/70 uppercase mb-4">
          [ 2026 COMPARISON ]
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          Why Businesses Are Switching{" "}
          <span className="block text-[#00A3A3]">from OptiSigns to Glow</span>
        </h1>
        <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Same powerful features. 80% lower cost. Built for Firestick & Android TV with millisecond sync, live UK radio, and instant remote triggers.
        </p>
      </section>

      {/* Comparison Table */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 pb-20">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-3 text-center text-sm font-semibold border-b border-white/10">
            <div className="p-4 text-[#94A3B8]">Feature</div>
            <div className="p-4 text-[#00A3A3] bg-[#00A3A3]/5">Glow</div>
            <div className="p-4 text-[#94A3B8]">OptiSigns</div>
          </div>

          {/* Rows */}
          {features.map((f, i) => (
            <div
              key={f.label}
              className={`grid grid-cols-3 text-center text-sm items-center ${
                i % 2 === 0 ? "bg-white/[0.01]" : ""
              } ${i < features.length - 1 ? "border-b border-white/5" : ""}`}
            >
              <div className="p-4 text-left flex items-center gap-2 text-[#CBD5E1]">
                <f.icon className="w-4 h-4 text-[#00A3A3]/60 shrink-0" />
                {f.label}
              </div>
              <div className="p-4 bg-[#00A3A3]/5">
                <Cell value={f.glow} />
              </div>
              <div className="p-4">
                <Cell value={f.competitor} />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Ready to save <span className="text-[#00E5A0]">$66/mo</span> on 5 screens?
          </h2>
          <p className="text-[#94A3B8] mb-8 max-w-md mx-auto">
            Start free with 1 screen. Upgrade to Pro for $9/mo when you're ready — no contracts, cancel anytime.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#00A3A3] text-white font-semibold hover:bg-[#00A3A3]/90 transition shadow-lg shadow-[#00A3A3]/20"
          >
            Start Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-[#64748B]">
        <p>© {new Date().getFullYear()} Glow Digital Signage. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link to="/home" className="hover:text-[#00A3A3] transition">Home</Link>
          <Link to="/terms" className="hover:text-[#00A3A3] transition">Terms</Link>
          <Link to="/download" className="hover:text-[#00A3A3] transition">Download</Link>
        </div>
      </footer>
    </div>
  );
}
