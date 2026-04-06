import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, X, Monitor, Upload, ListVideo, Link2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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

  if (dismissed) return null;

  const steps: Step[] = [
    { label: "Pair a Screen", complete: screens.length > 0, cta: "Pair Now", route: "/screens", icon: <Monitor className="h-4 w-4" /> },
    { label: "Upload Media", complete: mediaCount > 0, cta: "Go to Media", route: "/media", icon: <Upload className="h-4 w-4" /> },
    { label: "Create a Playlist", complete: playlists.length > 0, cta: "Create Playlist", route: "/playlists", icon: <ListVideo className="h-4 w-4" /> },
    { label: "Assign to Screen", complete: screens.some(s => s.current_playlist_id), cta: "Assign", route: "/screens", icon: <Link2 className="h-4 w-4" /> },
  ];

  const doneCount = steps.filter(s => s.complete).length;
  const allDone = doneCount === steps.length;
  const progress = (doneCount / steps.length) * 100;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Glowing progress bar */}
      <div className="h-1 w-full bg-muted/30">
        <div
          className="h-full transition-all duration-700 ease-out rounded-r-full"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--glow-blue, var(--primary))))",
            boxShadow: "0 0 12px hsl(var(--primary) / 0.5)",
          }}
        />
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Get Started</h3>
            <span className="text-xs text-muted-foreground">{doneCount} of {steps.length} complete</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={handleDismiss}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {allDone ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <PartyPopper className="h-8 w-8 text-primary" />
            <p className="text-sm font-medium text-foreground">You're all set! 🎉</p>
            <p className="text-xs text-muted-foreground">Your digital signage is ready to glow.</p>
            <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-muted-foreground text-xs">
              Dismiss
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors ${step.complete ? "bg-primary/5" : "hover:bg-muted/20"}`}>
                <div className="flex items-center gap-3">
                  {step.complete ? (
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={`text-sm ${step.complete ? "text-muted-foreground line-through" : "text-foreground font-medium"}`}>
                    {step.label}
                  </span>
                </div>
                {!step.complete && (
                  <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary gap-1.5 h-7" onClick={() => navigate(step.route)}>
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
