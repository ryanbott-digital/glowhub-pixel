import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PlaylistItem {
  id: string;
  position: number;
  override_duration: number | null;
  media: {
    id: string;
    storage_path: string;
    type: string;
    name: string;
    duration: number | null;
  };
}

export function MonitorPreview() {
  const { user } = useAuth();
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [screenName, setScreenName] = useState<string | null>(null);
  const [screenId, setScreenId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const getPublicUrl = (path: string) =>
    supabase.storage.from("signage-content").getPublicUrl(path).data.publicUrl;

  const fetchPlaylist = useCallback(async (playlistId: string) => {
    const { data } = await supabase
      .from("playlist_items")
      .select("id, position, override_duration, media:media_id(id, storage_path, type, name, duration)")
      .eq("playlist_id", playlistId)
      .order("position");
    if (data && data.length > 0) {
      setItems(data as unknown as PlaylistItem[]);
      setCurrentIndex(0);
    } else {
      setItems([]);
    }
  }, []);

  // Load first screen's playlist
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: screens } = await supabase
        .from("screens")
        .select("id, name, current_playlist_id")
        .eq("user_id", user.id)
        .order("created_at")
        .limit(1);

      if (screens && screens.length > 0) {
        const screen = screens[0];
        setScreenName(screen.name);
        setScreenId(screen.id);
        if (screen.current_playlist_id) {
          fetchPlaylist(screen.current_playlist_id);
        }
      }
    };
    load();
  }, [user, fetchPlaylist]);

  // Realtime: watch for playlist changes on screen
  useEffect(() => {
    if (!screenId) return;
    const channel = supabase
      .channel(`monitor-preview-${screenId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "screens", filter: `id=eq.${screenId}` },
        (payload) => {
          const newPlaylistId = (payload.new as any).current_playlist_id;
          if (newPlaylistId) fetchPlaylist(newPlaylistId);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [screenId, fetchPlaylist]);

  // Playback timer for images
  useEffect(() => {
    if (items.length === 0) return;
    const item = items[currentIndex];
    if (!item) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (item.media.type === "image") {
      const dur = (item.override_duration || item.media.duration || 10) * 1000;
      timerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }, dur);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [currentIndex, items]);

  const currentItem = items.length > 0 ? items[currentIndex] : null;

  return (
    <div className="relative flex items-center justify-center py-10">
      {/* Multi-colored radiant backlight glow */}
      <div
        className="absolute rounded-3xl"
        style={{
          inset: "10px",
          filter: "blur(40px)",
          opacity: 0.6,
          background: `
            radial-gradient(ellipse at 20% 50%, hsla(330, 80%, 60%, 0.6) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 50%, hsla(180, 100%, 45%, 0.6) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, hsla(120, 60%, 50%, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 20%, hsla(24, 95%, 53%, 0.5) 0%, transparent 50%)
          `,
          animation: "radiantPulse 4s ease-in-out infinite",
        }}
      />

      {/* Secondary sharper glow layer */}
      <div
        className="absolute rounded-2xl"
        style={{
          inset: "20px",
          filter: "blur(20px)",
          opacity: 0.35,
          background: `
            radial-gradient(ellipse at 30% 40%, hsla(180, 100%, 45%, 0.7) 0%, transparent 40%),
            radial-gradient(ellipse at 70% 60%, hsla(330, 80%, 60%, 0.5) 0%, transparent 40%)
          `,
          animation: "radiantPulse 4s ease-in-out infinite 1s",
        }}
      />

      {/* Monitor frame */}
      <div className="relative w-full max-w-2xl aspect-video rounded-xl overflow-hidden border-2 border-secondary/80 bg-secondary shadow-2xl" style={{
        boxShadow: `
          0 0 30px hsla(180, 100%, 45%, 0.15),
          0 0 60px hsla(330, 80%, 60%, 0.1),
          0 25px 50px -12px rgba(0, 0, 0, 0.4)
        `
      }}>
        {/* Inner bezel */}
        <div className="absolute inset-[6px] rounded-lg bg-black overflow-hidden">
          {currentItem ? (
            <>
              {currentItem.media.type === "image" ? (
                <img
                  key={currentItem.id}
                  src={getPublicUrl(currentItem.media.storage_path)}
                  alt={currentItem.media.name}
                  className="w-full h-full object-cover"
                  style={{ animation: "monitorFadeIn 0.6s ease-out" }}
                />
              ) : (
                <video
                  key={currentItem.id}
                  ref={videoRef}
                  src={getPublicUrl(currentItem.media.storage_path)}
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                  onEnded={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
                />
              )}
              {/* LIVE badge - pulsing red */}
              <div className="absolute top-2 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md" style={{ background: "hsla(0, 0%, 0%, 0.6)", backdropFilter: "blur(4px)" }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "hsl(0, 84%, 60%)" }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "hsl(0, 84%, 60%)" }} />
                </span>
                <span className="text-[9px] font-bold text-white tracking-widest uppercase">LIVE</span>
              </div>
              {/* Bottom HUD */}
              <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center justify-between" style={{ background: "linear-gradient(to top, hsla(0,0%,0%,0.7), transparent)" }}>
                <span className="text-[9px] text-white/80 font-medium truncate max-w-[60%]">
                  {currentItem.media.name}
                </span>
                <span className="text-[8px] text-white/50 font-mono">
                  {currentIndex + 1}/{items.length}
                </span>
              </div>
            </>
          ) : (
            /* Empty state — GH branding with ambient animation */
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 relative overflow-hidden" style={{ background: "hsl(215, 55%, 10%)" }}>
              <div className="absolute inset-0" style={{
                background: "radial-gradient(ellipse at 50% 50%, hsla(180, 80%, 40%, 0.08) 0%, transparent 70%)",
                animation: "monitorFadeIn 3s ease-in-out infinite alternate",
              }} />
              <div className="text-2xl font-bold font-['Poppins'] relative z-10">
                <span className="text-glow">Glow</span>
                <span style={{ color: "hsl(210, 20%, 90%)" }}>Hub</span>
              </div>
              <p className="text-[10px] relative z-10" style={{ color: "hsl(210, 20%, 50%)" }}>
                {screenName ? `${screenName} — No playlist assigned` : "No screens paired yet"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Monitor stand */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="w-6 h-5 bg-secondary/70 rounded-b-sm" />
        <div className="w-24 h-2 bg-secondary/50 rounded-b-lg" />
      </div>

      <style>{`
        @keyframes radiantPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.02); }
        }
        @keyframes monitorFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
