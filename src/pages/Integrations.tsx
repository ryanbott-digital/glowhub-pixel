import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Key, Copy, RefreshCw, Loader2, Shield, Zap, Check, AlertTriangle, Monitor, Play, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const TRIGGER_BASE = "https://mblgzzpnkpaxsrserwme.supabase.co/functions/v1/remote-trigger";

interface Screen {
  id: string;
  name: string;
  hardware_uuid: string | null;
  last_remote_trigger: string | null;
}

interface Playlist {
  id: string;
  title: string;
}

export default function Integrations() {
  const { user } = useAuth();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedScreen, setSelectedScreen] = useState("");
  const [selectedAction, setSelectedAction] = useState("play_playlist");
  const [selectedPayload, setSelectedPayload] = useState("");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keyPrefix, setKeyPrefix] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [screensRes, playlistsRes, keyRes] = await Promise.all([
      supabase.from("screens").select("id, name, hardware_uuid, last_remote_trigger").eq("user_id", user.id),
      supabase.from("playlists").select("id, title").eq("user_id", user.id),
      supabase.functions.invoke("manage-api-key", { body: { action: "status" } }),
    ]);

    if (screensRes.data) setScreens(screensRes.data as Screen[]);
    if (playlistsRes.data) setPlaylists(playlistsRes.data);
    if (keyRes.data) {
      setHasKey(keyRes.data.hasKey);
      setKeyPrefix(keyRes.data.prefix || null);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-api-key", {
        body: { action: "generate" },
      });
      if (error) throw error;
      setApiKey(data.key);
      setKeyPrefix(data.prefix);
      setHasKey(true);
      toast.success("API key generated! Copy it now — it won't be shown again.");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate API key");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async () => {
    setRevoking(true);
    try {
      const { error } = await supabase.functions.invoke("manage-api-key", {
        body: { action: "revoke" },
      });
      if (error) throw error;
      setApiKey(null);
      setKeyPrefix(null);
      setHasKey(false);
      toast.success("API key revoked. All existing trigger URLs are now invalid.");
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke API key");
    } finally {
      setRevoking(false);
    }
  };

  const getSelectedScreenData = () => screens.find((s) => s.id === selectedScreen);

  const buildTriggerUrl = () => {
    const screen = getSelectedScreenData();
    if (!screen?.hardware_uuid) return "";
    const keyValue = apiKey || `${keyPrefix || "glw_****"}...`;
    const params = new URLSearchParams({
      key: keyValue,
      device: screen.hardware_uuid,
      action: selectedAction,
    });
    if (selectedPayload) params.set("payload", selectedPayload);
    return `${TRIGGER_BASE}?${params.toString()}`;
  };

  const handleCopy = async () => {
    const url = buildTriggerUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Trigger URL copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          Integrations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Remote control your screens via API — perfect for Stream Deck, webhooks, and automation.
        </p>
      </div>

      {/* API Key Management */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key className="h-5 w-5 text-primary" />
            API Key
          </CardTitle>
          <CardDescription>
            Your secret key authenticates all remote trigger URLs. Keep it safe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasKey ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-foreground">
                    {apiKey ? (
                      <span className="break-all">{apiKey}</span>
                    ) : (
                      <span>{keyPrefix}••••••••••••</span>
                    )}
                  </p>
                  {apiKey && (
                    <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Copy this key now — it will not be shown again
                    </p>
                  )}
                </div>
                {apiKey && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await navigator.clipboard.writeText(apiKey);
                      toast.success("API key copied!");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={revoking}>
                    {revoking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Regenerate API Key
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Regenerate API Key?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will immediately invalidate your current key. All existing trigger URLs (Stream Deck buttons, webhooks, etc.) will stop working until you update them with the new key.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={async () => { await handleRevoke(); await handleGenerate(); }}>
                      Regenerate
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-muted-foreground">No API key generated yet. Create one to start using remote triggers.</p>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
                Generate API Key
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trigger Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Monitor className="h-5 w-5 text-primary" />
            Trigger Builder
          </CardTitle>
          <CardDescription>
            Select a screen and action, then copy the generated URL for your Stream Deck or automation tool.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Screen Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Target Screen</label>
              <Select value={selectedScreen} onValueChange={setSelectedScreen}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a screen" />
                </SelectTrigger>
                <SelectContent>
                  {screens.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</label>
              <Select value={selectedAction} onValueChange={(v) => { setSelectedAction(v); setSelectedPayload(""); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="play_playlist">Play Playlist</SelectItem>
                  <SelectItem value="play_media">Play Media</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payload Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {selectedAction === "play_playlist" ? "Playlist" : "Media"}
              </label>
              <Select value={selectedPayload} onValueChange={setSelectedPayload}>
                <SelectTrigger>
                  <SelectValue placeholder={`Choose ${selectedAction === "play_playlist" ? "playlist" : "media"}`} />
                </SelectTrigger>
                <SelectContent>
                  {selectedAction === "play_playlist"
                    ? playlists.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))
                    : null
                  }
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generated URL */}
          {selectedScreen && hasKey && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Generated Trigger URL</label>
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50 font-mono text-xs break-all text-foreground/80">
                {buildTriggerUrl()}
              </div>
              <Button onClick={handleCopy} disabled={!selectedScreen} className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy for Stream Deck"}
              </Button>
            </div>
          )}

          {!hasKey && selectedScreen && (
            <p className="text-sm text-amber-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Generate an API key above first
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stream Deck Icons */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Download className="h-5 w-5 text-primary" />
            Stream Deck Icons
          </CardTitle>
          <CardDescription>
            15 neon-teal icons (72×72px) — designed to match the Glow aesthetic on your physical Stream Deck buttons.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {[
              { file: "play", label: "Play" }, { file: "skip", label: "Skip" }, { file: "sync", label: "Sync" },
              { file: "power", label: "Power" }, { file: "blackout", label: "Blackout" }, { file: "always-on", label: "Always-On" },
              { file: "sleep", label: "Sleep" }, { file: "volume-up", label: "Vol Up" }, { file: "volume-down", label: "Vol Down" },
              { file: "settings", label: "Settings" }, { file: "link", label: "Link" }, { file: "compass", label: "Compass" },
            ].map((icon) => (
              <div key={icon.file} className="flex flex-col items-center gap-1.5">
                <div className="w-[72px] h-[72px] rounded-lg border border-border/30 overflow-hidden">
                  <img
                    src={`/glow-streamdeck-icons/${icon.file}.png`}
                    alt={`Glow ${icon.label} icon`}
                    width={72}
                    height={72}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{icon.label}</span>
              </div>
            ))}
          </div>
          <Button asChild variant="outline" className="gap-2">
            <a href="/glow-streamdeck-icons.zip" download>
              <Download className="h-4 w-4" />
              Download Icon Pack (.zip)
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Screen Status */}
      {screens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Remote Trigger Status</CardTitle>
            <CardDescription>Last remote command received per screen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {screens.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border/30 bg-card/50">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      <p className="text-xs font-mono text-muted-foreground">{s.hardware_uuid ? `${s.hardware_uuid.substring(0, 8)}...` : "—"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {s.last_remote_trigger ? (
                      <Badge variant="secondary" className="text-xs">
                        <Play className="h-3 w-3 mr-1" />
                        {new Date(s.last_remote_trigger).toLocaleString()}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">No triggers yet</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
