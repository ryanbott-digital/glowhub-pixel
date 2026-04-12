import { Link } from "react-router-dom";
import { Utensils, Store, Dumbbell, Tv, ArrowRight } from "lucide-react";

const ALL_SOLUTIONS = [
  {
    slug: "/solutions/restaurants",
    title: "Restaurant Menu Boards",
    desc: "Update prices instantly, schedule daily specials, and keep your digital menu fresh.",
    icon: Utensils,
    color: "#F97316",
  },
  {
    slug: "/solutions/retail",
    title: "Retail Window Displays",
    desc: "Synchronise every screen in your storefront into one seamless digital canvas.",
    icon: Store,
    color: "#EC4899",
  },
  {
    slug: "/use-cases/gym-workout-displays",
    title: "Gym & Fitness Displays",
    desc: "Rotate class schedules, WODs, and motivational content across gym TVs.",
    icon: Dumbbell,
    color: "#3B82F6",
  },
  {
    slug: "/use-cases/retail-window-sync",
    title: "Multi-Screen Sync",
    desc: "Group screens into sync zones — no HDMI splitters or video wall controllers needed.",
    icon: Tv,
    color: "#8B5CF6",
  },
];

interface Props {
  currentPath: string;
}

export function RelatedSolutions({ currentPath }: Props) {
  const related = ALL_SOLUTIONS.filter((s) => !currentPath.endsWith(s.slug.split("/").pop()!));

  if (related.length === 0) return null;

  return (
    <section className="px-6 py-16 max-w-5xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
        Explore More Solutions
      </h2>
      <p className="text-center text-sm text-[#94A3B8] mb-10">
        Glow powers digital signage across industries — see how others use it.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {related.slice(0, 3).map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.slug}
              to={s.slug}
              className="group rounded-2xl border border-[#1E293B] bg-[#0F172A]/60 p-6 hover:border-[#00A3A3]/40 transition-all duration-300"
            >
              <div
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4"
                style={{ background: `${s.color}15`, color: s.color }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold mb-1.5 group-hover:text-[#00E5CC] transition-colors">
                {s.title}
              </h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed mb-3">{s.desc}</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#00A3A3] group-hover:gap-2 transition-all">
                Learn more <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
