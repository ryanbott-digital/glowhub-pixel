import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GHLoader } from "@/components/GHLoader";
import glowLogoPng from "@/assets/glow-text.png";
import { useVersionCheck } from "@/hooks/use-version-check";

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
    audio_muted: boolean;
  };
}

const CACHE_KEY = "glowhub_player_cache";
const CROSSFADE_MS = 800;

export default function Display() {
  useVersionCheck(120_000, true);
  const { screenId } = useParams<{ screenId: string }>();
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWatermark, setShowWatermark] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [displayMode, setDisplayMode] = useState<"fill" | "fit">("fill");
  const [fitBgColor, setFitBgColor] = useState("#000000");

  // Double-buffer crossfade state
  const [layerA, setLayerA] = useState<PlaylistItem | null>(null);
  const [layerB, setLayerB] = useState<PlaylistItem | null>(null);
  const [activeLayer, setActiveLayer] = useState<"A" | "B">("A");

  const currentIndexRef = useRef(0);
  const itemsRef = useRef<PlaylistItem[]>([]);
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const syncTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const currentPlaylistIdRef = useRef<string | null>(null);

  const getPublicUrl = useCallback((path: string) => {
    const { data } = supabase.storage.from("signage-content").getPublicUrl(path);
    return data.publicUrl;
  }, []);

  const showSyncIndicator = useCallback(() => {
    setSyncing(true);
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => setSyncing(false), 3000);
  }, []);

  // Advance to next item with crossfade
  const advanceToNext = useCallback(() => {
    const allItems = itemsRef.current;
    if (allItems.length <= 1) return;

    const nextIndex = (currentIndexRef.current + 1) % allItems.length;
    currentIndexRef.current = nextIndex;
    const nextItem = allItems[nextIndex];

    // Load next item into the inactive layer, then flip
    setActiveLayer((prev) => {
      if (prev === "A") {
        setLayerB(nextItem);
        return "B";
      } else {
        setLayerA(nextItem);
        return "A";
      }
    });
  }, []);

  // Schedule advancement for the current item
  const scheduleNext = useCallback((item: PlaylistItem, allItems: PlaylistItem[]) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (allItems.length <= 1) return; // single item doesn't advance

    if (item.media.type === "image") {
      const duration = (item.override_duration || 10) * 1000;
      timerRef.current = setTimeout(advanceToNext, duration);
    }
    // Videos advance via onEnded
  }, [advanceToNext]);

  const fetchPlaylist = useCallback(async (playlistId: string, forceReset = false) => {
    const { data } = await supabase
      .from("playlist_items")
      .select("id, position, override_duration, media:media_id(id, storage_path, type, name, duration, audio_muted)")
      .eq("playlist_id", playlistId)
      .order("position");

    if (data && data.length > 0) {
      const mapped = data as unknown as PlaylistItem[];
      // Only reset playback if playlist actually changed or forced
      const oldIds = itemsRef.current.map(i => i.id).join(",");
      const newIds = mapped.map(i => i.id).join(",");
      const changed = forceReset || oldIds !== newIds;

      itemsRef.current = mapped;
      setItems(mapped);

      if (changed) {
        currentIndexRef.current = 0;
        setLayerA(mapped[0]);
        setLayerB(null);
        setActiveLayer("A");
      }
      try {
        localStorage.setItem(CACHE_KEY + "_" + screenId, JSON.stringify(mapped));
      } catch {}
    }
    currentPlaylistIdRef.current = playlistId;
    setLoading(false);
  }, [screenId]);

  // When active layer or items change, schedule next advancement
  useEffect(() => {
    const allItems = itemsRef.current;
    if (allItems.length === 0) return;
    const currentItem = allItems[currentIndexRef.current];
    if (currentItem) {
      scheduleNext(currentItem, allItems);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeLayer, items, scheduleNext]);

  // Initial load & realtime subscription
  useEffect(() => {
    if (!screenId) return;

    const loadScreen = async () => {
      const { data: screen } = await supabase
        .from("screens")
        .select("current_playlist_id, display_mode, fit_bg_color")
        .eq("id", screenId)
        .single();

      if (screen?.display_mode === "fit" || screen?.display_mode === "fill") {
        setDisplayMode(screen.display_mode);
      }
      if (screen?.fit_bg_color) setFitBgColor(screen.fit_bg_color);

      if (screen?.current_playlist_id) {
        fetchPlaylist(screen.current_playlist_id, true);
      } else {
        try {
          const cached = localStorage.getItem(CACHE_KEY + "_" + screenId);
          if (cached) {
            const parsed = JSON.parse(cached) as PlaylistItem[];
            itemsRef.current = parsed;
            setItems(parsed);
            currentIndexRef.current = 0;
            setLayerA(parsed[0]);
            setActiveLayer("A");
          }
        } catch {}
        setLoading(false);
      }
    };

    loadScreen();

    supabase.functions.invoke("check-watermark", { body: { screen_id: screenId } })
      .then(({ data }) => { if (data?.show) setShowWatermark(true); else setShowWatermark(false); })
      .catch(() => {});

    const screenChannel = supabase
      .channel(`screen-${screenId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "screens", filter: `id=eq.${screenId}` },
        (payload) => {
          const newPlaylistId = payload.new.current_playlist_id;
          const oldPlaylistId = (payload.old as Record<string, unknown>)?.current_playlist_id;
          // Only react when the playlist assignment actually changes
          if (newPlaylistId && newPlaylistId !== oldPlaylistId && newPlaylistId !== currentPlaylistIdRef.current) {
            showSyncIndicator();
            fetchPlaylist(newPlaylistId, true);
          }
        }
      )
      .subscribe();

    // Note: we intentionally do NOT subscribe to all playlist_items changes
    // because the unfiltered channel fires on every user's edits and causes
    // constant resets. If a user edits items in the current playlist the
    // screen will pick up changes on next page load or playlist reassignment.

    return () => {
      supabase.removeChannel(screenChannel);
    };
  }, [screenId, fetchPlaylist, showSyncIndicator]);

  const handleVideoEnded = useCallback(() => {
    if (itemsRef.current.length > 1) {
      advanceToNext();
    }
  }, [advanceToNext]);

  const objectClass = displayMode === "fit" ? "object-contain" : "object-cover";

  const renderMedia = (item: PlaylistItem | null, ref: React.RefObject<HTMLVideoElement>, isActive: boolean) => {
    if (!item) return null;
    const url = getPublicUrl(item.media.storage_path);

    if (item.media.type === "image") {
      return (
        <img
          key={item.id}
          src={url}
          alt=""
          className={`absolute inset-0 w-full h-full ${objectClass}`}
        />
      );
    }
    return (
      <video
        key={item.id}
        ref={ref}
        src={url}
        autoPlay={isActive}
        muted
        playsInline
        loop={itemsRef.current.length === 1}
        className={`absolute inset-0 w-full h-full ${objectClass}`}
        onEnded={handleVideoEnded}
      />
    );
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center overflow-hidden relative" style={{ backgroundColor: fitBgColor }}>
      {/* Layer A */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          opacity: activeLayer === "A" ? 1 : 0,
          transition: `opacity ${CROSSFADE_MS}ms ease-in-out`,
          zIndex: activeLayer === "A" ? 2 : 1,
        }}
      >
        {renderMedia(layerA, videoRefA, activeLayer === "A")}
      </div>

      {/* Layer B */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          opacity: activeLayer === "B" ? 1 : 0,
          transition: `opacity ${CROSSFADE_MS}ms ease-in-out`,
          zIndex: activeLayer === "B" ? 2 : 1,
        }}
      >
        {renderMedia(layerB, videoRefB, activeLayer === "B")}
      </div>

      {showWatermark && (
        <a href="https://glowhub-pixel.lovable.app/home" target="_blank" rel="noopener noreferrer" className="fixed bottom-4 left-4 z-30 flex items-center gap-1.5 opacity-40 hover:opacity-70 transition-opacity select-none no-underline">
          <img src={glowLogoPng} alt="" className="h-3 w-auto" />
          <span className="text-white/80 text-[10px] font-medium tracking-wider uppercase">Powered by</span>
          <span className="text-[#00A3A3] text-xs font-bold tracking-wide">GLOW</span>
        </a>
      )}
      {syncing && (
        <div
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            background: "hsla(0, 0%, 0%, 0.7)",
            backdropFilter: "blur(8px)",
            animation: "syncSlideIn 0.3s ease-out",
          }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: "hsl(180, 100%, 45%)",
              animation: "syncPulse 1s ease-in-out infinite",
            }}
          />
          <span className="text-white/90 text-[11px] font-medium tracking-wide">
            Syncing content…
          </span>
        </div>
      )}
      <style>{`
        @keyframes syncSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes syncPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
