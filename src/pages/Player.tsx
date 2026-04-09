import { useEffect, useState, useRef, useCallback } from "react";
import Hls from "hls.js";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isNativePlatform, enableAutoStart, disableAutoStart, isAutoStartEnabled, isBootLaunch } from "@/lib/capacitor-autostart";
import { Settings, Volume2, VolumeX, Download, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { GHLoader } from "@/components/GHLoader";
import glowLogoPng from "@/assets/glow-text.png";
import { registerMediaSW, precacheMediaUrls, evictStaleMedia, getCacheStatus, getCacheSize, requestPersistentStorage, onCacheProgress, type CacheProgress } from "@/lib/media-cache";
import fallbackBranding from "@/assets/fallback-branding.jpg";
import { useVersionCheck } from "@/hooks/use-version-check";
import { ScreenSaver } from "@/components/ScreenSaver";
import { CinematicSplash } from "@/components/CinematicSplash";

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
  const [updateInterval, setUpdateInterval] = useState(() => {
    const saved = localStorage.getItem("glowhub_update_interval_ms");
    return saved ? parseInt(saved, 10) : 5 * 60 * 1000;
  });
  const [screensaverDelay, setScreensaverDelay] = useState(() => {
    const saved = localStorage.getItem("glowhub_screensaver_delay_ms");
    return saved ? parseInt(saved, 10) : 30_000;
  });
  useVersionCheck(updateInterval);
  const [screenId, setScreenId] = useState<string | null>(() => localStorage.getItem("glowhub_screen_id"));
  const [pairingCode, setPairingCode] = useState<string | null>(urlPairingCode || null);
  const [paired, setPaired] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activationPhase, setActivationPhase] = useState<"unlock" | "welcome" | "handover" | null>(null);
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
  const [transitionType, setTransitionType] = useState("crossfade");
  const [fadeToBlackActive, setFadeToBlackActive] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(true);
  const [cachedCount, setCachedCount] = useState(0);
  const [cacheBytes, setCacheBytes] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showUnpairConfirm, setShowUnpairConfirm] = useState(false);
  const [bootPhase, setBootPhase] = useState<"splash" | "fading" | "done">(() =>
    sessionStorage.getItem("glowhub_splash_seen") ? "done" : "splash"
  );
  const [showSettingsHint, setShowSettingsHint] = useState(() => !localStorage.getItem("glowhub_settings_hint_seen"));
  const [showWatermark, setShowWatermark] = useState(false);

  // ── SYNC GROUP (offset rendering) ──
  const [syncInfo, setSyncInfo] = useState<{ position: number; total: number; orientation: "horizontal" | "vertical" } | null>(null);

  // ── BREAKING ALERT ──
  const [alertActive, setAlertActive] = useState(false);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout>>();

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
  const [focusIndex, setFocusIndex] = useState(-1);
  const settingsPanelRef = useRef<HTMLDivElement>(null);

  // D-pad navigation for Firestick remote
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Menu key (ContextMenu) or 'M' toggles settings
      if (e.key === "ContextMenu" || e.key === "m" || e.key === "M") {
        e.preventDefault();
        setShowSettings((v) => {
          if (!v) setFocusIndex(0);
          return !v;
        });
        return;
      }

      // Back button closes settings/dialogs
      if (e.key === "Escape" || e.key === "GoBack" || e.key === "Backspace") {
        if (showClearConfirm) { setShowClearConfirm(false); e.preventDefault(); return; }
        if (showUnpairConfirm) { setShowUnpairConfirm(false); e.preventDefault(); return; }
        if (showSettings) { setShowSettings(false); setFocusIndex(-1); e.preventDefault(); return; }
      }

      // D-pad navigation inside confirmation dialogs
      if (showClearConfirm || showUnpairConfirm) {
        const dialog = document.querySelector('[data-dialog-focus]');
        if (!dialog) return;
        const buttons = dialog.querySelectorAll<HTMLElement>('button.tv-focusable');
        if (!buttons || buttons.length === 0) return;
        const currentIdx = Array.from(buttons).findIndex((b) => b === document.activeElement);

        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          const nextIdx = e.key === "ArrowRight"
            ? Math.min(currentIdx + 1, buttons.length - 1)
            : Math.max(currentIdx - 1, 0);
          buttons[nextIdx]?.focus();
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          (document.activeElement as HTMLElement)?.click();
        }
        return;
      }

      if (!showSettings) return;

      const focusable = settingsPanelRef.current?.querySelectorAll<HTMLElement>(
        'button, input[type="range"], [tabindex="0"]'
      );
      if (!focusable || focusable.length === 0) return;
      const maxIdx = focusable.length - 1;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusIndex((i) => {
          const next = Math.min(i + 1, maxIdx);
          focusable[next]?.focus();
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIndex((i) => {
          const next = Math.max(i - 1, 0);
          focusable[next]?.focus();
          return next;
        });
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const active = document.activeElement;
        if (active instanceof HTMLInputElement && active.type === "range") return;
        e.preventDefault();
      } else if (e.key === "Enter" || e.key === " ") {
        const active = document.activeElement as HTMLElement;
        if (active && settingsPanelRef.current?.contains(active)) {
          if (active instanceof HTMLInputElement && active.type === "range") return;
          e.preventDefault();
          active.click();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSettings, showClearConfirm, showUnpairConfirm]);

  // Auto-focus first element when settings opens
  useEffect(() => {
    if (showSettings && focusIndex >= 0) {
      const timer = setTimeout(() => {
        const focusable = settingsPanelRef.current?.querySelectorAll<HTMLElement>(
          'button, input[type="range"], [tabindex="0"]'
        );
        focusable?.[focusIndex]?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showSettings, focusIndex]);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = TV_STYLES + `
      /* D-pad focus ring for TV navigation */
      .tv-focusable:focus {
        outline: 2px solid rgba(0,163,163,0.8);
        outline-offset: 2px;
        box-shadow: 0 0 12px rgba(0,163,163,0.4);
      }
      .tv-focusable:focus:not(:focus-visible) {
        outline: none;
        box-shadow: none;
      }
    `;
    document.head.appendChild(style);
    registerMediaSW().then(() => requestPersistentStorage());
    const unsub = onCacheProgress(setSyncProgress);

    // Auto-enter fullscreen on first user interaction (required by browsers)
    const requestFullscreen = () => {
      const el = document.documentElement;
      const rfs = el.requestFullscreen
        || (el as any).webkitRequestFullscreen
        || (el as any).mozRequestFullScreen
        || (el as any).msRequestFullscreen;
      if (rfs) {
        rfs.call(el).catch(() => {});
      }
    };

    // Try immediately (works in native Capacitor / standalone PWA)
    requestFullscreen();

    // Fallback: enter fullscreen on first touch/click (browser requirement)
    const onInteraction = () => {
      requestFullscreen();
      window.removeEventListener("click", onInteraction);
      window.removeEventListener("touchstart", onInteraction);
    };
    window.addEventListener("click", onInteraction, { once: true });
    window.addEventListener("touchstart", onInteraction, { once: true });

    // Hide cursor after 3s of inactivity
    let cursorTimer: ReturnType<typeof setTimeout>;
    const hideCursor = () => {
      document.body.style.cursor = "none";
    };
    const showCursor = () => {
      document.body.style.cursor = "";
      clearTimeout(cursorTimer);
      cursorTimer = setTimeout(hideCursor, 3000);
    };
    document.addEventListener("mousemove", showCursor);
    cursorTimer = setTimeout(hideCursor, 3000);

    return () => {
      document.head.removeChild(style);
      unsub();
      window.removeEventListener("click", onInteraction);
      window.removeEventListener("touchstart", onInteraction);
      document.removeEventListener("mousemove", showCursor);
      clearTimeout(cursorTimer);
      document.body.style.cursor = "";
    };
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
  // ── BREAKING ALERT REALTIME LISTENER ──
  useEffect(() => {
    const channel = supabase
      .channel("screen-alerts")
      .on("broadcast", { event: "flash-alert" }, () => {
        clearTimeout(alertTimerRef.current);
        setAlertActive(true);
        alertTimerRef.current = setTimeout(() => setAlertActive(false), 30_000);
      })
      .on("broadcast", { event: "clear-alert" }, () => {
        clearTimeout(alertTimerRef.current);
        setAlertActive(false);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
      clearTimeout(alertTimerRef.current);
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

  // Activation sequence: unlock → welcome → handover → paired (~3s total)
  const triggerActivation = useCallback(() => {
    setActivating(true);
    setActivationPhase("unlock");
    // Phase 1: unlock shimmer + dissolve (1s)
    setTimeout(() => setActivationPhase("welcome"), 1000);
    // Phase 2: welcome message (1.5s)
    setTimeout(() => setActivationPhase("handover"), 2500);
    // Phase 3: handover cross-fade to content (0.5s)
    setTimeout(() => {
      setActivating(false);
      setActivationPhase(null);
      setPaired(true);
    }, 3000);
  }, []);

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

  // ── STANDALONE ENTRY: No URL param, no stored screen → create pairing code via edge function ──
  const [pendingPairingId, setPendingPairingId] = useState<string | null>(null);

  useEffect(() => {
    if (urlPairingCode || screenId) return; // handled by other flows

    const createPendingPairing = async () => {
      try {
        const res = await supabase.functions.invoke("create-pending-screen");
        if (res.error || !res.data) {
          console.error("Failed to create pairing:", res.error);
          setLoading(false);
          return;
        }
        const { pairing_id, pairing_code } = res.data as { pairing_id: string; pairing_code: string };
        setPendingPairingId(pairing_id);
        setPairingCode(pairing_code);
        setLoading(false);
      } catch (err) {
        console.error("Edge function error:", err);
        setLoading(false);
      }
    };

    createPendingPairing();
  }, [urlPairingCode, screenId]);

  // ── Watch for pairing to be claimed (screen_id gets set on the pairing record) ──
  useEffect(() => {
    if (!pendingPairingId || paired || screenId) return;

    const pollInterval = setInterval(async () => {
      const { data: pairing } = await supabase
        .from("pairings")
        .select("screen_id")
        .eq("id", pendingPairingId)
        .maybeSingle();

      if (pairing?.screen_id) {
        clearInterval(pollInterval);
        setScreenId(pairing.screen_id);
        localStorage.setItem("glowhub_screen_id", pairing.screen_id);
        setPendingPairingId(null);
        triggerActivation();

        // Fetch playlist if assigned
        const { data: screen } = await supabase
          .from("screens")
          .select("current_playlist_id, transition_type, crossfade_ms, loop_enabled")
          .eq("id", pairing.screen_id)
          .maybeSingle();

        if (screen) {
          if (screen.transition_type) setTransitionType(screen.transition_type);
          if (screen.crossfade_ms != null) setCrossfadeDuration(screen.crossfade_ms);
          if (screen.loop_enabled != null) setLoopEnabled(screen.loop_enabled);
          if (screen.current_playlist_id) await fetchPlaylist(screen.current_playlist_id);
        }
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [pendingPairingId, paired, screenId, triggerActivation, fetchPlaylist]);

  // ── STORED SCREEN: Already paired, jump straight to playback ──
  useEffect(() => {
    if (!screenId || urlPairingCode) return; // let URL-param flow handle it
    if (paired) return;

    const checkStoredScreen = async () => {
      const { data: screen } = await supabase
        .from("screens")
        .select("id, current_playlist_id, pairing_code, status, transition_type, crossfade_ms, loop_enabled")
        .eq("id", screenId)
        .maybeSingle();

      if (!screen) {
        // Screen was deleted — clear localStorage and reset
        localStorage.removeItem("glowhub_screen_id");
        setScreenId(null);
        setPairingCode(null);
        setLoading(false);
        return;
      }

      if (screen.status === "pending" || screen.pairing_code) {
        // Still pending — show pairing code
        setPairingCode(screen.pairing_code);
        setLoading(false);
        return;
      }

      // Screen is claimed — apply settings and go to playback
      if (screen.transition_type) setTransitionType(screen.transition_type);
      if (screen.crossfade_ms != null) setCrossfadeDuration(screen.crossfade_ms);
      if (screen.loop_enabled != null) setLoopEnabled(screen.loop_enabled);
      setPaired(true);
      if (screen.current_playlist_id) {
        await fetchPlaylist(screen.current_playlist_id);
      }
      setLoading(false);
    };

    checkStoredScreen();

    // Check watermark status for free-tier users
    if (screenId) {
      supabase.functions.invoke("check-watermark", { body: { screen_id: screenId } })
        .then(({ data }) => { if (data?.show) setShowWatermark(true); else setShowWatermark(false); })
        .catch(() => {});
    }
  }, [screenId, urlPairingCode, paired, fetchPlaylist]);

  // ── REALTIME: Listen for screen being claimed (pairing_code cleared, user_id set) ──
  useEffect(() => {
    if (!screenId || paired) return;

    const channel = supabase
      .channel(`pairing-watch-${screenId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "screens", filter: `id=eq.${screenId}` },
        async (payload) => {
          const updated = payload.new as any;
          // Screen claimed when pairing_code is cleared and status changes from pending
          if (!updated.pairing_code && updated.status !== "pending") {
            localStorage.setItem("glowhub_screen_id", screenId);
            triggerActivation();
            if (updated.current_playlist_id) {
              await fetchPlaylist(updated.current_playlist_id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [screenId, paired, fetchPlaylist, triggerActivation]);

  // Poll for pairing status (URL param flow — legacy support)
  useEffect(() => {
    if (!urlPairingCode) return;

    const checkPairing = async () => {
      // Find screen with this pairing code
      const { data: screen } = await supabase
        .from("screens")
        .select("id, current_playlist_id, pairing_code")
        .eq("pairing_code", urlPairingCode)
        .maybeSingle();

      if (screen) {
        setScreenId(screen.id);
        setPaired(false);
        setLoading(false);
        return;
      }

      // Maybe the screen was already paired (pairing_code cleared)
      const { data: pairing } = await supabase
        .from("pairings")
        .select("screen_id")
        .eq("pairing_code", urlPairingCode)
        .maybeSingle();

      if (pairing?.screen_id) {
        setScreenId(pairing.screen_id);
        localStorage.setItem("glowhub_screen_id", pairing.screen_id);
        setPaired(true);

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

      const { data: screen } = await supabase
        .from("screens")
        .select("id, current_playlist_id, pairing_code, user_id")
        .eq("pairing_code", urlPairingCode)
        .maybeSingle();

      if (screen) {
        setScreenId(screen.id);
        return;
      }

      if (screenId) {
        const { data: s } = await supabase
          .from("screens")
          .select("id, current_playlist_id, pairing_code")
          .eq("id", screenId)
          .maybeSingle();

        if (s && !s.pairing_code) {
          localStorage.setItem("glowhub_screen_id", s.id);
          setPaired(true);
          if (s.current_playlist_id) {
            await fetchPlaylist(s.current_playlist_id);
          }
          clearInterval(interval);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [urlPairingCode, paired, screenId, fetchPlaylist]);

  // ── SYNC GROUP: Detect if this screen is part of a sync group for offset rendering ──
  useEffect(() => {
    if (!screenId || !paired) return;
    const fetchSyncGroup = async () => {
      const { data: membership } = await supabase
        .from("sync_group_screens")
        .select("sync_group_id, position")
        .eq("screen_id", screenId)
        .maybeSingle();
      if (!membership) { setSyncInfo(null); return; }

      const [groupRes, membersRes] = await Promise.all([
        supabase.from("sync_groups").select("orientation, playlist_id").eq("id", membership.sync_group_id).single(),
        supabase.from("sync_group_screens").select("id").eq("sync_group_id", membership.sync_group_id),
      ]);

      if (groupRes.data && membersRes.data) {
        setSyncInfo({
          position: membership.position,
          total: membersRes.data.length,
          orientation: groupRes.data.orientation as "horizontal" | "vertical",
        });

        // If sync group has an assigned playlist, use it
        const groupPlaylistId = (groupRes.data as any).playlist_id;
        if (groupPlaylistId) {
          fetchPlaylist(groupPlaylistId);
        }
      }
    };
    fetchSyncGroup();

    // Listen for sync group changes
    const channel = supabase
      .channel(`sync-group-${screenId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sync_group_screens" }, () => fetchSyncGroup())
      .on("postgres_changes", { event: "*", schema: "public", table: "sync_groups" }, () => fetchSyncGroup())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [screenId, paired, fetchPlaylist]);


  useEffect(() => {
    if (!screenId || !paired) return;

    const channel = supabase
      .channel(`player-screen-${screenId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "screens", filter: `id=eq.${screenId}` },
        (payload) => {
          const updated = payload.new as any;
          if (updated.current_playlist_id) {
            fetchPlaylist(updated.current_playlist_id);
          }
          // Apply playback settings in real-time
          if (updated.transition_type) setTransitionType(updated.transition_type);
          if (updated.crossfade_ms != null) setCrossfadeDuration(updated.crossfade_ms);
          if (updated.loop_enabled != null) setLoopEnabled(updated.loop_enabled);
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

    const nextIndex = (currentIndex + 1) % items.length;

    // If loop is off and we've reached the end, stop
    if (!loopEnabled && nextIndex === 0) {
      return;
    }

    swapLockRef.current = true;

    // Clear any pending timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);

    // For "cut" transition, use 0ms crossfade
    const effectiveDuration = transitionType === "cut" ? 0 : crossfadeDuration;

    if (transitionType === "fade-to-black") {
      // Phase 1: fade current buffer to black
      setFadeToBlackActive(true);
      setTimeout(() => {
        // Phase 2: swap buffer while screen is black
        setCurrentIndex(nextIndex);
        setActiveBuffer((prev) => (prev === "A" ? "B" : "A"));
        setBufferLoading(false);
        // Phase 3: fade up from black after a brief hold
        setTimeout(() => {
          setFadeToBlackActive(false);
          setTimeout(() => {
            swapLockRef.current = false;
          }, crossfadeDuration);
        }, 150); // brief black hold
      }, crossfadeDuration);
    } else {
      // Normal crossfade or cut
      setCurrentIndex(nextIndex);
      setActiveBuffer((prev) => (prev === "A" ? "B" : "A"));
      setBufferLoading(false);

      // Unlock after crossfade completes
      setTimeout(() => {
        swapLockRef.current = false;
      }, Math.max(effectiveDuration, 50));
    }
  }, [items.length, crossfadeDuration, transitionType, loopEnabled, currentIndex]);

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

  // ── Cinematic Splash on every launch ──
  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem("glowhub_splash_seen", "1");
    setBootPhase("done");
  }, []);

  if (bootPhase !== "done") {
    return <CinematicSplash onComplete={handleSplashComplete} syncProgress={syncProgress} />;
  }

  // ── PAIRING CODE SCREEN ──
  if (!paired) {
    const rawCode = pairingCode || "";
    // Format as XX-XX-XX for display
    const formattedCode = rawCode.length === 6
      ? `${rawCode.slice(0, 2)}-${rawCode.slice(2, 4)}-${rawCode.slice(4, 6)}`
      : rawCode;
    const pairUrl = `https://glowhub-pixel.lovable.app/pair?code=${rawCode}`;

    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center select-none overflow-hidden relative">
        {/* ── Pure black base ── */}
        <div className="absolute inset-0 bg-black" />

        {/* ── Deep Space Nebula: 3 massive blurred blobs ── */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Teal blob */}
          <div
            className="absolute rounded-full"
            style={{
              width: "900px", height: "900px",
              top: "10%", left: "5%",
              background: "radial-gradient(circle, rgba(0,163,163,0.45) 0%, transparent 70%)",
              filter: "blur(150px)",
              animation: "nebulaBlob1 18s ease-in-out infinite alternate",
            }}
          />
          {/* Deep Blue blob */}
          <div
            className="absolute rounded-full"
            style={{
              width: "1100px", height: "1100px",
              top: "30%", right: "-10%",
              background: "radial-gradient(circle, rgba(26,54,93,0.6) 0%, transparent 70%)",
              filter: "blur(150px)",
              animation: "nebulaBlob2 22s ease-in-out infinite alternate",
            }}
          />
          {/* Violet blob */}
          <div
            className="absolute rounded-full"
            style={{
              width: "800px", height: "800px",
              bottom: "0%", left: "30%",
              background: "radial-gradient(circle, rgba(109,40,217,0.35) 0%, transparent 70%)",
              filter: "blur(150px)",
              animation: "nebulaBlob3 20s ease-in-out infinite alternate",
            }}
          />
        </div>

        {/* ── Main content with entry animation ── */}
        <div
          className="relative z-10 flex flex-col items-center justify-center"
          style={{
            animation: "powerUp 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            opacity: 0,
          }}
        >
          {/* GLOW logo with light burst */}
          <div className="relative mb-10">
            {/* Expanding light rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="pairing-ring pairing-ring-1" />
              <div className="pairing-ring pairing-ring-2" />
              <div className="pairing-ring pairing-ring-3" />
            </div>
            {/* Central bloom */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ transform: "scale(2)" }}
            >
              <div
                style={{
                  width: "200px", height: "200px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(0,163,163,0.3) 0%, rgba(0,163,163,0.08) 40%, transparent 70%)",
                  animation: "bloomPulsePair 3s ease-in-out infinite",
                }}
              />
            </div>
            <img
              src={glowLogoPng}
              alt="Glow"
              className="h-16 lg:h-20 w-auto relative z-10 glow-text-pulse"
            />
          </div>

          {/* Hero pairing code + QR side by side */}
          <div className="flex items-center gap-12 lg:gap-16">
            {/* Code section */}
            <div className="flex flex-col items-center">
              <p className="text-white/50 text-sm tracking-[0.3em] uppercase mb-6 font-medium">
                Pair Your Screen
              </p>

              {/* Neon Glass Code */}
              <div
                className="font-mono font-extrabold tracking-[0.25em] leading-none"
                style={{
                  fontSize: "clamp(3rem, 8vw, 6rem)",
                  background: "linear-gradient(180deg, #ffffff 20%, #00A3A3 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  textShadow: "none",
                  filter: "drop-shadow(0 0 30px rgba(0,163,163,0.5)) drop-shadow(0 0 60px rgba(0,163,163,0.25))",
                  animation: "neonPulse 3s ease-in-out infinite",
                }}
              >
                {formattedCode.toUpperCase()}
              </div>

              <p className="text-white/30 text-sm mt-6 tracking-wide">
                Enter this code in your <span className="text-[#00A3A3]/70">Glow Dashboard</span> to pair
              </p>
            </div>

            {/* QR Code section */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-[#00A3A3]/60 text-xs tracking-[0.2em] uppercase font-medium animate-pulse">
                Scan to Connect
              </p>
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(40px)",
                  border: "1px solid rgba(0,163,163,0.25)",
                  boxShadow: "0 0 30px rgba(0,163,163,0.1), inset 0 0 20px rgba(0,163,163,0.03)",
                }}
              >
                <QRCodeSVG
                  value={pairUrl}
                  size={140}
                  bgColor="transparent"
                  fgColor="#00A3A3"
                  level="M"
                  style={{ display: "block" }}
                />
              </div>
            </div>
          </div>

          {/* Waiting indicator */}
          <div className="flex items-center gap-2 mt-10">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00A3A3] animate-pulse" />
            <span className="text-white/25 text-xs tracking-widest uppercase">
              Waiting for pairing…
            </span>
          </div>
        </div>

        {/* ── Bottom: Logo + Connection dot ── */}
        <div className="absolute bottom-8 left-0 right-0 z-10 flex items-end justify-between px-10">
          {/* Logo center */}
          <div className="flex-1" />
          <img
            src={glowLogoPng}
            alt="Glow"
            className="h-8 w-auto select-none glow-text-pulse"
            style={{ opacity: 0.3 }}
          />
          <div className="flex-1 flex justify-end">
            {/* Connection status dot */}
            <div className="flex items-center gap-2">
              <span className="text-white/20 text-[10px] tracking-wider uppercase font-mono">
                {navigator.onLine ? "Connected" : "Offline"}
              </span>
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: navigator.onLine ? "#22c55e" : "#ef4444",
                  boxShadow: navigator.onLine
                    ? "0 0 8px rgba(34,197,94,0.6), 0 0 20px rgba(34,197,94,0.3)"
                    : "0 0 8px rgba(239,68,68,0.6)",
                  animation: navigator.onLine ? "statusGlow 2s ease-in-out infinite" : "none",
                }}
              />
            </div>
          </div>
        </div>

        <style>{`
          @keyframes nebulaBlob1 {
            0% { transform: translate(0, 0) scale(1) rotate(0deg); }
            100% { transform: translate(80px, -60px) scale(1.15) rotate(15deg); }
          }
          @keyframes nebulaBlob2 {
            0% { transform: translate(0, 0) scale(1.05) rotate(0deg); }
            100% { transform: translate(-70px, 50px) scale(0.9) rotate(-10deg); }
          }
          @keyframes nebulaBlob3 {
            0% { transform: translate(0, 0) scale(1) rotate(0deg); }
            100% { transform: translate(60px, -40px) scale(1.2) rotate(20deg); }
          }
          @keyframes powerUp {
            0% { opacity: 0; transform: scale(0.9); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes neonPulse {
            0%, 100% {
              filter: drop-shadow(0 0 30px rgba(0,163,163,0.5)) drop-shadow(0 0 60px rgba(0,163,163,0.25));
            }
            50% {
              filter: drop-shadow(0 0 45px rgba(0,163,163,0.7)) drop-shadow(0 0 90px rgba(0,163,163,0.35)) drop-shadow(0 0 120px rgba(0,163,163,0.15));
            }
          }
          @keyframes statusGlow {
            0%, 100% { box-shadow: 0 0 8px rgba(34,197,94,0.6), 0 0 20px rgba(34,197,94,0.3); }
            50% { box-shadow: 0 0 12px rgba(34,197,94,0.8), 0 0 30px rgba(34,197,94,0.4), 0 0 50px rgba(34,197,94,0.15); }
          }
          @keyframes bloomPulsePair {
            0%, 100% { transform: scale(0.9); opacity: 0.5; }
            50% { transform: scale(1.15); opacity: 1; }
          }
          .pairing-ring {
            position: absolute;
            border-radius: 50%;
            border: 1px solid rgba(0,163,163,0.2);
            animation: pairingRingExpand 4s ease-out infinite;
          }
          .pairing-ring-1 { width: 80px; height: 80px; animation-delay: 0s; }
          .pairing-ring-2 { width: 80px; height: 80px; animation-delay: 1.3s; }
          .pairing-ring-3 { width: 80px; height: 80px; animation-delay: 2.6s; }
          @keyframes pairingRingExpand {
            0% { transform: scale(1); opacity: 0.5; border-color: rgba(0,163,163,0.3); }
            100% { transform: scale(5); opacity: 0; border-color: rgba(0,163,163,0); }
          }
        `}</style>
      </div>
    );
  }

  // ── ACTIVATION SEQUENCE ──
  if (activating && activationPhase) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center select-none overflow-hidden relative">
        {/* Pure black base */}
        <div className="absolute inset-0 bg-black" />

        {/* Nebula blobs — speed up during unlock phase */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute rounded-full"
            style={{
              width: "900px", height: "900px",
              top: "10%", left: "5%",
              background: "radial-gradient(circle, rgba(0,163,163,0.55) 0%, transparent 70%)",
              filter: "blur(150px)",
              animation: activationPhase === "unlock"
                ? "nebulaFast1 2s ease-in-out infinite alternate"
                : "nebulaBlob1 18s ease-in-out infinite alternate",
              transition: "all 1s ease",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: "1100px", height: "1100px",
              top: "30%", right: "-10%",
              background: "radial-gradient(circle, rgba(26,54,93,0.7) 0%, transparent 70%)",
              filter: "blur(150px)",
              animation: activationPhase === "unlock"
                ? "nebulaFast2 1.8s ease-in-out infinite alternate"
                : "nebulaBlob2 22s ease-in-out infinite alternate",
              transition: "all 1s ease",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: "800px", height: "800px",
              bottom: "0%", left: "30%",
              background: "radial-gradient(circle, rgba(109,40,217,0.45) 0%, transparent 70%)",
              filter: "blur(150px)",
              animation: activationPhase === "unlock"
                ? "nebulaFast3 1.5s ease-in-out infinite alternate"
                : "nebulaBlob3 20s ease-in-out infinite alternate",
              transition: "all 1s ease",
            }}
          />
        </div>

        {/* Phase: Unlock — code dissolves */}
        {activationPhase === "unlock" && (
          <div
            className="relative z-10 flex flex-col items-center"
            style={{ animation: "unlockDissolve 0.9s ease-in forwards" }}
          >
            <div
              className="font-mono font-extrabold tracking-[0.25em] leading-none"
              style={{
                fontSize: "clamp(3rem, 8vw, 6rem)",
                background: "linear-gradient(180deg, #ffffff 20%, #00A3A3 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "shimmerText 0.6s ease-in-out 3",
              }}
            >
              ✓
            </div>
          </div>
        )}

        {/* Phase: Welcome — checkmark + system activated */}
        {(activationPhase === "welcome" || activationPhase === "handover") && (
          <div
            className="relative z-10 flex flex-col items-center"
            style={{
              animation: activationPhase === "handover"
                ? "fadeOutScale 0.5s ease-in forwards"
                : "powerUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              opacity: activationPhase === "handover" ? 1 : 0,
            }}
          >
            {/* Glowing checkmark in glass circle */}
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center mb-8"
              style={{
                background: "rgba(0,163,163,0.08)",
                backdropFilter: "blur(40px)",
                border: "1px solid rgba(0,163,163,0.3)",
                boxShadow: "0 0 40px rgba(0,163,163,0.3), 0 0 80px rgba(0,163,163,0.15), inset 0 0 30px rgba(0,163,163,0.05)",
              }}
            >
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="url(#checkGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="checkGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#00A3A3" />
                  </linearGradient>
                </defs>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            {/* SYSTEM ACTIVATED text */}
            <h1
              className="font-mono font-bold tracking-[0.4em] uppercase mb-3"
              style={{
                fontSize: "clamp(1.2rem, 3vw, 2rem)",
                background: "linear-gradient(180deg, #ffffff 30%, #00A3A3 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 20px rgba(0,163,163,0.5))",
              }}
            >
              System Activated
            </h1>

            <p className="text-white/40 text-sm tracking-wider">
              Synchronizing your first playlist…
            </p>

            {/* Thin glowing progress bar */}
            <div className="w-64 h-0.5 mt-8 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #00A3A3, #ffffff, #00A3A3)",
                  backgroundSize: "200% 100%",
                  animation: "progressShimmer 1.5s ease-in-out infinite, progressGrow 3s ease-out forwards",
                }}
              />
            </div>
          </div>
        )}

        {/* Bottom logo — subtle */}
        <img
          src={glowLogoPng}
          alt="Glow"
          className="absolute bottom-8 z-10 h-8 w-auto select-none"
          style={{ opacity: 0.15, animation: "logoPulse 4s ease-in-out infinite" }}
        />

        <style>{`
          @keyframes nebulaBlob1 {
            0% { transform: translate(0, 0) scale(1) rotate(0deg); }
            100% { transform: translate(80px, -60px) scale(1.15) rotate(15deg); }
          }
          @keyframes nebulaBlob2 {
            0% { transform: translate(0, 0) scale(1.05) rotate(0deg); }
            100% { transform: translate(-70px, 50px) scale(0.9) rotate(-10deg); }
          }
          @keyframes nebulaBlob3 {
            0% { transform: translate(0, 0) scale(1) rotate(0deg); }
            100% { transform: translate(60px, -40px) scale(1.2) rotate(20deg); }
          }
          @keyframes nebulaFast1 {
            0% { transform: translate(0, 0) scale(1) rotate(0deg); }
            100% { transform: translate(150px, -120px) scale(1.3) rotate(45deg); }
          }
          @keyframes nebulaFast2 {
            0% { transform: translate(0, 0) scale(1.05) rotate(0deg); }
            100% { transform: translate(-140px, 100px) scale(0.8) rotate(-30deg); }
          }
          @keyframes nebulaFast3 {
            0% { transform: translate(0, 0) scale(1) rotate(0deg); }
            100% { transform: translate(120px, -80px) scale(1.4) rotate(60deg); }
          }
          @keyframes unlockDissolve {
            0% { opacity: 1; transform: scale(1); filter: blur(0); }
            50% { opacity: 0.8; transform: scale(1.1); filter: blur(0); }
            100% { opacity: 0; transform: scale(1.5); filter: blur(20px); }
          }
          @keyframes shimmerText {
            0%, 100% { filter: brightness(1); }
            50% { filter: brightness(2); }
          }
          @keyframes powerUp {
            0% { opacity: 0; transform: scale(0.9); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes fadeOutScale {
            0% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0.95); filter: blur(5px); }
          }
          @keyframes progressShimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          @keyframes progressGrow {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          @keyframes logoPulse {
            0%, 100% { opacity: 0.15; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </div>
    );
  }

  // ── NO CONTENT — Screen Saver Mode ──
  if (items.length === 0) {
    return <ScreenSaver delayMs={screensaverDelay} />;
  }

  // ── PLAYER ──
  const currentItem = items[currentIndex];
  const nextIndex = (currentIndex + 1) % items.length;
  const nextItem = items.length > 1 ? items[nextIndex] : null;
  const currentUrl = getPublicUrl(currentItem.media.storage_path);
  const nextUrl = nextItem ? getPublicUrl(nextItem.media.storage_path) : null;

  // Compute sync offset styles for multi-screen spanning
  const syncMediaStyle: React.CSSProperties = {};
  if (syncInfo && syncInfo.total > 1) {
    const { position, total, orientation } = syncInfo;
    if (orientation === "horizontal") {
      // Scale content to total width, offset by position
      syncMediaStyle.width = `${total * 100}%`;
      syncMediaStyle.height = "100%";
      syncMediaStyle.maxWidth = "none";
      syncMediaStyle.maxHeight = "none";
      syncMediaStyle.objectFit = "cover";
      syncMediaStyle.objectPosition = `${(position / (total - 1)) * 100}% center`;
      syncMediaStyle.position = "absolute";
      syncMediaStyle.top = "0";
      syncMediaStyle.left = `-${position * 100}%`;
    } else {
      syncMediaStyle.height = `${total * 100}%`;
      syncMediaStyle.width = "100%";
      syncMediaStyle.maxWidth = "none";
      syncMediaStyle.maxHeight = "none";
      syncMediaStyle.objectFit = "cover";
      syncMediaStyle.objectPosition = `center ${(position / (total - 1)) * 100}%`;
      syncMediaStyle.position = "absolute";
      syncMediaStyle.left = "0";
      syncMediaStyle.top = `-${position * 100}%`;
    }
  }
  const mediaClassName = syncInfo && syncInfo.total > 1
    ? "absolute inset-0"
    : "max-w-full max-h-screen object-contain absolute inset-0 m-auto";

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden relative" style={{ animation: "contentFadeIn 1.2s ease-out forwards" }}>
      {/* Branded loading placeholder — shown when media takes >2s to load */}
      {bufferLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[hsl(215,55%,10%)]">
          <GHLoader size={60} />
        </div>
      )}

      {/* Fade-to-black overlay */}
      <div
        className="absolute inset-0 bg-black transition-opacity ease-in-out pointer-events-none"
        style={{
          opacity: fadeToBlackActive ? 1 : 0,
          zIndex: 15,
          transitionDuration: `${crossfadeDuration}ms`,
        }}
      />

      {/* Buffer A */}
      <div
        className="absolute inset-0 overflow-hidden transition-opacity ease-in-out"
        style={{
          opacity: activeBuffer === "A" ? 1 : 0,
          zIndex: activeBuffer === "A" ? 10 : 5,
          transitionDuration: `${transitionType === "cut" ? 0 : crossfadeDuration}ms`,
        }}
      >
        <img
          ref={imgRefA}
          alt=""
          className={mediaClassName}
          style={{
            display: activeBuffer === "A" && currentItem.media.type === "image" ? "block" : "none",
            ...syncMediaStyle,
          }}
          onError={() => handleMediaError(currentItem.media.id, `Image failed to load: ${currentItem.media.name}`)}
        />
        <video
          ref={videoRefA}
          className={mediaClassName}
          style={{
            display: activeBuffer === "A" && currentItem.media.type === "video" ? "block" : "none",
            ...syncMediaStyle,
          }}
          muted autoPlay playsInline preload="auto"
          onEnded={advanceToNext}
          onError={() => handleMediaError(currentItem.media.id, `Video failed to play: ${currentItem.media.name}`)}
        />
      </div>

      {/* Buffer B */}
      <div
        className="absolute inset-0 overflow-hidden transition-opacity ease-in-out"
        style={{
          opacity: activeBuffer === "B" ? 1 : 0,
          zIndex: activeBuffer === "B" ? 10 : 5,
          transitionDuration: `${transitionType === "cut" ? 0 : crossfadeDuration}ms`,
        }}
      >
        <img
          ref={imgRefB}
          alt=""
          className={mediaClassName}
          style={{
            display: activeBuffer === "B" && currentItem.media.type === "image" ? "block" : "none",
            ...syncMediaStyle,
          }}
          onError={() => handleMediaError(currentItem.media.id, `Image failed to load: ${currentItem.media.name}`)}
        />
        <video
          ref={videoRefB}
          className={mediaClassName}
          style={{
            display: activeBuffer === "B" && currentItem.media.type === "video" ? "block" : "none",
            ...syncMediaStyle,
          }}
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

      {/* Settings hint overlay — shown once on first load */}
      {showSettingsHint && !showSettings && (
        <div
          className="fixed top-5 right-16 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-black/80 backdrop-blur-md border border-[rgba(0,163,163,0.3)] shadow-lg"
          style={{
            animation: "settingsHintIn 0.5s ease-out forwards, settingsHintOut 0.5s ease-in 4.5s forwards",
          }}
          onAnimationEnd={(e) => {
            if (e.animationName === "settingsHintOut") {
              setShowSettingsHint(false);
              localStorage.setItem("glowhub_settings_hint_seen", "1");
            }
          }}
        >
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-white/90 text-xs font-mono font-bold">M</kbd>
          <span className="text-white/70 text-xs tracking-wide">Press for settings</span>
        </div>
      )}

      <style>{`
        @keyframes settingsHintIn {
          0% { opacity: 0; transform: translateX(10px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes settingsHintOut {
          0% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(10px); }
        }
      `}</style>

      {/* Power Settings panel */}
      {showSettings && (
        <div ref={settingsPanelRef} className="fixed top-16 right-4 z-50 w-72 rounded-xl bg-black/90 backdrop-blur-md border border-white/10 p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
          <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4" /> Power Settings
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/90 text-sm font-medium">Launch on Boot</p>
              <p className="text-white/50 text-xs mt-0.5">
                {isNative
                  ? "Start Glow when device powers on"
                  : "Only available in the native app"}
              </p>
            </div>
            <button
              disabled={!isNative}
              onClick={handleAutoStartToggle}
              className={`tv-focusable relative w-11 h-6 rounded-full transition-colors duration-200 ${
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
                className="tv-focusable text-white/70 hover:text-white transition-colors rounded"
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
                className="tv-focusable flex-1 h-1 rounded-full appearance-none cursor-pointer"
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
                className={`tv-focusable relative w-11 h-6 rounded-full transition-colors duration-200 ${
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
                className="tv-focusable flex-1 h-1 rounded-full appearance-none cursor-pointer"
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

          {/* Auto-update interval */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-white/90 text-sm font-medium mb-2">Auto-Update Check</p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={updateInterval / 60000}
                onChange={(e) => {
                  const mins = parseInt(e.target.value, 10);
                  const ms = mins * 60000;
                  setUpdateInterval(ms);
                  localStorage.setItem("glowhub_update_interval_ms", String(ms));
                }}
                className="tv-focusable flex-1 h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #00A3A3 ${(updateInterval / 60000 / 30) * 100}%, rgba(255,255,255,0.15) ${(updateInterval / 60000 / 30) * 100}%)`,
                }}
              />
              <span className="text-white/40 text-xs font-mono w-12 text-right">
                {updateInterval === 0 ? "Off" : `${updateInterval / 60000}m`}
              </span>
            </div>
            <p className="text-white/50 text-xs mt-1">How often to check for new deployments</p>
          </div>

          {/* Screen saver delay */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-white/90 text-sm font-medium mb-2">Screen Saver Delay</p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={screensaverDelay / 1000}
                onChange={(e) => {
                  const ms = parseInt(e.target.value, 10) * 1000;
                  setScreensaverDelay(ms);
                  localStorage.setItem("glowhub_screensaver_delay_ms", String(ms));
                }}
                className="tv-focusable flex-1 h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #00A3A3 ${((screensaverDelay / 1000 - 5) / 115) * 100}%, rgba(255,255,255,0.15) ${((screensaverDelay / 1000 - 5) / 115) * 100}%)`,
                }}
              />
              <span className="text-white/40 text-xs font-mono w-12 text-right">
                {screensaverDelay / 1000}s
              </span>
            </div>
            <p className="text-white/50 text-xs mt-1">Time before screen saver activates (no content)</p>
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
                  className="tv-focusable text-[10px] text-red-400 hover:text-red-300 transition-colors px-1.5 py-0.5 rounded border border-red-400/30 hover:border-red-400/50"
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
          {/* Unpair device */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={() => setShowUnpairConfirm(true)}
              className="tv-focusable w-full text-sm text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/50 rounded-lg px-3 py-2 transition-colors"
            >
              Unpair Device
            </button>
            <p className="text-white/50 text-[10px] mt-1.5 text-center">
              Clears stored screen ID and returns to pairing screen
            </p>
          </div>

          {isColdBoot.current && (
            <p className="text-[hsl(180,100%,45%)] text-xs mt-4 border-t border-white/10 pt-3">
              ⚡ Cold boot detected — skipped splash, playing content immediately.
            </p>
          )}
        </div>
      )}

      {/* Unpair confirmation dialog */}
      {showUnpairConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div data-dialog-focus className="bg-black/95 border border-white/10 rounded-xl p-6 w-80 shadow-2xl">
            <h4 className="text-white font-semibold text-sm mb-2">Unpair this device?</h4>
            <p className="text-white/50 text-xs mb-5">
              This will clear the stored screen ID and all cached settings. The device will return to the pairing code screen.
            </p>
            <div className="flex gap-3">
              <button
                autoFocus
                onClick={() => setShowUnpairConfirm(false)}
                className="tv-focusable flex-1 text-sm text-white/70 border border-white/20 rounded-lg px-3 py-2 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("glowhub_screen_id");
                  localStorage.removeItem("glowhub_crossfade_ms");
                  localStorage.removeItem("glowhub_alerts_muted");
                  localStorage.removeItem("glowhub_volume");
                  toast.success("Device unpaired — returning to pairing screen");
                  window.location.reload();
                }}
                className="tv-focusable flex-1 text-sm text-white bg-red-600 hover:bg-red-500 rounded-lg px-3 py-2 transition-colors"
              >
                Unpair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Install app banner */}
      {showInstallBanner && !isStandalone && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-black/85 backdrop-blur-md rounded-xl px-5 py-3 border border-[rgba(0,163,163,0.3)] shadow-lg shadow-[rgba(0,163,163,0.15)]">
          <Download className="w-5 h-5 text-[#00A3A3] shrink-0" />
          <div className="flex flex-col">
            <span className="text-white/90 text-sm font-semibold">Install Glow</span>
            <span className="text-white/50 text-xs">Add to home screen for kiosk mode</span>
          </div>
          <button
            onClick={async () => {
              if (installPrompt) {
                await installPrompt.prompt();
                const { outcome } = await installPrompt.userChoice;
                if (outcome === "accepted") {
                  setShowInstallBanner(false);
                  toast.success("Glow installed!");
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

      {/* Breaking Alert Overlay */}
      {alertActive && (
        <div className="fixed bottom-0 left-0 right-0 z-[55] alert-glitch-in" style={{ animation: "playerAlertGlowSpill 2s ease-in-out infinite" }}>
          <div className="w-full h-14 flex items-center overflow-hidden" style={{ background: "#FF0033", boxShadow: "0 -20px 60px rgba(255,0,51,0.4), 0 -40px 100px rgba(255,0,51,0.2)" }}>
            <div className="shrink-0 px-4 py-1 bg-black/30 flex items-center gap-2 h-full">
              <div className="w-2.5 h-2.5 rounded-full bg-white" style={{ animation: "playerAlertLiveFlash 0.5s ease-in-out infinite" }} />
              <span className="text-xs font-bold text-white tracking-widest font-mono">LIVE</span>
            </div>
            <div className="flex-1 overflow-hidden h-full flex items-center">
              <span
                className="inline-block whitespace-nowrap font-mono font-extrabold tracking-wider text-white uppercase"
                style={{
                  animation: "playerTickerScroll 12s linear infinite",
                  willChange: "transform",
                  fontSize: "18px",
                  textShadow: "0 0 10px rgba(255,255,255,0.6)",
                }}
              >
                ⚠ BREAKING ALERT · EMERGENCY BROADCAST · ATTENTION REQUIRED · ⚠ BREAKING ALERT · EMERGENCY BROADCAST ·
              </span>
            </div>
          </div>
          <style>{`
            .alert-glitch-in {
              animation: playerAlertGlitchIn 0.2s ease-out;
            }
            @keyframes playerAlertGlitchIn {
              0% { opacity: 0; background: white; }
              25% { opacity: 1; background: #FF0033; }
              50% { opacity: 0.3; background: white; }
              75% { opacity: 1; background: #FF0033; }
              100% { opacity: 1; background: #FF0033; }
            }
            @keyframes playerAlertLiveFlash {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.2; }
            }
            @keyframes playerAlertGlowSpill {
              0%, 100% { box-shadow: 0 -20px 60px rgba(255,0,51,0.3); }
              50% { box-shadow: 0 -30px 80px rgba(255,0,51,0.5), 0 -50px 120px rgba(255,0,51,0.2); }
            }
            @keyframes playerTickerScroll {
              0% { transform: translateX(100%); }
              100% { transform: translateX(-100%); }
            }
          `}</style>
        </div>
      )}

      {/* Powered by GLOW watermark for free-tier users */}
      {showWatermark && !showSettings && (
        <a href="https://glowhub-pixel.lovable.app/home" target="_blank" rel="noopener noreferrer" className="fixed bottom-4 left-4 z-30 flex items-center gap-1.5 opacity-40 hover:opacity-70 transition-opacity select-none no-underline">
          <img src={glowLogoPng} alt="" className="h-3 w-auto" />
          <span className="text-white/80 text-[10px] font-medium tracking-wider uppercase">Powered by</span>
          <span className="text-[#00A3A3] text-xs font-bold tracking-wide">GLOW</span>
        </a>
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
          <div data-dialog-focus className="bg-[hsl(var(--background))] border border-border rounded-lg p-6 max-w-xs w-full mx-4 shadow-xl space-y-4">
            <h3 className="text-foreground text-sm font-semibold">Clear Offline Cache?</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              This will delete all cached media files. The player will need to re-download them, which may cause interruptions if the device is offline.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                autoFocus
                onClick={() => setShowClearConfirm(false)}
                className="tv-focusable text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
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
                className="tv-focusable text-xs px-3 py-1.5 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
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
