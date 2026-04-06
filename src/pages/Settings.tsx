import { useState } from "react";
import { Settings as SettingsIcon, BookOpen, Bell, BellOff, Monitor, Volume2, VolumeX, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const DISMISS_KEY = "glowhub_onboarding_dismissed";

function usePref<T extends string>(key: string, fallback: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(() => (localStorage.getItem(key) as T) || fallback);
  const update = (v: T) => {
    localStorage.setItem(key, v);
    setVal(v);
  };
  return [val, update];
}

function useBoolPref(key: string, fallback: boolean): [boolean, (v: boolean) => void] {
  const [val, setVal] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored !== null ? stored === "true" : fallback;
  });
  const update = (v: boolean) => {
    localStorage.setItem(key, String(v));
    setVal(v);
  };
  return [val, update];
}

function SettingRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
      {children}
    </div>
  );
}

export default function Settings() {
  const [checklistDismissed, setChecklistDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "true"
  );
  const [pairSound, setPairSound] = useBoolPref("glowhub_pair_sound", true);
  const [pairConfetti, setPairConfetti] = useBoolPref("glowhub_pair_confetti", true);
  const [screenOfflineAlert, setScreenOfflineAlert] = useBoolPref("glowhub_offline_alert", true);
  const [compactSidebar, setCompactSidebar] = useBoolPref("glowhub_compact_sidebar", false);
  const [defaultPreviewTab, setDefaultPreviewTab] = usePref("glowhub_default_tab", "preview");
  const [mediaGridSize, setMediaGridSize] = usePref("glowhub_media_grid", "medium");

  const handleShowChecklist = () => {
    localStorage.removeItem(DISMISS_KEY);
    setChecklistDismissed(false);
    toast.success("Setup Guide will now show on your Dashboard");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>

      {/* Onboarding */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          Onboarding
        </h2>
        <SettingRow>
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">Setup Guide</p>
            <p className="text-xs text-muted-foreground">
              {checklistDismissed
                ? "The onboarding checklist is hidden."
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
        </SettingRow>
      </div>

      {/* Notifications */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          Notifications
        </h2>
        <SettingRow>
          <div className="space-y-0.5">
            <Label htmlFor="pair-sound" className="text-sm font-medium text-foreground">Pairing Sound Effect</Label>
            <p className="text-xs text-muted-foreground">Play a chime when a screen is paired</p>
          </div>
          <div className="flex items-center gap-2">
            {pairSound ? <Volume2 className="h-3.5 w-3.5 text-primary" /> : <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />}
            <Switch id="pair-sound" checked={pairSound} onCheckedChange={setPairSound} />
          </div>
        </SettingRow>
        <SettingRow>
          <div className="space-y-0.5">
            <Label htmlFor="pair-confetti" className="text-sm font-medium text-foreground">Confetti Celebration</Label>
            <p className="text-xs text-muted-foreground">Show confetti burst on screen pairing</p>
          </div>
          <Switch id="pair-confetti" checked={pairConfetti} onCheckedChange={setPairConfetti} />
        </SettingRow>
        <SettingRow>
          <div className="space-y-0.5">
            <Label htmlFor="offline-alert" className="text-sm font-medium text-foreground">Screen Offline Alerts</Label>
            <p className="text-xs text-muted-foreground">Show a toast when a screen goes offline</p>
          </div>
          <div className="flex items-center gap-2">
            {screenOfflineAlert ? <Bell className="h-3.5 w-3.5 text-primary" /> : <BellOff className="h-3.5 w-3.5 text-muted-foreground" />}
            <Switch id="offline-alert" checked={screenOfflineAlert} onCheckedChange={setScreenOfflineAlert} />
          </div>
        </SettingRow>
      </div>

      {/* Display */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Monitor className="h-4 w-4 text-muted-foreground" />
          Display
        </h2>
        <SettingRow>
          <div className="space-y-0.5">
            <Label htmlFor="compact-sidebar" className="text-sm font-medium text-foreground">Compact Sidebar</Label>
            <p className="text-xs text-muted-foreground">Start with the sidebar collapsed</p>
          </div>
          <Switch id="compact-sidebar" checked={compactSidebar} onCheckedChange={setCompactSidebar} />
        </SettingRow>
        <SettingRow>
          <div className="space-y-0.5">
            <Label className="text-sm font-medium text-foreground">Default Dashboard Tab</Label>
            <p className="text-xs text-muted-foreground">Which tab opens by default on the Dashboard</p>
          </div>
          <Select value={defaultPreviewTab} onValueChange={(v) => setDefaultPreviewTab(v as any)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="preview">Preview</SelectItem>
              <SelectItem value="insights">Insights</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow>
          <div className="space-y-0.5">
            <Label className="text-sm font-medium text-foreground">Media Grid Size</Label>
            <p className="text-xs text-muted-foreground">Thumbnail size in the media library</p>
          </div>
          <Select value={mediaGridSize} onValueChange={(v) => setMediaGridSize(v as any)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </div>
    </div>
  );
}
