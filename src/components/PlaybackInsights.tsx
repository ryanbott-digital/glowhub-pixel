import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";
import { GHLoader } from "@/components/GHLoader";

interface PlaybackLog {
  played_at: string;
  media_id: string;
  screen_id: string;
}

interface MediaName {
  id: string;
  name: string;
}

export function PlaybackInsights() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<PlaybackLog[]>([]);
  const [mediaNames, setMediaNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Get user's screen IDs first
      const { data: screens } = await supabase
        .from("screens")
        .select("id")
        .eq("user_id", user.id);

      if (!screens || screens.length === 0) {
        setLoading(false);
        return;
      }

      const screenIds = screens.map((s) => s.id);

      // Fetch playback logs for user's screens (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: logData } = await supabase
        .from("playback_logs")
        .select("played_at, media_id, screen_id")
        .in("screen_id", screenIds)
        .gte("played_at", thirtyDaysAgo.toISOString())
        .order("played_at", { ascending: true });

      if (logData) setLogs(logData);

      // Fetch media names
      const { data: mediaData } = await supabase
        .from("media")
        .select("id, name")
        .eq("user_id", user.id);

      if (mediaData) {
        const names: Record<string, string> = {};
        mediaData.forEach((m: MediaName) => {
          names[m.id] = m.name;
        });
        setMediaNames(names);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  // Top played content (bar chart)
  const topPlayed = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((log) => {
      counts[log.media_id] = (counts[log.media_id] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([mediaId, count]) => ({
        name: (mediaNames[mediaId] || "Unknown").slice(0, 20),
        plays: count,
      }))
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 10);
  }, [logs, mediaNames]);

  // Weekly plays (line chart)
  const weeklyPlays = useMemo(() => {
    const weeks: Record<string, number> = {};
    logs.forEach((log) => {
      const date = new Date(log.played_at);
      // Get ISO week start (Monday)
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(date);
      weekStart.setDate(diff);
      const key = weekStart.toISOString().slice(0, 10);
      weeks[key] = (weeks[key] || 0) + 1;
    });
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, count]) => ({
        week: new Date(week).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        plays: count,
      }));
  }, [logs]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <GHLoader size={48} text="Loading insights…" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>No playback data yet. Content plays will appear here once screens start playing.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Top Played Content */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            Top Played Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topPlayed} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  color: "hsl(var(--foreground))",
                }}
              />
              <Bar dataKey="plays" fill="hsl(180, 100%, 40%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Plays */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Total Plays per Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={weeklyPlays} margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  color: "hsl(var(--foreground))",
                }}
              />
              <Line
                type="monotone"
                dataKey="plays"
                stroke="hsl(24, 95%, 53%)"
                strokeWidth={2}
                dot={{ fill: "hsl(24, 95%, 53%)", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <Card className="md:col-span-2">
        <CardContent className="pt-6">
          <div className="flex gap-8 justify-center text-center">
            <div>
              <p className="text-3xl font-bold text-foreground">{logs.length.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Plays (30 days)</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{topPlayed.length}</p>
              <p className="text-sm text-muted-foreground">Unique Media Items</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">
                {Math.round(logs.length / Math.max(weeklyPlays.length, 1))}
              </p>
              <p className="text-sm text-muted-foreground">Avg Plays / Week</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
