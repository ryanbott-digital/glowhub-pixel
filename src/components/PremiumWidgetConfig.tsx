import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Cloud, Rss, Save, Trash2, Loader2 } from "lucide-react";

interface WeatherConfig {
  city: string;
  unit: "celsius" | "fahrenheit";
}

interface RssConfig {
  feedUrl: string;
  speed: "slow" | "normal" | "fast";
  count: number;
}

interface WidgetRow {
  id: string;
  widget_type: string;
  name: string;
  config: WeatherConfig | RssConfig;
}

export default function PremiumWidgetConfig() {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<WidgetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Local draft state
  const [weatherDraft, setWeatherDraft] = useState<WeatherConfig>({ city: "London", unit: "celsius" });
  const [rssDraft, setRssDraft] = useState<RssConfig>({ feedUrl: "", speed: "normal", count: 5 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("premium_widgets")
        .select("*")
        .eq("user_id", user.id)
        .in("widget_type", ["weather", "rss"]);
      const rows = (data || []) as unknown as WidgetRow[];
      setWidgets(rows);

      const weatherRow = rows.find((r) => r.widget_type === "weather");
      if (weatherRow) setWeatherDraft(weatherRow.config as WeatherConfig);

      const rssRow = rows.find((r) => r.widget_type === "rss");
      if (rssRow) setRssDraft(rssRow.config as RssConfig);

      setLoading(false);
    })();
  }, [user]);

  const handleSave = async (type: "weather" | "rss") => {
    if (!user) return;
    setSaving(type);
    const config = type === "weather" ? weatherDraft : rssDraft;
    const name = type === "weather" ? `Weather – ${(config as WeatherConfig).city}` : "RSS Feed";
    const existing = widgets.find((w) => w.widget_type === type);

    try {
      if (existing) {
        const { error } = await supabase
          .from("premium_widgets")
          .update({ config: config as any, name, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
        setWidgets((prev) => prev.map((w) => (w.id === existing.id ? { ...w, config, name } : w)));
      } else {
        const { data, error } = await supabase
          .from("premium_widgets")
          .insert({ user_id: user.id, widget_type: type, config: config as any, name })
          .select()
          .single();
        if (error) throw error;
        setWidgets((prev) => [...prev, data as unknown as WidgetRow]);
      }
      toast.success(`${type === "weather" ? "Weather" : "RSS"} widget saved`);
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (type: "weather" | "rss") => {
    const existing = widgets.find((w) => w.widget_type === type);
    if (!existing) return;
    const { error } = await supabase.from("premium_widgets").delete().eq("id", existing.id);
    if (error) { toast.error(error.message); return; }
    setWidgets((prev) => prev.filter((w) => w.id !== existing.id));
    if (type === "weather") setWeatherDraft({ city: "London", unit: "celsius" });
    else setRssDraft({ feedUrl: "", speed: "normal", count: 5 });
    toast.success("Widget config removed");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Weather Config */}
      <div className="rounded-xl border border-border/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Weather Widget</h3>
          </div>
          {widgets.find((w) => w.widget_type === "weather") && (
            <Button variant="ghost" size="sm" onClick={() => handleDelete("weather")} className="h-7 px-2 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="space-y-2">
          <div>
            <Label className="text-xs text-muted-foreground">City</Label>
            <Input
              value={weatherDraft.city}
              onChange={(e) => setWeatherDraft((d) => ({ ...d, city: e.target.value }))}
              placeholder="e.g. London, New York"
              className="mt-1"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Temperature Unit</Label>
            <div className="flex items-center gap-2 text-xs">
              <span className={weatherDraft.unit === "celsius" ? "text-foreground font-medium" : "text-muted-foreground"}>°C</span>
              <Switch
                checked={weatherDraft.unit === "fahrenheit"}
                onCheckedChange={(v) => setWeatherDraft((d) => ({ ...d, unit: v ? "fahrenheit" : "celsius" }))}
              />
              <span className={weatherDraft.unit === "fahrenheit" ? "text-foreground font-medium" : "text-muted-foreground"}>°F</span>
            </div>
          </div>
        </div>
        <Button size="sm" onClick={() => handleSave("weather")} disabled={saving === "weather" || !weatherDraft.city.trim()} className="gap-1.5 w-full">
          {saving === "weather" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Weather Config
        </Button>
      </div>

      {/* RSS Config */}
      <div className="rounded-xl border border-border/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rss className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">RSS Widget</h3>
          </div>
          {widgets.find((w) => w.widget_type === "rss") && (
            <Button variant="ghost" size="sm" onClick={() => handleDelete("rss")} className="h-7 px-2 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="space-y-2">
          <div>
            <Label className="text-xs text-muted-foreground">Feed URL</Label>
            <Input
              value={rssDraft.feedUrl}
              onChange={(e) => setRssDraft((d) => ({ ...d, feedUrl: e.target.value }))}
              placeholder="https://example.com/rss"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Scroll Speed</Label>
            <Select value={rssDraft.speed} onValueChange={(v) => setRssDraft((d) => ({ ...d, speed: v as any }))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Slow</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="fast">Fast</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Headlines to Show: {rssDraft.count}</Label>
            <Slider
              value={[rssDraft.count]}
              onValueChange={([v]) => setRssDraft((d) => ({ ...d, count: v }))}
              min={1}
              max={20}
              step={1}
              className="mt-2"
            />
          </div>
        </div>
        <Button size="sm" onClick={() => handleSave("rss")} disabled={saving === "rss"} className="gap-1.5 w-full">
          {saving === "rss" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save RSS Config
        </Button>
      </div>
    </div>
  );
}
