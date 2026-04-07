import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isProTier } from "@/lib/subscription";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Monitor, Image, ListVideo, HardDrive, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#F97316", "#10B981", "#8B5CF6", "#EC4899", "#06B6D4", "#F59E0B"];

export default function Analytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tier, setTier] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalScreens: 0,
    onlineScreens: 0,
    totalMedia: 0,
    totalPlaylists: 0,
  });
  const [mediaByType, setMediaByType] = useState<{ name: string; value: number }[]>([]);
  const [playlistSizes, setPlaylistSizes] = useState<{ name: string; items: number }[]>([]);
  const [screenStatus, setScreenStatus] = useState<{ name: string; value: number }[]>([]);
  const [mediaTimeline, setMediaTimeline] = useState<{ date: string; uploads: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("subscription_tier").eq("id", user.id).single()
      .then(({ data }) => setTier(data?.subscription_tier || "free"));
  }, [user]);

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;

    const [screensRes, mediaRes, playlistsRes, itemsRes] = await Promise.all([
      supabase.from("screens").select("*").eq("user_id", user.id),
      supabase.from("media").select("*").eq("user_id", user.id),
      supabase.from("playlists").select("id, title").eq("user_id", user.id),
      supabase.from("playlist_items").select("playlist_id, media_id"),
    ]);

    const screens = screensRes.data || [];
    const media = mediaRes.data || [];
    const playlists = playlistsRes.data || [];
    const items = itemsRes.data || [];

    // Basic stats
    const online = screens.filter((s) => s.status === "online").length;
    setStats({
      totalScreens: screens.length,
      onlineScreens: online,
      totalMedia: media.length,
      totalPlaylists: playlists.length,
    });

    // Screen status breakdown
    const statusMap: Record<string, number> = {};
    screens.forEach((s) => {
      statusMap[s.status] = (statusMap[s.status] || 0) + 1;
    });
    setScreenStatus(
      Object.entries(statusMap).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    );

    // Media by type
    const typeMap: Record<string, number> = {};
    media.forEach((m) => {
      const label = m.type.startsWith("video") ? "Video" : m.type.startsWith("image") ? "Image" : "Other";
      typeMap[label] = (typeMap[label] || 0) + 1;
    });
    setMediaByType(Object.entries(typeMap).map(([name, value]) => ({ name, value })));

    // Playlist sizes
    const playlistItemCounts: Record<string, number> = {};
    items.forEach((it) => {
      playlistItemCounts[it.playlist_id] = (playlistItemCounts[it.playlist_id] || 0) + 1;
    });
    setPlaylistSizes(
      playlists.map((p) => ({
        name: p.title.length > 12 ? p.title.slice(0, 12) + "…" : p.title,
        items: playlistItemCounts[p.id] || 0,
      }))
    );

    // Upload timeline (last 7 days)
    const now = new Date();
    const days: { date: string; uploads: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = media.filter((m) => m.created_at.slice(0, 10) === dateStr).length;
      days.push({
        date: d.toLocaleDateString("en", { weekday: "short" }),
        uploads: count,
      });
    }
    setMediaTimeline(days);
  }, [user]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const statCards = [
    { label: "Total Screens", value: stats.totalScreens, icon: Monitor, sub: `${stats.onlineScreens} online` },
    { label: "Media Files", value: stats.totalMedia, icon: Image, sub: "in library" },
    { label: "Playlists", value: stats.totalPlaylists, icon: ListVideo, sub: "created" },
    { label: "Uptime", value: stats.totalScreens > 0 ? Math.round((stats.onlineScreens / stats.totalScreens) * 100) + "%" : "—", icon: HardDrive, sub: "screen uptime" },
  ];

  return (
    <div className="space-y-6 animate-fade-in stagger-in">
      <h1 className="text-2xl font-bold text-foreground">Analytics & Insights</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-in">
        {statCards.map((s) => (
          <div key={s.label} className="glass glass-spotlight rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 stagger-in">
        {/* Upload timeline */}
        <div className="glass glass-spotlight rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Media Uploads (7 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mediaTimeline}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsla(220,50%,10%,0.9)", backdropFilter: "blur(12px)", border: "1px solid hsla(180,100%,45%,0.15)", borderRadius: 12, color: "hsl(var(--foreground))" }} />
              <Bar dataKey="uploads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Media by type */}
        <div className="glass glass-spotlight rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Media by Type</h3>
          {mediaByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={mediaByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {mediaByType.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ backgroundColor: "hsla(220,50%,10%,0.9)", backdropFilter: "blur(12px)", border: "1px solid hsla(180,100%,45%,0.15)", borderRadius: 12, color: "hsl(var(--foreground))" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No media yet</p>
          )}
        </div>

        {/* Playlist content counts */}
        <div className="glass glass-spotlight rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Content per Playlist</h3>
          {playlistSizes.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={playlistSizes} layout="vertical">
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: "hsla(220,50%,10%,0.9)", backdropFilter: "blur(12px)", border: "1px solid hsla(180,100%,45%,0.15)", borderRadius: 12, color: "hsl(var(--foreground))" }} />
                <Bar dataKey="items" fill="#F97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No playlists yet</p>
          )}
        </div>

        {/* Screen status */}
        <div className="glass glass-spotlight rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Screen Status</h3>
          {screenStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={screenStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {screenStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ backgroundColor: "hsla(220,50%,10%,0.9)", backdropFilter: "blur(12px)", border: "1px solid hsla(180,100%,45%,0.15)", borderRadius: 12, color: "hsl(var(--foreground))" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No screens yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
