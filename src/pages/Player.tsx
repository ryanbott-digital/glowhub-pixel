import { useEffect, useState, useRef, useCallback } from "react";
import Hls from "hls.js";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isNativePlatform, enableAutoStart, disableAutoStart, isAutoStartEnabled, isBootLaunch } from "@/lib/capacitor-autostart";
import { Settings, Volume2, VolumeX, Download, X } from "lucide-react";
import { GHLoader } from "@/components/GHLoader";
import { registerMediaSW, precacheMediaUrls, evictStaleMedia, getCacheStatus, getCacheSize, requestPersistentStorage, onCacheProgress, type CacheProgress } from "@/lib/media-cache";
import fallbackBranding from "@/assets/fallback-branding.jpg";

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

const DEFAULT_IMAGE_DURATION = 10;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

// Global TV styles injected once
const TV_STYLES = `
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    width: 100vw !important;
    height: 100vh !important;
    scrollbar-width: none !important;
  }
  html::-webkit-scrollbar, body::-webkit-scrollbar,
  *::-webkit-scrollbar {
    display: none !important;
  }
`;

export default function Player() {
  const { pairingCode: urlPairingCode } = useParams<{ pairingCode: string }>();
  const [screenId, setScreenId] = useState<string | null>(() => localStorage.getItem("glowhub_screen_id"));
  const [pairingCode, setPairingCode] = useState<string | null>(urlPairingCode || null);
  const [paired, setPaired] = useState(false);
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineSeconds, setOfflineSeconds] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [volume, setVolume] = useState(1);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [alertsMuted, setAlertsMuted] = useState(() => localStorage.getItem("glowhub_alerts_muted") === "1");
  const alertsMutedRef = useRef(localStorage.getItem("glowhub_alerts_muted") === "1");
  const [crossfadeDuration, setCrossfadeDuration] = useState(() => {
    const saved = localStorage.getItem("glowhub_crossfade_ms");
    return saved ? parseInt(saved, 10) : 500;
  });
  const [cachedCount, setCachedCount] = useState(0);
  const [cacheBytes, setCacheBytes] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // ── DOUBLE BUFFER SYSTEM ──
  // Buffer A and Buffer B each contain a <video> + <img>.
  // Active buffer: opacity 1, z-index 10
  // Next buffer:   opacity 0, z-index 5 (preloaded & ready)
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);
  const imgRefA = useRef<HTMLImageElement>(null);
  const imgRefB = useRef<HTMLImageElement>(null);
  const hlsRefA = useRef<Hls | null>(null);
  const hlsRefB = useRef<Hls | null>(null);
  const [activeBuffer, setActiveBuffer] = useState<"A" | "B">("A");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const swapLockRef = useRef(false);
  const [bufferLoading, setBufferLoading] = useState(false);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // HLS helpers
  const isHlsUrl = (url: string) => url.includes(".m3u8");

  const destroyHls = (hlsRef: React.MutableRefObject<Hls | null>) => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  };

  /** Attach HLS stream or set src directly (Safari native). */
  const attachHls = useCallback((
    videoEl: HTMLVideoElement,
    url: string,
    hlsRef: React.MutableRefObject<Hls | null>
  ) => {
    destroyHls(hlsRef);

    if (!isHlsUrl(url)) {
      videoEl.src = url;
      return;
    }

    // Safari supports HLS natively
    if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
      videoEl.src = url;
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hls.loadSource(url);
      hls.attachMedia(videoEl);
      hlsRef.current = hls;
    } else {
      videoEl.src = url;
    }
  }, []);

  /** Get refs for a specific buffer. */
  const getBufferRefs = useCallback((buffer: "A" | "B") => ({
    video: buffer === "A" ? videoRefA : videoRefB,
    img: buffer === "A" ? imgRefA : imgRefB,
    hls: buffer === "A" ? hlsRefA : hlsRefB,
  }), []);

  const inactiveBuffer = activeBuffer === "A" ? "B" : "A";

  // Refresh cache count when settings panel opens
  useEffect(() => {
    if (!showSettings) return;
    getCacheStatus().then((s) => setCachedCount(s.count));
    getCacheSize().then(setCacheBytes);
  }, [showSettings]);

  // Inject TV styles + register media cache SW
  const [syncProgress, setSyncProgress] = useState<CacheProgress | null>(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = TV_STYLES;
    document.head.appendChild(style);
    registerMediaSW().then(() => requestPersistentStorage());
    const unsub = onCacheProgress(setSyncProgress);
    return () => { document.head.removeChild(style); unsub(); };
  }, []);

  // Toast when pre-caching completes
  useEffect(() => {
    if (syncProgress?.done && syncProgress.total > 0) {
      const failed = syncProgress.failed;
      if (failed > 0) {
        toast.warning(`Cached ${syncProgress.completed}/${syncProgress.total} files (${failed} failed)`);
      } else {
        toast.success(`All ${syncProgress.total} media files cached for offline playback`);
      }
    }
  }, [syncProgress?.done]);

  // Offline/online detection with toast
  useEffect(() => {
    const handleOffline = () => {
      toast.info("You're offline — serving media from cache", { duration: 5000 });
    };
    const handleOnline = () => {
      toast.success("Back online", { duration: 3000 });
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // Capacitor autostart detection
  useEffect(() => {
    const native = isNativePlatform();
    setIsNative(native);
    if (native) {
      isAutoStartEnabled().then(setAutoStartEnabled);
    }
  }, []);

  // PWA install prompt detection
  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Boot-bypass: mark cold launches so the player skips any splash delay
  const isColdBoot = useRef(isBootLaunch());

  const handleAutoStartToggle = useCallback(async () => {
    if (autoStartEnabled) {
      const ok = await disableAutoStart();
      if (ok) { setAutoStartEnabled(false); toast.success("Launch on Boot disabled"); }
      else toast.error("Failed to update setting");
    } else {
      const ok = await enableAutoStart();
      if (ok) { setAutoStartEnabled(true); toast.success("Launch on Boot enabled"); }
      else toast.error("Failed to update setting");
    }
  }, [autoStartEnabled]);

  // Wake Lock API
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await (navigator as any).wakeLock.request("screen");
        }
      } catch {}
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") requestWakeLock();
    };

    requestWakeLock();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      wakeLock?.release().catch(() => {});
    };
  }, []);

  // Offline detection with auto-reload after 60s
  const offlineAtRef = useRef<number | null>(null);

  useEffect(() => {
    const goOffline = () => {
      offlineAtRef.current = Date.now();
      setIsOffline(true);
      setOfflineSeconds(0);
    };
    const goOnline = () => {
      const offlineDuration = offlineAtRef.current ? Date.now() - offlineAtRef.current : 0;
      offlineAtRef.current = null;
      setIsOffline(false);
      setOfflineSeconds(0);
      if (offlineDuration > 60_000) {
        toast.success("Back online — reloading…");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.success("Back online");
      }
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  // Offline duration counter + 60s threshold alert
  const thresholdFiredRef = useRef(false);

  useEffect(() => {
    if (!isOffline) {
      thresholdFiredRef.current = false;
      return;
    }
    const interval = setInterval(() => {
      setOfflineSeconds((s) => {
        const next = s + 1;
        if (next === 60 && !thresholdFiredRef.current) {
          thresholdFiredRef.current = true;
          if (!alertsMutedRef.current) {
            // Vibrate if supported
            navigator.vibrate?.([200, 100, 200]);
            // Play a short notification tone via Web Audio API
            try {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 880;
              osc.type = "sine";
              gain.gain.setValueAtTime(0.3, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + 0.4);
              setTimeout(() => ctx.close(), 500);
            } catch {}
          }
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOffline]);

  const getPublicUrl = (path: string) => {
    // Mux stream URLs are stored as full https:// URLs
    if (path.startsWith("https://")) return path;
    return supabase.storage.from("signage-content").getPublicUrl(path).data.publicUrl;
  };

  // Fetch playlist items for a given playlist ID
  const fetchPlaylist = useCallback(async (playlistId: string) => {
    const { data } = await supabase
      .from("playlist_items")
      .select("id, position, override_duration, media:media_id(id, storage_path, type, name, duration)")
      .eq("playlist_id", playlistId)
      .order("position");

    if (data && data.length > 0) {
      const parsed = data as unknown as PlaylistItem[];
      setItems(parsed);
      setCurrentIndex(0);
      setActiveBuffer("A");

      // Proactively cache all media files for offline playback
      const urls = parsed.map((item) => getPublicUrl(item.media.storage_path));
      precacheMediaUrls(urls);
      evictStaleMedia(urls);
    } else {
      setItems([]);
    }
  }, []);

  // Poll for pairing status
  useEffect(() => {
    if (!pairingCode) return;

    const checkPairing = async () => {
      // Find screen with this pairing code
      const { data: screen } = await supabase
        .from("screens")
        .select("id, current_playlist_id, pairing_code")
        .eq("pairing_code", pairingCode)
        .maybeSingle();

      if (screen) {
        // Screen exists with this code — not yet paired (code still present)
        setScreenId(screen.id);

        // Check if pairing_code was cleared (meaning it's been claimed)
        // Actually, our pairing flow sets user_id and clears pairing_code
        // So if pairing_code still matches, it's unpaired
        // We need to also check for screens that were already paired
        // by looking for screens where pairing_code is null but we don't know the id yet
        setPaired(false);
        setLoading(false);
        return;
      }

      // Maybe the screen was already paired (pairing_code cleared)
      // Check pairings table
      const { data: pairing } = await supabase
        .from("pairings")
        .select("screen_id")
        .eq("pairing_code", pairingCode)
        .maybeSingle();

      if (pairing?.screen_id) {
        setScreenId(pairing.screen_id);
        setPaired(true);

        // Fetch current playlist
        const { data: screenData } = await supabase
          .from("screens")
          .select("current_playlist_id")
          .eq("id", pairing.screen_id)
          .single();

        if (screenData?.current_playlist_id) {
          await fetchPlaylist(screenData.current_playlist_id);
        }
      }
      setLoading(false);
    };

    checkPairing();

    // Poll every 3s until paired
    const interval = setInterval(async () => {
      if (paired) return;

      // Check if screen was just paired (pairing_code cleared from screens table)
      const { data: screen } = await supabase
        .from("screens")
        .select("id, current_playlist_id, pairing_code, user_id")
        .eq("pairing_code", pairingCode)
        .maybeSingle();

      if (screen) {
        // Still has pairing code — not paired yet
        setScreenId(screen.id);
        return;
      }

      // If we already have a screenId, check if it's now paired
      if (screenId) {
        const { data: s } = await supabase
          .from("screens")
          .select("id, current_playlist_id, pairing_code")
          .eq("id", screenId)
          .maybeSingle();

        if (s && !s.pairing_code) {
          setPaired(true);
          if (s.current_playlist_id) {
            await fetchPlaylist(s.current_playlist_id);
          }
          clearInterval(interval);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pairingCode, paired, screenId, fetchPlaylist]);

  // Realtime: listen for screen updates (playlist changes)
  useEffect(() => {
    if (!screenId || !paired) return;

    const channel = supabase
      .channel(`player-screen-${screenId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "screens", filter: `id=eq.${screenId}` },
        (payload) => {
          const newPlaylistId = (payload.new as any).current_playlist_id;
          if (newPlaylistId) {
            fetchPlaylist(newPlaylistId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [screenId, paired, fetchPlaylist]);

  // Heartbeat: ping last_ping + current_media_id every 30s
  useEffect(() => {
    if (!screenId || !paired) return;

    const ping = () => {
      const currentItem = items[currentIndex];
      const update: any = { last_ping: new Date().toISOString(), status: "online" };
      if (currentItem) update.current_media_id = currentItem.media.id;
      supabase.from("screens").update(update).eq("id", screenId).then(() => {});
    };

    ping(); // immediate first ping
    const interval = setInterval(ping, 30_000);
    return () => clearInterval(interval);
  }, [screenId, paired, currentIndex, items]);

  // Reusable screenshot capture function
  const captureScreenshot = useCallback(async () => {
    if (!screenId) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 0.5,
        logging: false,
      });
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.7));
      if (!blob) return;

      const path = `${screenId}/${Date.now()}.jpg`;
      await supabase.storage.from("debug-screenshots").upload(path, blob, {
        contentType: "image/jpeg",
        upsert: true,
      });

      const { data: urlData } = supabase.storage.from("debug-screenshots").getPublicUrl(path);

      await supabase.from("screens").update({
        last_screenshot_url: urlData.publicUrl,
      }).eq("id", screenId);
    } catch (err) {
      console.error("Screenshot capture failed:", err);
    }
  }, [screenId]);

  // Screenshot: listen for on-demand broadcast request from admin
  useEffect(() => {
    if (!screenId) return;
    const channel = supabase
      .channel(`screenshot-${screenId}`)
      .on("broadcast", { event: "take-screenshot" }, () => { captureScreenshot(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [screenId, captureScreenshot]);

  // Auto-screenshot every 5 minutes
  useEffect(() => {
    if (!screenId) return;
    const interval = setInterval(captureScreenshot, 5 * 60 * 1000);
    // Take one immediately on mount
    const timeout = setTimeout(captureScreenshot, 5000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [screenId, captureScreenshot]);

  // Remote Refresh: listen for broadcast command to reload
  useEffect(() => {
    if (!screenId) return;

    const channel = supabase
      .channel(`remote-refresh-${screenId}`)
      .on("broadcast", { event: "remote-refresh" }, () => {
        toast.info("Remote refresh triggered — reloading…");
        setTimeout(() => window.location.reload(), 1500);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [screenId]);

  // Realtime: listen for playlist_items changes to refresh current playlist
  useEffect(() => {
    if (!paired || items.length === 0) return;
    const playlistId = items[0]?.id ? items[0] : null;
    if (!playlistId) return;

    // We need the playlist_id — get it from items context
    // Since all items share the same playlist, fetch it
    const channel = supabase
      .channel(`player-playlist-items`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "playlist_items" },
        async () => {
          // Refetch current playlist
          if (screenId) {
            const { data: s } = await supabase
              .from("screens")
              .select("current_playlist_id")
              .eq("id", screenId)
              .single();
            if (s?.current_playlist_id) {
              fetchPlaylist(s.current_playlist_id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [paired, items.length, screenId, fetchPlaylist]);

  // ── PRE-LOAD: While active buffer plays, load next item into inactive buffer ──
  useEffect(() => {
    if (items.length < 2) return;
    const ni = (currentIndex + 1) % items.length;
    const next = items[ni];
    if (!next) return;

    const url = getPublicUrl(next.media.storage_path);
    const { video, img, hls } = getBufferRefs(inactiveBuffer);

    if (next.media.type === "video" && video.current) {
      attachHls(video.current, url, hls);
      video.current.load(); // preload="auto" ensures full buffering
    } else if (next.media.type === "image" && img.current) {
      img.current.src = url;
    }
  }, [currentIndex, items, activeBuffer, getBufferRefs, inactiveBuffer, attachHls]);

  // ── INSTANT SWAP: Single state update swaps buffers ──
  const advanceToNext = useCallback(() => {
    if (swapLockRef.current) return;
    swapLockRef.current = true;

    // Clear any pending timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);

    // Single atomic swap: advance index + flip buffer
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setActiveBuffer((prev) => (prev === "A" ? "B" : "A"));
    setBufferLoading(false);

    // Unlock after crossfade completes
    setTimeout(() => {
      swapLockRef.current = false;
    }, Math.max(crossfadeDuration, 100));
  }, [items.length, crossfadeDuration]);

  // Error handler: log to Supabase and skip to next item
  const handleMediaError = useCallback((mediaId: string | null, errorMsg: string) => {
    console.error(`[Player] Media error: ${errorMsg}`);
    if (screenId) {
      supabase
        .from("player_error_logs")
        .insert({
          screen_id: screenId,
          media_id: mediaId,
          error_message: errorMsg,
        })
        .then(() => {});
    }
    // Skip to next item
    if (items.length > 1) {
      advanceToNext();
    }
  }, [screenId, items.length, advanceToNext]);

  // Proof of Play: log each media play
  const lastLoggedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!screenId || items.length === 0) return;
    const item = items[currentIndex];
    if (!item) return;
    const key = `${screenId}-${item.media.id}-${currentIndex}`;
    if (lastLoggedRef.current === key) return;
    lastLoggedRef.current = key;

    supabase
      .from("playback_logs")
      .insert({ screen_id: screenId, media_id: item.media.id })
      .then(() => {});
  }, [screenId, currentIndex, items]);

  // Playback timer for images
  useEffect(() => {
    if (items.length === 0) return;
    const item = items[currentIndex];
    if (!item) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    if (item.media.type === "image") {
      const duration = (item.override_duration || item.media.duration || DEFAULT_IMAGE_DURATION) * 1000;
      timerRef.current = setTimeout(advanceToNext, duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, items, advanceToNext]);

  // ── LOAD ACTIVE BUFFER: Set source, play video, show loading placeholder if slow ──
  useEffect(() => {
    if (items.length === 0) return;
    const item = items[currentIndex];
    if (!item) return;

    const url = getPublicUrl(item.media.storage_path);
    const { video, img, hls } = getBufferRefs(activeBuffer);

    // Show branded loading placeholder if media takes >2s to load
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setBufferLoading(true);
    loadTimeoutRef.current = setTimeout(() => setBufferLoading(false), 2000);

    if (item.media.type === "video" && video.current) {
      attachHls(video.current, url, hls);
      video.current.volume = volume;
      video.current.muted = true; // Required for autoplay on Firestick/Google TV
      video.current.play().then(() => {
        setBufferLoading(false);
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      }).catch(() => {});
      // Unmute after play starts if volume > 0
      if (volume > 0) {
        setTimeout(() => {
          if (video.current) {
            video.current.muted = false;
            video.current.volume = volume;
          }
        }, 150);
      }
    } else if (item.media.type === "image" && img.current) {
      img.current.src = url;
      img.current.onload = () => {
        setBufferLoading(false);
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      };
    }

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [currentIndex, items, activeBuffer, volume, getBufferRefs, attachHls]);

  // ── LOADING STATE ──
  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[hsl(215,55%,10%)] overflow-hidden">
        <GHLoader size={80} />
      </div>
    );
  }

  // ── PAIRING CODE SCREEN ──
  if (!paired) {
    const digits = (pairingCode || "").split("");
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center select-none overflow-hidden relative">
        {/* Animated mesh gradient background */}
        <div className="absolute inset-0" style={{
          background: "#1A365D",
        }}>
          <div className="absolute inset-0" style={{
            background: `
              radial-gradient(ellipse 80% 60% at 20% 30%, rgba(0,163,163,0.6) 0%, transparent 60%),
              radial-gradient(ellipse 70% 50% at 80% 70%, rgba(0,163,163,0.4) 0%, transparent 55%),
              radial-gradient(ellipse 60% 80% at 60% 20%, rgba(26,54,93,0.8) 0%, transparent 50%),
              radial-gradient(ellipse 90% 70% at 40% 80%, rgba(0,163,163,0.3) 0%, transparent 60%)
            `,
            animation: "meshMove 12s ease-in-out infinite alternate",
          }} />
          <div className="absolute inset-0" style={{
            background: `
              radial-gradient(ellipse 50% 60% at 70% 40%, rgba(0,163,163,0.35) 0%, transparent 50%),
              radial-gradient(ellipse 80% 50% at 30% 60%, rgba(26,54,93,0.5) 0%, transparent 55%)
            `,
            animation: "meshMove2 15s ease-in-out infinite alternate",
          }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 text-4xl font-bold font-['Poppins'] mb-6">
          <span className="text-glow">Glow</span>
          <span style={{ color: "hsl(210, 20%, 95%)" }}>Hub</span>
        </div>

        {/* Pairing instruction */}
        <p className="relative z-10 text-white/60 text-lg tracking-wide mb-8">
          Enter this code in your dashboard to pair this screen
        </p>

        {/* Glowing code digits */}
        <div className="relative z-10 flex gap-5">
          {digits.map((digit, i) => (
            <div
              key={i}
              className="w-24 h-32 flex items-center justify-center rounded-2xl text-6xl font-extrabold font-['Poppins'] tracking-wider"
              style={{
                color: "#00A3A3",
                background: "rgba(26, 54, 93, 0.6)",
                backdropFilter: "blur(12px)",
                border: "2px solid rgba(0, 163, 163, 0.4)",
                boxShadow: `
                  0 0 24px rgba(0, 163, 163, 0.35),
                  0 0 48px rgba(0, 163, 163, 0.15),
                  inset 0 0 20px rgba(0, 163, 163, 0.05)
                `,
                animation: "digitGlow 3s ease-in-out infinite",
                animationDelay: `${i * 0.12}s`,
              }}
            >
              {digit}
            </div>
          ))}
        </div>

        <p className="relative z-10 text-white/35 text-sm mt-8 animate-pulse">
          Waiting for pairing…
        </p>

        <style>{`
          @keyframes meshMove {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(-30px, 20px) scale(1.08); }
          }
          @keyframes meshMove2 {
            0% { transform: translate(0, 0) scale(1.05); }
            100% { transform: translate(25px, -15px) scale(1); }
          }
          @keyframes digitGlow {
            0%, 100% {
              box-shadow:
                0 0 24px rgba(0, 163, 163, 0.35),
                0 0 48px rgba(0, 163, 163, 0.15),
                inset 0 0 20px rgba(0, 163, 163, 0.05);
            }
            50% {
              box-shadow:
                0 0 36px rgba(0, 163, 163, 0.55),
                0 0 72px rgba(0, 163, 163, 0.25),
                0 0 100px rgba(0, 163, 163, 0.1),
                inset 0 0 30px rgba(0, 163, 163, 0.1);
            }
          }
        `}</style>
      </div>
    );
  }

  // ── NO CONTENT ──
  if (items.length === 0) {
    return (
      <div className="w-screen h-screen overflow-hidden relative">
        <img
          src={fallbackBranding}
          alt="GlowHub"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
        />
      </div>
    );
  }

  // ── PLAYER ──
  const currentItem = items[currentIndex];
  const nextIndex = (currentIndex + 1) % items.length;
  const nextItem = items.length > 1 ? items[nextIndex] : null;
  const currentUrl = getPublicUrl(currentItem.media.storage_path);
  const nextUrl = nextItem ? getPublicUrl(nextItem.media.storage_path) : null;

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden relative">
      {/* Branded loading placeholder — shown when media takes >2s to load */}
      {bufferLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[hsl(215,55%,10%)]">
          <GHLoader size={60} />
        </div>
      )}

      {/* Buffer A */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-opacity ease-in-out"
        style={{
          opacity: activeBuffer === "A" ? 1 : 0,
          zIndex: activeBuffer === "A" ? 10 : 5,
          transitionDuration: `${crossfadeDuration}ms`,
        }}
      >
        <img
          ref={imgRefA}
          alt=""
          className="max-w-full max-h-screen object-contain absolute inset-0 m-auto"
          style={{ display: activeBuffer === "A" && currentItem.media.type === "image" ? "block" : "none" }}
          onError={() => handleMediaError(currentItem.media.id, `Image failed to load: ${currentItem.media.name}`)}
        />
        <video
          ref={videoRefA}
          className="max-w-full max-h-screen object-contain absolute inset-0 m-auto"
          style={{ display: activeBuffer === "A" && currentItem.media.type === "video" ? "block" : "none" }}
          muted autoPlay playsInline preload="auto"
          onEnded={advanceToNext}
          onError={() => handleMediaError(currentItem.media.id, `Video failed to play: ${currentItem.media.name}`)}
        />
      </div>

      {/* Buffer B */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-opacity ease-in-out"
        style={{
          opacity: activeBuffer === "B" ? 1 : 0,
          zIndex: activeBuffer === "B" ? 10 : 5,
          transitionDuration: `${crossfadeDuration}ms`,
        }}
      >
        <img
          ref={imgRefB}
          alt=""
          className="max-w-full max-h-screen object-contain absolute inset-0 m-auto"
          style={{ display: activeBuffer === "B" && currentItem.media.type === "image" ? "block" : "none" }}
          onError={() => handleMediaError(currentItem.media.id, `Image failed to load: ${currentItem.media.name}`)}
        />
        <video
          ref={videoRefB}
          className="max-w-full max-h-screen object-contain absolute inset-0 m-auto"
          style={{ display: activeBuffer === "B" && currentItem.media.type === "video" ? "block" : "none" }}
          muted autoPlay playsInline preload="auto"
          onEnded={advanceToNext}
          onError={() => handleMediaError(currentItem.media.id, `Video failed to play: ${currentItem.media.name}`)}
        />
      </div>

      {/* Settings gear button (top-right, fades in on hover/tap) */}
      <button
        onClick={() => setShowSettings((v) => !v)}
        className="fixed top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/10 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity duration-300"
        aria-label="Power Settings"
      >
        <Settings className="w-5 h-5 text-white/70" />
      </button>

      {/* Power Settings panel */}
      {showSettings && (
        <div className="fixed top-16 right-4 z-50 w-72 rounded-xl bg-black/90 backdrop-blur-md border border-white/10 p-5 shadow-2xl">
          <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4" /> Power Settings
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/90 text-sm font-medium">Launch on Boot</p>
              <p className="text-white/50 text-xs mt-0.5">
                {isNative
                  ? "Start GlowHub when device powers on"
                  : "Only available in the native app"}
              </p>
            </div>
            <button
              disabled={!isNative}
              onClick={handleAutoStartToggle}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                !isNative
                  ? "bg-white/10 cursor-not-allowed"
                  : autoStartEnabled
                    ? "bg-[hsl(180,100%,35%)]"
                    : "bg-white/20"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  autoStartEnabled && isNative ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Volume control */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setVolume(volume === 0 ? 1 : 0)}
                className="text-white/70 hover:text-white transition-colors"
              >
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #00A3A3 ${volume * 100}%, rgba(255,255,255,0.15) ${volume * 100}%)`,
                }}
              />
              <span className="text-white/40 text-xs font-mono w-8 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>

          {/* Mute alerts toggle */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 text-sm font-medium">Mute Alerts</p>
                <p className="text-white/50 text-xs mt-0.5">Silence offline threshold sound &amp; vibration</p>
              </div>
              <button
                onClick={() => {
                  const next = !alertsMuted;
                  setAlertsMuted(next);
                  alertsMutedRef.current = next;
                  localStorage.setItem("glowhub_alerts_muted", next ? "1" : "0");
                }}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  alertsMuted ? "bg-[hsl(180,100%,35%)]" : "bg-white/20"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    alertsMuted ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
          </div>

          {/* Crossfade duration */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-white/90 text-sm font-medium mb-2">Crossfade Duration</p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="2000"
                step="100"
                value={crossfadeDuration}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setCrossfadeDuration(val);
                  localStorage.setItem("glowhub_crossfade_ms", String(val));
                }}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #00A3A3 ${(crossfadeDuration / 2000) * 100}%, rgba(255,255,255,0.15) ${(crossfadeDuration / 2000) * 100}%)`,
                }}
              />
              <span className="text-white/40 text-xs font-mono w-12 text-right">
                {crossfadeDuration === 0 ? "Off" : `${(crossfadeDuration / 1000).toFixed(1)}s`}
              </span>
            </div>
            <p className="text-white/50 text-xs mt-1">Smooth transition between media items</p>
          </div>

          {/* Cache status */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 text-sm font-medium">Offline Cache</p>
                <p className="text-white/50 text-xs mt-0.5">
                  {cachedCount} file{cachedCount !== 1 ? "s" : ""} · {formatBytes(cacheBytes)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-[10px] text-red-400 hover:text-red-300 transition-colors px-1.5 py-0.5 rounded border border-red-400/30 hover:border-red-400/50"
                >
                  Clear
                </button>
                <span className={`inline-block w-2 h-2 rounded-full ${cachedCount > 0 ? "bg-[hsl(180,100%,40%)]" : "bg-white/20"}`} />
                <span className="text-white/60 text-xs font-mono">{cachedCount}</span>
              </div>
            </div>
            {/* Sync progress bar */}
            {syncProgress && !syncProgress.done && syncProgress.total > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-white/50">
                  <span>Syncing media…</span>
                  <span>{syncProgress.completed}/{syncProgress.total}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[hsl(180,100%,40%)] transition-all duration-300"
                    style={{ width: `${(syncProgress.completed / syncProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          </div>

          {/* Device Info */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-white/90 text-sm font-medium mb-2">Device Info</p>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between gap-2">
                <span className="text-white/40 shrink-0">Resolution</span>
                <span className="text-white/70 text-right">{window.screen.width}×{window.screen.height} @ {window.devicePixelRatio}x</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-white/40 shrink-0">Viewport</span>
                <span className="text-white/70 text-right">{window.innerWidth}×{window.innerHeight}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-white/40 shrink-0">Connection</span>
                <span className="text-white/70 text-right">
                  {(navigator as any).connection
                    ? `${(navigator as any).connection.effectiveType || "unknown"} · ${(navigator as any).connection.downlink || "?"}Mbps`
                    : navigator.onLine ? "Online" : "Offline"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-white/40 shrink-0">User Agent</span>
                <span className="text-white/70 text-right break-all leading-tight" style={{ fontSize: "9px" }}>
                  {navigator.userAgent}
                </span>
              </div>
            </div>
          </div>
          {isColdBoot.current && (
            <p className="text-[hsl(180,100%,45%)] text-xs mt-4 border-t border-white/10 pt-3">
              ⚡ Cold boot detected — skipped splash, playing content immediately.
            </p>
          )}
        </div>
      )}

      {/* Install app banner */}
      {showInstallBanner && !isStandalone && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-black/85 backdrop-blur-md rounded-xl px-5 py-3 border border-[rgba(0,163,163,0.3)] shadow-lg shadow-[rgba(0,163,163,0.15)]">
          <Download className="w-5 h-5 text-[#00A3A3] shrink-0" />
          <div className="flex flex-col">
            <span className="text-white/90 text-sm font-semibold">Install GlowHub</span>
            <span className="text-white/50 text-xs">Add to home screen for kiosk mode</span>
          </div>
          <button
            onClick={async () => {
              if (installPrompt) {
                await installPrompt.prompt();
                const { outcome } = await installPrompt.userChoice;
                if (outcome === "accepted") {
                  setShowInstallBanner(false);
                  toast.success("GlowHub installed!");
                }
                setInstallPrompt(null);
              }
            }}
            className="ml-2 px-3 py-1.5 rounded-lg bg-[#00A3A3] text-white text-xs font-semibold hover:bg-[#00A3A3]/80 transition-colors"
          >
            Install
          </button>
          <button
            onClick={() => setShowInstallBanner(false)}
            className="ml-1 text-white/40 hover:text-white/70 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Offline overlay */}
      {isOffline && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-white/10">
          {/* Progress ring around pulse dot */}
          <div className={`relative w-6 h-6 flex items-center justify-center shrink-0 ${offlineSeconds === 60 ? "animate-[ringBounce_0.5s_ease-out]" : ""}`}>
            <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
              <circle
                cx="12" cy="12" r="10" fill="none"
                stroke={offlineSeconds >= 60 ? "#f97316" : "#00A3A3"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 10}
                strokeDashoffset={2 * Math.PI * 10 * (1 - Math.min(offlineSeconds / 60, 1))}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <span className={`absolute w-2 h-2 rounded-full ${offlineSeconds >= 60 ? "bg-orange-400" : "bg-[#00A3A3]"} animate-pulse`} />
            <style>{`@keyframes ringBounce { 0% { transform: scale(1); } 30% { transform: scale(1.35); } 60% { transform: scale(0.9); } 80% { transform: scale(1.1); } 100% { transform: scale(1); } }`}</style>
          </div>
          <div className="flex flex-col">
            <span className="text-white/70 text-sm font-medium">Reconnecting…</span>
            <span className="text-white/40 text-xs font-mono tabular-nums">
              {String(Math.floor(offlineSeconds / 60)).padStart(2, "0")}:{String(offlineSeconds % 60).padStart(2, "0")}
              {offlineSeconds >= 60 && <span className="text-orange-400/80 ml-1.5">auto-reload on reconnect</span>}
            </span>
          </div>
        </div>
      )}
      {/* Clear cache confirmation dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
          <div className="bg-[hsl(var(--background))] border border-border rounded-lg p-6 max-w-xs w-full mx-4 shadow-xl space-y-4">
            <h3 className="text-foreground text-sm font-semibold">Clear Offline Cache?</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              This will delete all cached media files. The player will need to re-download them, which may cause interruptions if the device is offline.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await caches.delete("glowhub-media-v1");
                  setCachedCount(0);
                  setCacheBytes(0);
                  setShowClearConfirm(false);
                  toast.success("Cache cleared successfully");
                }}
                className="text-xs px-3 py-1.5 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
