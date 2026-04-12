import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { GlowLogoImage } from "@/components/GlowHubLogo";
import { Check, ArrowRight, Tv, Utensils, Clock, Wifi, WifiOff, BarChart3, Palette } from "lucide-react";
import { RelatedSolutions } from "@/components/RelatedSolutions";

const USE_CASES = {
  "restaurant-digital-menu-boards": {
    title: "Restaurant Digital Menu Boards | Glow",
    description: "Turn any Firestick into a digital menu board. Update prices remotely, schedule daily specials, and keep your menu fresh — no expensive hardware needed.",
    h1: "Digital Menu Boards for Restaurants & Cafés",
    subtitle: "Update your menu in real-time from anywhere. Glow turns a £30 Firestick into a professional menu display.",
    icon: Utensils,
    heroColor: "#F97316",
    benefits: [
      { icon: Clock, title: "Update Prices in Seconds", desc: "Change a price or add a daily special from your phone. It appears on screen instantly — no USB sticks, no reprinting." },
      { icon: Wifi, title: "Offline-Proof Menus", desc: "Content is cached locally on the Firestick. Even if your Wi-Fi drops during a lunch rush, the menu keeps displaying." },
      { icon: BarChart3, title: "Schedule Breakfast, Lunch & Dinner", desc: "Set time-based schedules so your breakfast menu switches to lunch automatically at 11am. No staff intervention needed." },
      { icon: Palette, title: "Brand It Your Way", desc: "Upload your own images, videos, and branded layouts. Pro users get zero watermarks for a clean, professional look." },
    ],
    faq: [
      { q: "What hardware do I need for a restaurant digital menu?", a: "Just an Amazon Fire TV Stick (£30) and any TV or monitor. No special signage displays or media players required." },
      { q: "Can I update my menu remotely?", a: "Yes. Log in to the Glow dashboard from any device, change your playlist content, and it syncs to your screens instantly." },
      { q: "How do I display different menus at different times?", a: "Use Glow's weekly schedule feature to assign specific playlists to time slots. Your breakfast menu can auto-switch to lunch at any time you set." },
    ],
  },
  "gym-workout-displays": {
    title: "Gym & Fitness Workout Displays | Glow",
    description: "Display workout schedules, class timetables, and motivational content on gym TVs. Cloud-synced digital signage for fitness studios using Firestick.",
    h1: "Workout Displays for Gyms & Fitness Studios",
    subtitle: "Keep members informed with live class schedules, workout-of-the-day boards, and motivational loops — all managed from your phone.",
    icon: BarChart3,
    heroColor: "#3B82F6",
    benefits: [
      { icon: Clock, title: "Auto-Rotating Class Schedules", desc: "Upload your timetable and set it to rotate throughout the day. Morning yoga → HIIT → evening spin, all automatic." },
      { icon: Tv, title: "Multi-Screen Zones", desc: "Different content for different areas: WOD board in the CrossFit zone, class schedule in reception, promo videos in the lobby." },
      { icon: WifiOff, title: "Keeps Playing Offline", desc: "Cached content means your gym TVs never go blank — even during internet outages." },
      { icon: Palette, title: "Branded Motivational Content", desc: "Display your gym's branding, member shoutouts, and motivational quotes alongside schedules." },
    ],
    faq: [
      { q: "How do I display workout-of-the-day on a gym TV?", a: "Create a playlist in Glow with your WOD image or video, assign it to the gym screen, and update it each morning from the app." },
      { q: "Can I show different content on different gym TVs?", a: "Yes. Each screen can have its own playlist and schedule. Show classes in reception and workouts in the training area." },
      { q: "What's the cheapest way to add digital signage to my gym?", a: "A Fire TV Stick (£30) plus any TV you already have. Glow's free plan covers 1 screen, and Pro at $9/mo covers up to 5." },
    ],
  },
  "retail-window-sync": {
    title: "Retail Window Display Sync | Glow",
    description: "Sync multiple retail window screens with cloud-managed digital signage. No video wall controller needed — just Firesticks and Glow.",
    h1: "Synced Window Displays for Retail Stores",
    subtitle: "Turn your shop windows into a synchronised digital canvas. Manage multiple screens from one dashboard without expensive video wall controllers.",
    icon: Tv,
    heroColor: "#EC4899",
    benefits: [
      { icon: Tv, title: "Multi-Screen Sync Without Controllers", desc: "Group 2, 3, or more screens into a sync group. They play the same content simultaneously — no HDMI splitters or video wall boxes." },
      { icon: Clock, title: "Schedule Promotions by Day & Time", desc: "Weekend sale content on Saturday, new arrivals on Monday morning. Set it once, it runs automatically." },
      { icon: Wifi, title: "Remote Management", desc: "Update your window displays from home, another branch, or your phone. No need to be physically in-store." },
      { icon: BarChart3, title: "Proof-of-Play Analytics", desc: "Track exactly what content played on which screen and when. Perfect for proving campaign compliance to brands." },
    ],
    faq: [
      { q: "How to sync two TVs without a video wall controller?", a: "Use Glow's sync groups feature. Add both screens to a group, assign a playlist, and they play in perfect sync — no hardware controller needed." },
      { q: "Can I manage retail screens across multiple stores?", a: "Yes. All screens appear in one dashboard. Assign different playlists to different locations and manage everything centrally." },
      { q: "What's the cost compared to traditional video wall systems?", a: "A traditional video wall controller costs £500-£2000+. With Glow, each screen just needs a £30 Firestick. Pro plan is $9/mo for up to 5 screens." },
    ],
  },
};

