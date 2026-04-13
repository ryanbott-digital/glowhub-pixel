import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Check, X, ArrowRight, Zap, DollarSign, Tv, Radio, Wifi, Shield, Monitor } from "lucide-react";
import StarField from "@/components/StarField";

const COMPARE_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Glow vs Yodeck — Best Digital Signage Alternative 2026",
    description:
      "Side-by-side comparison of Glow and Yodeck digital signage software. See why businesses switch to Glow for lower cost and better features.",
    url: "https://glowhub-pixel.lovable.app/compare/yodeck-alternative",
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://glowhub-pixel.lovable.app/home" },
      { "@type": "ListItem", position: 2, name: "Compare", item: "https://glowhub-pixel.lovable.app/compare/yodeck-alternative" },
    ],
  },
];

const features = [
  { label: "Monthly price (5 screens)", glow: "$9", competitor: "$40+", icon: DollarSign },
  { label: "Millisecond multi-screen sync", glow: true, competitor: false, icon: Zap },
  { label: "UK & global live radio built-in", glow: true, competitor: false, icon: Radio },
  { label: "Offline content caching", glow: true, competitor: true, icon: Wifi },
  { label: "Firestick / Android TV native", glow: true, competitor: false, icon: Tv },
  { label: "No proprietary hardware required", glow: true, competitor: false, icon: Monitor },
  { label: "Instant remote triggers from phone", glow: true, competitor: false, icon: Zap },
  { label: "Screen health monitoring", glow: true, competitor: true, icon: Shield },
  { label: "No per-screen licensing", glow: true, competitor: false, icon: DollarSign },
  { label: "Free starter plan (1 screen)", glow: true, competitor: true, icon: DollarSign },
];

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === "string") return <span className="font-bold text-foreground">{value}</span>;
  return value ? (
    <Check className="w-5 h-5 text-[hsl(160,100%,45%)] mx-auto" />
  ) : (
    <X className="w-5 h-5 text-destructive/60 mx-auto" />
  );
}

export default function CompareYodeck() {
  return (
    <div className="min-h-screen bg-[hsl(220,50%,8%)] text-foreground relative overflow-hidden">
      <StarField />

      <SEOHead
        title="Glow vs Yodeck — Best Digital Signage Alternative 2026"
        description="Side-by-side comparison of Glow and Yodeck. Manage 5 screens for $9/mo vs $40+. No proprietary hardware needed — runs on any Firestick."
        canonical="/compare/yodeck-alternative"
        jsonLd={COMPARE_JSON_LD}
      />

      <nav className="relative z-20 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link to="/home" className="text-xl font-bold tracking-wider text-primary">Glow</Link>
        <Link to="/auth" className="text-sm px-5 py-2 rounded-full border border-primary/40 text-primary hover:bg-primary/10 transition">
          Get Started Free
        </Link>
      </nav>

      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <p className="text-xs font-mono tracking-[0.3em] text-primary/70 uppercase mb-4">[ 2026 COMPARISON ]</p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          Why Businesses Are Switching{" "}
          <span className="block text-primary">from Yodeck to Glow</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Yodeck locks you into their hardware. Glow runs on any $30 Firestick — with millisecond sync, live radio, and remote triggers from your phone.
        </p>
      </section>

      <section className="relative z-10 max-w-4xl mx-auto px-4 pb-20">
        <div className="rounded-2xl border border-border/20 bg-card/5 backdrop-blur-sm overflow-hidden">
          <div className="grid grid-cols-3 text-center text-sm font-semibold border-b border-border/20">
            <div className="p-4 text-muted-foreground">Feature</div>
            <div className="p-4 text-primary bg-primary/5">Glow</div>
            <div className="p-4 text-muted-foreground">Yodeck</div>
          </div>

          {features.map((f, i) => (
            <div
              key={f.label}
              className={`grid grid-cols-3 text-center text-sm items-center ${
                i % 2 === 0 ? "bg-card/[0.02]" : ""
              } ${i < features.length - 1 ? "border-b border-border/10" : ""}`}
            >
              <div className="p-4 text-left flex items-center gap-2 text-muted-foreground">
                <f.icon className="w-4 h-4 text-primary/60 shrink-0" />
                {f.label}
              </div>
              <div className="p-4 bg-primary/5"><Cell value={f.glow} /></div>
              <div className="p-4"><Cell value={f.competitor} /></div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Ready to save <span className="text-[hsl(160,100%,45%)]">$31/mo</span> on 5 screens?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Start free with 1 screen. Upgrade to Pro for $9/mo when you're ready — no contracts, no proprietary hardware, cancel anytime.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition shadow-lg shadow-primary/20"
          >
            Start Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/10 py-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Glow Digital Signage. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link to="/home" className="hover:text-primary transition">Home</Link>
          <Link to="/terms" className="hover:text-primary transition">Terms</Link>
          <Link to="/download" className="hover:text-primary transition">Download</Link>
        </div>
      </footer>
    </div>
  );
}
