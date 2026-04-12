import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, X, Monitor, Upload, ListVideo, Link2, PartyPopper, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Step {
  label: string;
  complete: boolean;
  cta: string;
  route: string;
  icon: React.ReactNode;
}

interface OnboardingChecklistProps {
  screens: any[];
  playlists: any[];
  mediaCount: number;
}

const DISMISS_KEY = "glowhub_onboarding_dismissed";

export function OnboardingChecklist({ screens, playlists, mediaCount }: OnboardingChecklistProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "true");

  const steps: Step[] = [
    { label: "Link a Display", complete: screens.length > 0, cta: "Pair Now", route: "/screens", icon: <Monitor className="h-3.5 w-3.5" /> },
    { label: "Upload Media", complete: mediaCount > 0, cta: "Go to Media", route: "/media", icon: <Upload className="h-3.5 w-3.5" /> },
    { label: "Build a Playlist", complete: playlists.length > 0, cta: "Create", route: "/playlists", icon: <ListVideo className="h-3.5 w-3.5" /> },
    { label: "Assign to Screen", complete: screens.some(s => s.current_playlist_id), cta: "Assign", route: "/screens", icon: <Link2 className="h-3.5 w-3.5" /> },
  ];

  const doneCount = steps.filter(s => s.complete).length;
  const allDone = doneCount === steps.length;
  const progress = (doneCount / steps.length) * 100;

  // Auto-dismiss once all steps are completed so it never reappears
  useEffect(() => {
    if (allDone && !dismissed) {
      localStorage.setItem(DISMISS_KEY, "true");
      setDismissed(true);
    }
  }, [allDone, dismissed]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="glass glass-spotlight rounded-2xl overflow-hidden animate-scale-in relative">
      {/* Glowing progress bar */}
      <div className="h-0.5 w-full bg-muted/20">
        <div
          className="h-full transition-all duration-1000 ease-out rounded-r-full"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, hsl(180, 100%, 45%), hsl(220, 80%, 55%))",
            boxShadow: "0 0 16px hsla(180, 100%, 45%, 0.5), 0 0 40px hsla(180, 100%, 45%, 0.2)",
          }}
        />
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-[11px] font-semibold text-foreground tracking-[0.2em] uppercase">System Boot</h3>
            <span className="text-[10px] text-muted-foreground tracking-wider font-mono">{doneCount}/{steps.length}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={handleDismiss}>
            <X className="h-3 w-3" />
          </Button>
        </div>

        {allDone ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
              background: "hsla(180, 100%, 45%, 0.1)",
              boxShadow: "0 0 30px hsla(180, 100%, 45%, 0.2)",
            }}>
              <PartyPopper className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground tracking-wide">System Online 🎉</p>
            <p className="text-xs text-muted-foreground">All subsystems initialized. Ready to broadcast.</p>
            <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-muted-foreground text-xs tracking-wider">
              Dismiss
            </Button>
          </div>
        ) : (
          <div className="space-y-1.5 stagger-in">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 transition-all duration-300 ${
                  step.complete
                    ? "neon-complete bg-primary/5"
                    : "hover:bg-muted/10 border border-transparent hover:border-primary/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  {step.complete ? (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" style={{
                      filter: "drop-shadow(0 0 6px hsla(180, 100%, 45%, 0.5))"
                    }} />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/25 shrink-0" />
                  )}
                  <span className={`text-sm tracking-wide ${
                    step.complete
                      ? "text-muted-foreground line-through"
                      : "text-foreground font-medium"
                  }`}>
                    {step.label}
                  </span>
                </div>
                {!step.complete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] text-primary hover:text-primary gap-1.5 h-7 tracking-widest uppercase font-semibold"
                    onClick={() => navigate(step.route)}
                  >
                    {step.icon}
                    {step.cta}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