export default function UseCase() {
  const slug = window.location.pathname.split("/use-cases/")[1]?.replace(/\/$/, "");
  const data = slug ? USE_CASES[slug as keyof typeof USE_CASES] : null;

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-[#E2E8F0] flex flex-col">
        <SEOHead
          title="Use Cases — Pro Digital Signage Software"
          description="Discover how Glow powers digital signage for restaurants, gyms, retail, and more. Cloud-synced screen manager for Firestick and Android TV."
          canonical="/use-cases"
        />
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0B1120]/80 border-b border-[#1E293B]/50">
          <div className="flex items-center justify-between px-6 py-3.5 max-w-6xl mx-auto">
            <Link to="/home"><GlowLogoImage className="h-8" /></Link>
            <Link to="/auth" className="text-sm font-medium px-5 py-2 rounded-lg bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] text-[#0B1120]">Login</Link>
          </div>
        </nav>

        <main className="flex-1 px-6 py-20 max-w-5xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">Use Cases</h1>
          <p className="text-[#94A3B8] text-lg mb-12 max-w-2xl">See how businesses use Glow to power their screens.</p>

          <div className="grid sm:grid-cols-3 gap-6">
            {Object.entries(USE_CASES).map(([slug, uc]) => {
              const Icon = uc.icon;
              return (
                <Link
                  key={slug}
                  to={`/use-cases/${slug}`}
                  className="group rounded-2xl border border-[#1E293B] bg-[#0F172A]/60 p-7 hover:border-[#00A3A3]/40 hover:shadow-[0_0_30px_rgba(0,163,163,0.1)] transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${uc.heroColor}15`, color: uc.heroColor }}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-semibold mb-2">{uc.h1.replace(/for /, "— ")}</h2>
                  <p className="text-sm text-[#94A3B8] leading-relaxed line-clamp-3">{uc.description}</p>
                  <span className="inline-flex items-center gap-1 mt-4 text-sm text-[#00A3A3] font-medium group-hover:gap-2 transition-all">
                    Read more <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        </main>

        <footer className="border-t border-[#1E293B] py-8 px-6 text-center text-xs text-[#475569]">
          © {new Date().getFullYear()} Glow. All rights reserved.
        </footer>
      </div>
    );
  }

  const Icon = data.icon;

  const useCaseJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#E2E8F0]">
      <SEOHead
        title={data.title}
        description={data.description}
        canonical={`/use-cases/${slug}`}
        jsonLd={useCaseJsonLd}
      />

      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0B1120]/80 border-b border-[#1E293B]/50">
        <div className="flex items-center justify-between px-6 py-3.5 max-w-6xl mx-auto">
          <Link to="/home"><GlowLogoImage className="h-8" /></Link>
          <div className="flex items-center gap-4">
            <Link to="/use-cases" className="hidden sm:block text-sm text-[#94A3B8] hover:text-[#E2E8F0] transition-colors">All Use Cases</Link>
            <Link to="/auth" className="text-sm font-medium px-5 py-2 rounded-lg bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] text-[#0B1120]">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative px-6 pt-20 pb-16 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6" style={{ background: `${data.heroColor}15`, color: data.heroColor }}>
          <Icon className="w-8 h-8" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-[1.1]">
          {data.h1}
        </h1>
        <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
          {data.subtitle}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/auth" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] text-[#0B1120] hover:shadow-[0_0_30px_rgba(0,163,163,0.4)] transition-all">
            Start Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/home#pricing" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold border border-[#1E293B] hover:border-[#00A3A3]/40 transition-all">
            See Pricing
          </Link>
        </div>
      </header>

      {/* Benefits */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Why Glow?</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {data.benefits.map((b, i) => {
            const BIcon = b.icon;
            return (
              <div key={i} className="rounded-2xl border border-[#1E293B] bg-[#0F172A]/60 p-7 hover:border-[#00A3A3]/30 transition-all duration-300">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 bg-[#00A3A3]/10 text-[#00A3A3]">
                  <BIcon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{b.title}</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Pricing Callout */}
      <section className="px-6 py-16 max-w-3xl mx-auto text-center">
        <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A]/60 p-10">
          <h2 className="text-2xl font-bold mb-3">Ready to get started?</h2>
          <p className="text-[#94A3B8] mb-2">Free plan: 1 screen, no credit card.</p>
          <p className="text-[#94A3B8] mb-6">Pro plan: <span className="text-[#00A3A3] font-semibold">$9/mo</span> for up to 5 screens with offline caching and no watermarks.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/auth" className="px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] text-[#0B1120]">
              Start Free
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {data.faq.map((f, i) => (
            <details key={i} className="group rounded-xl border border-[#1E293B] bg-[#0F172A]/60 overflow-hidden">
              <summary className="cursor-pointer px-6 py-5 text-[#E2E8F0] font-medium text-sm flex items-center justify-between hover:text-[#00A3A3] transition-colors">
                {f.q}
                <ArrowRight className="w-4 h-4 rotate-90 group-open:rotate-[270deg] transition-transform text-[#64748B]" />
              </summary>
              <div className="px-6 pb-5 text-sm text-[#94A3B8] leading-relaxed">
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      <RelatedSolutions currentPath={window.location.pathname} />

      {/* Footer */}
      <footer className="border-t border-[#1E293B] py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <GlowLogoImage className="h-6" />
          <div className="flex items-center gap-6 text-sm text-[#64748B]">
            <Link to="/home" className="hover:text-[#E2E8F0] transition-colors">Home</Link>
            <Link to="/use-cases" className="hover:text-[#E2E8F0] transition-colors">Use Cases</Link>
            <Link to="/auth" className="hover:text-[#E2E8F0] transition-colors">Login</Link>
            <Link to="/terms" className="hover:text-[#E2E8F0] transition-colors">Terms</Link>
          </div>
          <p className="text-xs text-[#475569]">© {new Date().getFullYear()} Glow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
