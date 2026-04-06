import { useState } from "react";
import { Settings as SettingsIcon, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DISMISS_KEY = "glowhub_onboarding_dismissed";

export default function Settings() {
  const [checklistDismissed, setChecklistDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "true"
  );

  const handleShowChecklist = () => {
    localStorage.removeItem(DISMISS_KEY);
    setChecklistDismissed(false);
    toast.success("Setup Guide will now show on your Dashboard");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>

      <div className="glass rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <SettingsIcon className="h-4 w-4 text-muted-foreground" />
          Preferences
        </h2>

        <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">Setup Guide</p>
            <p className="text-xs text-muted-foreground">
              {checklistDismissed
                ? "The onboarding checklist is hidden. Show it again on the Dashboard."
                : "The onboarding checklist is visible on your Dashboard."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={!checklistDismissed}
            onClick={handleShowChecklist}
            className="gap-1.5"
          >
            <BookOpen className="h-3.5 w-3.5" />
            {checklistDismissed ? "Show Guide" : "Visible"}
          </Button>
        </div>
      </div>
    </div>
  );
}
