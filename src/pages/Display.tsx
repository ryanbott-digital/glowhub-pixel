import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GHLoader } from "@/components/GHLoader";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import glowLogoPng from "@/assets/glow-text.png";

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

const CACHE_KEY = "glowhub_player_cache";

export default function Display() {
  const { screenId } = useParams<{ screenId: string }>();
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showWatermark, setShowWatermark] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const syncTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const currentPlaylistIdRef = useRef<string | null>(null);

  const showSyncIndicator = useCallback(() => {
    setSyncing(true);
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => setSyncing(false), 3000);
  }, []);

  const fetchPlaylist = useCallback(async (playlistId: string) => {
    const { data } = await supabase
      .from("playlist_items")
      .select("id, position, override_duration, media:media_id(id, storage_path, type, name, duration)")
      .eq("playlist_id", playlistId)
      .order("position");

    if (data && data.length > 0) {
      const mapped = data as unknown as PlaylistItem[];
      setItems(mapped);
      setCurrentIndex(0);
      try {
        localStorage.setItem(CACHE_KEY + "_" + screenId, JSON.stringify(mapped));
      } catch {}
    }
    currentPlaylistIdRef.current = playlistId;
    setLoading(false);
  }, [screenId]);

  // Initial load & realtime subscription
  useEffect(() => {
    if (!screenId) return;

    const loadScreen = async () => {
      const { data: screen } = await supabase
        .from("screens")
        .select("current_playlist_id")
        .eq("id", screenId)
        .single();

      if (screen?.current_playlist_id) {
        fetchPlaylist(screen.current_playlist_id);
      } else {
        // Try cache
        try {
          const cached = localStorage.getItem(CACHE_KEY + "_" + screenId);
          if (cached) {
            setItems(JSON.parse(cached));
            setCurrentIndex(0);
          }
        } catch {}
        setLoading(false);
      }
    };

    loadScreen();

    // Check watermark status
    supabase.functions.invoke("check-watermark", { body: { screen_id: screenId } })
      .then(({ data }) => { if (data?.show) setShowWatermark(true); else setShowWatermark(false); })
      .catch(() => {});

    // Realtime subscription
    const channel = supabase
      .channel(`screen-${screenId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "screens", filter: `id=eq.${screenId}` },
        (payload) => {
          const newPlaylistId = payload.new.current_playlist_id;
          if (newPlaylistId) {
            fetchPlaylist(newPlaylistId);
            toast("New content received", { description: "Updating display now…", duration: 3000 });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [screenId, fetchPlaylist]);

  // Playback logic
  useEffect(() => {
    if (items.length === 0) return;
    const item = items[currentIndex];
    if (!item) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    if (item.media.type === "image") {
      // Single image → stay forever; multiple items → advance after duration
      if (items.length > 1) {
        const duration = (item.override_duration || 10) * 1000;
        timerRef.current = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % items.length);
        }, duration);
      }
    }
    // Video advancement is handled by onEnded (single video loops via loop attr)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, items]);

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from("signage-content").getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-foreground">
        <GHLoader size={72} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-foreground gap-4">
        <div className="text-3xl font-bold">
          <span className="text-glow">Glow</span>
          <span style={{ color: "hsl(210, 20%, 90%)" }}>Hub</span>
        </div>
        <p style={{ color: "hsl(210, 20%, 70%)" }}>No content assigned to this screen</p>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const url = getPublicUrl(currentItem.media.storage_path);

  return (
    <div className="min-h-screen w-full bg-foreground flex items-center justify-center overflow-hidden">
      {currentItem.media.type === "image" ? (
        <img
          key={currentItem.id}
          src={url}
          alt=""
          className="max-w-full max-h-screen object-contain"
          style={{ animation: "fadeIn 0.5s ease-in" }}
        />
      ) : (
        <video
          key={currentItem.id}
          ref={videoRef}
          src={url}
          autoPlay
          muted
          loop={items.length === 1}
          className="max-w-full max-h-screen object-contain"
          onEnded={items.length > 1 ? () => setCurrentIndex((prev) => (prev + 1) % items.length) : undefined}
        />
      )}
      {showWatermark && (
        <a href="https://glowhub-pixel.lovable.app/home" target="_blank" rel="noopener noreferrer" className="fixed bottom-4 left-4 z-30 flex items-center gap-1.5 opacity-40 hover:opacity-70 transition-opacity select-none no-underline">
          <img src={glowLogoPng} alt="" className="h-3 w-auto" />
          <span className="text-white/80 text-[10px] font-medium tracking-wider uppercase">Powered by</span>
          <span className="text-[#00A3A3] text-xs font-bold tracking-wide">GLOW</span>
        </a>
      )}
      <Toaster position="bottom-right" theme="dark" />
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
}
