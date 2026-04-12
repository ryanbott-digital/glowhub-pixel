import { useState, useEffect, useRef, useCallback } from "react";
import { AlertTriangle, X, ChevronRight, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const WARNING_TONE_STORAGE_KEY = "glowhub_offline_alert";

/** Generate a short digital warning tone using Web Audio API */
function playWarningTone() {
  if (localStorage.getItem(WARNING_TONE_STORAGE_KEY) === "false") return;

  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(80, now);
    osc1.frequency.linearRampToValueAtTime(60, now + 0.3);

    const osc2 = ctx.createOscillator();
    osc2.type = "square";
    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.setValueAtTime(330, now + 0.15);
    osc2.frequency.setValueAtTime(440, now + 0.3);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.linearRampToValueAtTime(0, now + 0.4);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.05, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600;

    osc1.connect(gain1).connect(filter).connect(ctx.destination);
    osc2.connect(gain2).connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.35);

    setTimeout(() => ctx.close(), 600);
  } catch {
    // Audio not supported or blocked
  }
}

interface FleetAlertBarProps {
  onFilterOffline: () => void;
}

export function FleetAlertBar({ onFilterOffline }: FleetAlertBarProps) {
  const { user } = useAuth();
  const [offlineCount, setOfflineCount] = useState(0);
  const [protectedOfflineCount, setProtectedOfflineCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const prevCountRef = useRef(0);
  const soundPlayedRef = useRef(false);

  const checkOfflineScreens = useCallback(async () => {
    if (!user) return;
    const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from("screens")
      .select("id, launch_on_boot")
      .eq("user_id", user.id)
      .lt("last_ping", cutoff);

    const allOffline = data ?? [];
    const newCount = allOffline.length;
    const protectedCount = allOffline.filter((s) => s.launch_on_boot).length;

    // Play warning tone if a screen just went offline
    if (newCount > prevCountRef.current && !soundPlayedRef.current) {
      playWarningTone();
      soundPlayedRef.current = true;
      setTimeout(() => { soundPlayedRef.current = false; }, 30_000);
    }

    prevCountRef.current = newCount;
    setOfflineCount(newCount);
    setProtectedOfflineCount(protectedCount);

    if (newCount > 0) setDismissed(false);
  }, [user]);

  useEffect(() => {
    checkOfflineScreens();
    const interval = setInterval(checkOfflineScreens, 30_000);
    return () => clearInterval(interval);
  }, [checkOfflineScreens]);

  if (offlineCount === 0 || dismissed) return null;

  const hasCritical = protectedOfflineCount > 0;

  return (
    <div className="space-y-2 mb-4">
      {/* Main fleet alert */}
      <div
        className="alert-bar-pulse flex items-center justify-between gap-3 px-4 py-2 rounded-xl cursor-pointer group transition-all"
        style={{
          background: "linear-gradient(135deg, hsla(348, 100%, 50%, 0.12), hsla(348, 100%, 50%, 0.06))",
          border: "1px solid hsla(348, 100%, 50%, 0.2)",
          boxShadow: "0 0 20px hsla(348, 100%, 50%, 0.1), inset 0 0 20px hsla(348, 100%, 50%, 0.03)",
        }}
        onClick={onFilterOffline}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertTriangle
            className="h-4 w-4 shrink-0"
            style={{ color: "hsl(348, 100%, 50%)" }}
          />
          <span
            className="text-xs font-bold tracking-wide uppercase truncate"
            style={{ color: "hsl(348, 100%, 65%)" }}
          >
            ATTENTION: {offlineCount} SCREEN{offlineCount !== 1 ? "S" : ""} REQUIRE{offlineCount === 1 ? "S" : ""} ADMIN INTERVENTION
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <ChevronRight
            className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity"
            style={{ color: "hsl(348, 100%, 60%)" }}
          />
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
            className="p-1 rounded-full transition-colors"
            style={{ color: "hsl(348, 100%, 60%)" }}
            aria-label="Dismiss alert"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Hardware Protected sub-alert */}
      {hasCritical && (
        <div
          className="flex items-center gap-2.5 px-4 py-2 rounded-xl cursor-pointer transition-all"
          style={{
            background: "linear-gradient(135deg, hsla(30, 100%, 50%, 0.12), hsla(348, 100%, 50%, 0.08))",
            border: "1px solid hsla(30, 100%, 50%, 0.25)",
            boxShadow: "0 0 15px hsla(30, 100%, 50%, 0.1)",
            animation: "pulse 2s ease-in-out infinite",
          }}
          onClick={onFilterOffline}
        >
          <ShieldAlert
            className="h-4 w-4 shrink-0"
            style={{ color: "hsl(30, 100%, 55%)" }}
          />
          <span
            className="text-xs font-bold tracking-wide uppercase truncate"
            style={{ color: "hsl(30, 100%, 65%)" }}
          >
            🛡️ {protectedOfflineCount} HARDWARE PROTECTED SCREEN{protectedOfflineCount !== 1 ? "S" : ""} DOWN — AUTO-RESTART MAY HAVE FAILED
          </span>
        </div>
      )}
    </div>
  );
}
