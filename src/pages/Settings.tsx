import { useState } from "react";
import { Settings as SettingsIcon, BookOpen, Bell, BellOff, Monitor, Volume2, VolumeX, Palette, AlertTriangle, Download, Trash2, Loader2, Crown, Wifi, WifiOff } from "lucide-react";
import { ProGuard } from "@/components/ProGuard";
import PremiumWidgetConfig from "@/components/PremiumWidgetConfig";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/use-push-notifications";

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
  const { user } = useAuth();
  const push = usePushNotifications();
  const [checklistDismissed, setChecklistDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "true"
  );
  const [pairSound, setPairSound] = useBoolPref("glowhub_pair_sound", true);
  const [pairConfetti, setPairConfetti] = useBoolPref("glowhub_pair_confetti", true);
  const [screenOfflineAlert, setScreenOfflineAlert] = useBoolPref("glowhub_offline_alert", true);
  const [compactSidebar, setCompactSidebar] = useBoolPref("glowhub_compact_sidebar", false);
  const [defaultPreviewTab, setDefaultPreviewTab] = usePref("glowhub_default_tab", "preview");
  const [mediaGridSize, setMediaGridSize] = usePref("glowhub_media_grid", "medium");

  const [exporting, setExporting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleShowChecklist = () => {
    localStorage.removeItem(DISMISS_KEY);
    setChecklistDismissed(false);
    toast.success("Setup Guide will now show on your Dashboard");
  };

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [screens, playlists, media, playbackLogs] = await Promise.all([
        supabase.from("screens").select("*").eq("user_id", user.id),
        supabase.from("playlists").select("*").eq("user_id", user.id),
        supabase.from("media").select("*").eq("user_id", user.id),
        supabase.from("playback_logs").select("*"),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        screens: screens.data || [],
        playlists: playlists.data || [],
        media: media.data || [],
        playback_logs: playbackLogs.data || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `glow-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch (err: any) {
      toast.error("Export failed: " + (err.message || "Unknown error"));
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      // Delete user data in order
      await supabase.from("playback_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("playlist_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("playlists").delete().eq("user_id", user!.id);
      await supabase.from("screen_activity_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("screen_schedules").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("screens").delete().eq("user_id", user!.id);
      await supabase.from("media").delete().eq("user_id", user!.id);

      await supabase.auth.signOut();
      toast.success("Your data has been deleted and you've been signed out.");
      window.location.href = "/";
    } catch (err: any) {
      toast.error("Deletion failed: " + (err.message || "Unknown error"));
    } finally {
      setDeleting(false);
    }
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

      {/* Pro Widgets */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          Pro Widget Defaults
        </h2>
        <p className="text-xs text-muted-foreground">Configure default settings for Weather and RSS widgets used in Studio.</p>
        <ProGuard showUpgradePrompt featureName="Widget Configuration">
          <PremiumWidgetConfig />
        </ProGuard>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl p-5 space-y-3 border border-destructive/30" style={{ background: "hsla(0, 84%, 60%, 0.04)" }}>
        <h2 className="text-sm font-semibold text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Danger Zone
        </h2>
        <SettingRow>
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">Export All Data</p>
            <p className="text-xs text-muted-foreground">Download all your screens, playlists, media, and logs as JSON</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportData} disabled={exporting} className="gap-1.5">
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Export
          </Button>
        </SettingRow>
        <SettingRow>
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">Delete All Data</p>
            <p className="text-xs text-muted-foreground">Permanently delete all your screens, playlists, media, and sign out</p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} className="gap-1.5">
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </SettingRow>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="glass-strong border-destructive/20 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete All Data
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all your screens, playlists, media records, and activity logs. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-mono font-bold text-foreground">DELETE</span> to confirm:
            </p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE"
              className="font-mono tracking-wider"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setShowDeleteDialog(false); setDeleteConfirm(""); }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteConfirm !== "DELETE" || deleting}
                onClick={handleDeleteAccount}
                className="gap-1.5"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Delete Everything
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
