import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import glowLogoPng from "@/assets/glow-text.png";
import { Loader2 } from "lucide-react";
import type { CacheProgress } from "@/lib/media-cache";

interface CinematicSplashProps {
  onComplete: () => void;
  syncProgress?: CacheProgress | null;
}

type Phase = "ignition" | "bloom" | "hardware" | "syncing" | "ready" | "exit";

export function CinematicSplash({ onComplete, syncProgress }: CinematicSplashProps) {
  const [phase, setPhase] = useState<Phase>("ignition");
  const [autoComplete, setAutoComplete] = useState(false);
  const [skipped, setSkipped] = useState(false);

  const handleSkip = useCallback(() => {
    if (!skipped) {
      setSkipped(true);
      onComplete();
    }
  }, [skipped, onComplete]);

  // Skip on any key press or touch/click
  useEffect(() => {
    const onKey = () => handleSkip();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSkip]);

  // Compute percentage from syncProgress
  const percentage = useMemo(() => {
    if (!syncProgress || syncProgress.total === 0) return null;
    return Math.round((syncProgress.completed / syncProgress.total) * 100);
  }, [syncProgress]);

  // Phase timeline
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("bloom"), 1500);
    const t2 = setTimeout(() => setPhase("hardware"), 3000);
    const t3 = setTimeout(() => setPhase("syncing"), 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // When in syncing phase, check if sync is done (or no sync needed)
  useEffect(() => {
    if (phase !== "syncing") return;

    // If no sync progress or already complete, auto-advance after a brief delay
    const noSync = !syncProgress || syncProgress.total === 0;
    const syncDone = syncProgress && syncProgress.total > 0 && syncProgress.completed >= syncProgress.total;

    if (noSync && !autoComplete) {
      // Simulate progress for 2s then complete
      const timer = setTimeout(() => setAutoComplete(true), 2000);
      return () => clearTimeout(timer);
    }

    if (syncDone || autoComplete) {
      setPhase("ready");
    }
  }, [phase, syncProgress, autoComplete]);

  // "Ready" phase → exit after 1s
  useEffect(() => {
    if (phase !== "ready") return;
    const t = setTimeout(() => setPhase("exit"), 1000);
    return () => clearTimeout(t);
  }, [phase]);

  // Exit phase → call onComplete
  useEffect(() => {
    if (phase !== "exit") return;
    const t = setTimeout(onComplete, 700);
    return () => clearTimeout(t);
  }, [phase, onComplete]);

  // Simulated percentage when no real sync
  const displayPercentage = useMemo(() => {
    if (percentage !== null) return percentage;
    if (autoComplete) return 100;
    return null;
  }, [percentage, autoComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden flex items-center justify-center cursor-pointer" onClick={handleSkip}>
      <style>{`
        @keyframes scanLine {
          0% { top: -2px; opacity: 0; }
          10% { opacity: 1; }
          100% { top: 100%; opacity: 0.3; }
        }
        @keyframes shimmerSlide {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
        @keyframes glitchIn {
          0% { opacity: 0; transform: translateX(-5px); clip-path: inset(40% 0 40% 0); }
          20% { opacity: 1; transform: translateX(3px); clip-path: inset(10% 0 85% 0); }
          40% { transform: translateX(-2px); clip-path: inset(60% 0 5% 0); }
          60% { transform: translateX(1px); clip-path: inset(0 0 50% 0); }
          80% { transform: translateX(0); clip-path: inset(0); }
          100% { opacity: 1; transform: translateX(0); clip-path: inset(0); }
        }
        @keyframes glitchLoop {
          0%, 90%, 100% { transform: translateX(0); clip-path: inset(0); }
          92% { transform: translateX(-2px); clip-path: inset(20% 0 60% 0); }
          94% { transform: translateX(2px); clip-path: inset(50% 0 10% 0); }
          96% { transform: translateX(-1px); clip-path: inset(0); }
        }
        @keyframes singularityPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.5); opacity: 1; }
        }
        @keyframes progressGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* Phase 1: Ignition */}
      <AnimatePresence>
        {phase === "ignition" && (
          <>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute"
              style={{
                width: 4, height: 4, borderRadius: "50%", background: "white",
                boxShadow: "0 0 12px 4px rgba(255,255,255,0.6)",
                animation: "singularityPulse 0.8s ease-in-out infinite",
              }}
            />
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: [0, 1, 1, 0.6] }}
              transition={{ duration: 1.0, delay: 0.3, ease: "easeOut" }}
              className="absolute"
              style={{
                width: "100vw", height: 2,
                background: "linear-gradient(90deg, transparent, rgba(0,163,163,0.8) 30%, rgba(0,163,163,1) 50%, rgba(0,163,163,0.8) 70%, transparent)",
                transformOrigin: "center",
              }}
            />
            <div className="absolute left-0 right-0" style={{
              height: 2,
              background: "linear-gradient(90deg, transparent, rgba(0,163,163,0.8) 50%, transparent)",
              animation: "scanLine 1.2s 0.4s ease-out forwards",
              position: "absolute", top: "-2px",
            }} />
            <motion.img
              src={glowLogoPng} alt="Glow"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              className="relative z-10"
              style={{ height: "clamp(48px, 8vw, 80px)" }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Phase 2+: Bloom with logo, status text, progress bar */}
      <AnimatePresence>
        {phase !== "ignition" && phase !== "exit" && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Radiant glow backdrop */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{
                  width: "min(600px, 80vw)", height: "min(600px, 80vw)", borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(0,163,163,0.25) 0%, rgba(60,80,180,0.1) 40%, transparent 70%)",
                }}
              />
            </div>

            {/* Logo with shimmer */}
            <div className="relative z-10">
              <motion.img
                src={glowLogoPng} alt="Glow"
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  height: "clamp(48px, 8vw, 80px)",
                  filter: "drop-shadow(0 0 20px rgba(0,163,163,0.4))",
                }}
              />
              <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ borderRadius: 8 }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, width: "50%", height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                  animation: "shimmerSlide 2s 0.3s ease-in-out infinite",
                }} />
              </div>
            </div>

            {/* Status text */}
            <motion.p
              key={phase}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mt-6 text-xs tracking-[0.35em] uppercase"
              style={{
                fontFamily: "'Courier New', monospace",
                color: phase === "ready" ? "#00ff88" : "rgba(0,163,163,0.9)",
                animation: phase === "ready" ? "none" : "glitchLoop 3s ease-in-out infinite",
                transition: "color 0.3s, text-shadow 0.3s",
              }}
            >
              {phase === "bloom" || phase === "hardware" ? "[ System Initializing... ]" : null}
              {phase === "syncing" ? "[ Synchronizing Assets... ]" : null}
              {phase === "ready" ? "[ System Ready ]" : null}
            </motion.p>

            {/* Progress bar - visible during syncing & ready phases */}
            <AnimatePresence>
              {(phase === "syncing" || phase === "ready") && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-6 flex flex-col items-center gap-2 z-10"
                  style={{ width: "min(320px, 60vw)" }}
                >
                  {/* Percentage with spinner */}
                  <div className="flex items-center gap-2" style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: "clamp(10px, 1.5vw, 13px)",
                    color: phase === "ready" ? "#00ff88" : "rgba(0,163,163,0.9)",
                    letterSpacing: "0.15em",
                    transition: "color 0.3s",
                  }}>
                    {phase !== "ready" && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 size={12} />
                      </motion.div>
                    )}
                    <span>[ {displayPercentage ?? 0}% ]</span>
                  </div>

                  {/* Glassmorphism progress bar */}
                  <div style={{
                    width: "100%", height: 6, borderRadius: 3,
                    border: "1px solid rgba(0,163,163,0.3)",
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                    boxShadow: "0 0 8px rgba(0,163,163,0.15)",
                  }}>
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: `${displayPercentage ?? 0}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      style={{
                        height: "100%", borderRadius: 2,
                        background: "linear-gradient(90deg, rgba(0,163,163,1), rgba(60,80,180,1))",
                        boxShadow: "0 0 6px rgba(0,163,163,0.4)",
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hardware check pips */}
      <AnimatePresence>
        {(phase === "hardware" || phase === "syncing") && (
          <motion.div
            className="absolute bottom-[12%] flex gap-6 z-20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {[
              { label: "NETWORK", status: "OK", delay: 0 },
              { label: "GRAPHICS", status: "READY", delay: 0.4 },
              { label: "ENGINE", status: "ACTIVE", delay: 0.8 },
            ].map((pip) => (
              <motion.div
                key={pip.label}
                initial={{ opacity: 0.2 }}
                animate={{ opacity: 1 }}
                transition={{ delay: pip.delay, duration: 0.3 }}
                className="flex items-center gap-1.5"
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: "clamp(9px, 1.2vw, 11px)",
                  letterSpacing: "0.1em",
                  color: "rgba(0,163,163,0.6)",
                }}
              >
                <motion.div
                  initial={{ opacity: 0.2, boxShadow: "none" }}
                  animate={{
                    opacity: 1,
                    boxShadow: ["none", "0 0 8px rgba(0,163,163,0.8), 0 0 20px rgba(0,163,163,0.4)", "0 0 4px rgba(0,163,163,0.6)"],
                  }}
                  transition={{ delay: pip.delay, duration: 0.4 }}
                  style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(0,163,163,0.9)" }}
                />
                <span style={{ color: "rgba(255,255,255,0.4)" }}>{pip.label}:</span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: pip.delay + 0.2, duration: 0.2 }}
                  style={{ color: "rgba(0,163,163,0.9)" }}
                >
                  {pip.status}
                </motion.span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-[5%] z-30 text-center"
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: "clamp(9px, 1.2vw, 11px)",
          color: "rgba(255,255,255,0.4)",
          letterSpacing: "0.15em",
        }}
      >
        PRESS ANY KEY OR TAP TO SKIP
      </motion.p>

      {/* Exit fade */}
      {phase === "exit" && (
        <motion.div
          className="absolute inset-0 bg-black z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}
