import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { GlowLogoImage } from "@/components/GlowHubLogo";
import { Utensils, Store, Hotel, Dumbbell, Tv, ArrowRight } from "lucide-react";
import StarField from "@/components/StarField";

const SOLUTIONS = [
  {
    title: "Restaurants & Cafés",
    description: "Mood-synced menus, daypart scheduling, and instant price updates. Full-featured digital signage designed for food service.",
    href: "/solutions/restaurants",
    icon: Utensils,
    color: "#F59E0B",
    tags: ["Menu boards", "Daily specials", "Mood sync"],
  },
  {
    title: "Retail Storefronts",
    description: "Synchronise shop window displays, schedule seasonal promotions, and manage multi-store signage from one dashboard.",
    href: "/solutions/retail",
    icon: Store,
    color: "#A855F7",
    tags: ["Window sync", "Campaign scheduling", "Analytics"],
  },
  {
    title: "Hotels & Hospitality",
    description: "Welcome screens, event boards, wayfinding, and conference room signage for hotels and hospitality venues.",
    href: "/solutions/hospitality",
    icon: Hotel,
    color: "#06B6D4",
    tags: ["Welcome screens", "Event boards", "Wayfinding"],
  },
  {
    title: "Gyms & Fitness Studios",
    description: "Display workout schedules, class timetables, and motivational content on gym TVs with cloud-synced digital signage.",
    href: "/use-cases/gym-workout-displays",
    icon: Dumbbell,
    color: "#3B82F6",
    tags: ["WOD boards", "Class timetables", "Multi-zone"],
  },
  {
    title: "Retail Window Sync",
    description: "Sync multiple retail window screens without a video wall controller — just Firesticks and Glow.",
    href: "/use-cases/retail-window-sync",
    icon: Tv,
    color: "#EC4899",
    tags: ["Multi-screen sync", "Proof-of-play", "Remote management"],
  },
];

export default function Solutions() {
  return (
    <div className="min-h-screen bg-[#0B1120] text-[#E2E8F0]">
      <SEOHead
        title="Solutions | Glow Digital Signage"
        description="Explore Glow digital signage solutions for restaurants, retail, hospitality, gyms and more. Affordable cloud-managed screens powered by Firestick."
      />

      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0B1120]/80 border-b border-[#1E293B]/50">
        <div className="flex items-center justify-between px-6 py-3.5 max-w-6xl mx-auto">
          <Link to="/home"><GlowLogoImage className="h-8" /></Link>
          <div className="flex items-center gap-4">
            <Link to="/home" className="text-sm text-[#94A3B8] hover:text-[#E2E8F0] transition-colors">Home</Link>
            <Link to="/use-cases" className="text-sm text-[#94A3B8] hover:text-[#E2E8F0] transition-colors">Use Cases</Link>
            <Link
              to="/auth"
              className="text-sm font-medium px-5 py-2 rounded-lg bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] text-[#0B1120] hover:shadow-[0_0_20px_rgba(0,163,163,0.35)] transition-all"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-20 pb-16 max-w-6xl mx-auto text-center">
        <StarField className="absolute inset-0 -z-10" />
        <p className="text-xs uppercase tracking-[0.25em] text-[#00A3A3] mb-4">Industry Solutions</p>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
          Digital Signage for <span className="bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] bg-clip-text text-transparent">Every Industry</span>
        </h1>
        <p className="text-[#94A3B8] max-w-2xl mx-auto text-lg">
          From restaurant menus to retail windows, Glow powers affordable cloud-managed digital signage with just a Firestick and any TV.
        </p>
      </section>

      {/* Solutions Grid */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SOLUTIONS.map((s) => (
            <Link
              key={s.href}
              to={s.href}
              className="group relative rounded-2xl border border-[#1E293B] bg-[#0F1A2E]/60 p-6 hover:border-[#334155] hover:bg-[#0F1A2E] transition-all duration-300"
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${s.color}20` }}
              >
                <s.icon className="w-6 h-6" style={{ color: s.color }} />
              </div>

              <h2 className="text-lg font-bold mb-2 group-hover:text-[#E2E8F0] transition-colors">{s.title}</h2>
              <p className="text-sm text-[#94A3B8] mb-4 leading-relaxed">{s.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {s.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-[#1E293B]/60 text-[#94A3B8]">{tag}</span>
                ))}
              </div>

              <span className="inline-flex items-center gap-1 text-sm font-medium text-[#00A3A3] group-hover:gap-2 transition-all">
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 max-w-3xl mx-auto text-center">
        <div className="rounded-2xl border border-[#1E293B] bg-[#0F1A2E]/60 p-10">
          <h2 className="text-2xl font-bold mb-3">Don't see your industry?</h2>
          <p className="text-[#94A3B8] mb-6">Glow works with any screen in any location. Browse all use cases or get started for free.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/use-cases" className="px-6 py-3 rounded-lg border border-[#1E293B] text-sm font-medium hover:bg-[#1E293B]/50 transition-colors">
              All Use Cases
            </Link>
            <Link to="/auth" className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] text-[#0B1120] text-sm font-medium hover:shadow-[0_0_20px_rgba(0,163,163,0.35)] transition-all">
              Get Started Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
