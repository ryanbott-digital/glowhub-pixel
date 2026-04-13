import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight } from "lucide-react";
import StarField from "@/components/StarField";

const COMPARE_INDEX_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Glow vs Competitors — Digital Signage Comparison Hub",
    description: "Compare Glow to OptiSigns, ScreenCloud, and Yodeck. See why businesses choose Glow for affordable Firestick digital signage.",
    url: "https://glowhub-pixel.lovable.app/compare",
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://glowhub-pixel.lovable.app/home" },
      { "@type": "ListItem", position: 2, name: "Compare", item: "https://glowhub-pixel.lovable.app/compare" },
    ],
  },
];

const competitors = [
  {
    name: "OptiSigns",
    slug: "optisigns-alternative",
    price: "~$75/mo",
    glowPrice: "$9/mo",
    tagline: "Stop paying per screen. Get 5 screens with 60fps sync for 88% less.",
    highlights: ["Per-screen licensing", "Standard web-view sync", "Pushes $80+ players"],
  },
  {
    name: "ScreenCloud",
    slug: "screencloud-alternative",
    price: "~$100/mo",
    glowPrice: "$9/mo",
    tagline: "ScreenCloud charges per screen. Glow gives you 5 for a flat $9/mo.",
    highlights: ["Per-screen pricing", "No Firestick-native app", "No built-in radio"],
  },
  {
    name: "Yodeck",
    slug: "yodeck-alternative",
    price: "~$40/mo",
    glowPrice: "$9/mo",
    tagline: "Yodeck locks you into proprietary hardware. Glow runs on any $30 Firestick.",
    highlights: ["Proprietary hardware required", "No instant remote triggers", "No millisecond sync"],
  },
];

export default function CompareIndex() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <StarField />

      <SEOHead
        title="Glow vs Competitors — Digital Signage Comparison Hub"
        description="Compare Glow to OptiSigns, ScreenCloud, and Yodeck. See why businesses choose Glow for affordable Firestick digital signage at $9/mo."
        canonical="/compare"
        jsonLd={COMPARE_INDEX_JSON_LD}
      />

      <nav className="relative z-20 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link to="/home" className="text-xl font-bold tracking-wider text-primary">Glow</Link>
        <Link to="/auth" className="text-sm px-5 py-2 rounded-full border border-primary/40 text-primary hover:bg-primary/10 transition">
          Get Started Free
        </Link>
      </nav>

      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-16 sm:pt-24 pb-12 text-center">
        <p className="text-xs font-mono tracking-[0.3em] text-primary/70 uppercase mb-6">[ COMPARISON HUB ]</p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
          How Glow Compares to{" "}
          <span className="text-primary">the Competition</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          Side-by-side breakdowns of pricing, features, and performance. See why businesses are switching to Glow for their Firestick digital signage.
        </p>
      </section>

      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <div className="grid gap-6">
          {competitors.map((c) => (
            <Link
              key={c.slug}
              to={`/compare/${c.slug}`}
              className="group relative rounded-2xl border border-border/20 bg-card/30 backdrop-blur-[24px] p-6 sm:p-8 hover:border-primary/40 transition-all duration-300 overflow-hidden block"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(400px_circle_at_50%_0%,hsl(var(--primary)/0.1),transparent_70%)]" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold">Glow vs {c.name}</h2>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {c.glowPrice} vs {c.price}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{c.tagline}</p>
                  <div className="flex flex-wrap gap-2">
                    {c.highlights.map((h) => (
                      <span key={h} className="text-xs px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive/80 border border-destructive/10">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
                  Read Comparison <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/10 py-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Glow Digital Signage. All rights reserved.</p>
        <div className="flex flex-wrap justify-center gap-4 mt-2">
          <Link to="/home" className="hover:text-primary transition">Home</Link>
          <Link to="/terms" className="hover:text-primary transition">Terms</Link>
          <Link to="/download" className="hover:text-primary transition">Download</Link>
        </div>
      </footer>
    </div>
  );
}
