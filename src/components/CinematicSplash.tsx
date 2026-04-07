import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import glowLogoPng from "@/assets/glow-text.png";

interface CinematicSplashProps {
  onComplete: () => void;
}

export function CinematicSplash({ onComplete }: CinematicSplashProps) {
  const [phase, setPhase] = useState<"ignition" | "bloom" | "hardware" | "exit">("ignition");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("bloom"), 1500);
    const t2 = setTimeout(() => setPhase("hardware"), 3000);
    const t3 = setTimeout(() => setPhase("exit"), 4500);
    const t4 = setTimeout(onComplete, 5200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden flex items-center justify-center">
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
        @keyframes pipGlow {
          0% { opacity: 0.2; box-shadow: none; }
          50% { opacity: 1; box-shadow: 0 0 8px currentColor, 0 0 20px currentColor; }
          100% { opacity: 1; box-shadow: 0 0 4px currentColor; }
        }
        @keyframes singularityPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.5); opacity: 1; }
        }
      `}</style>

      {/* Phase 1: Ignition - singularity + scan line */}
      <AnimatePresence>
        {phase === "ignition" && (
          <>
            {/* Singularity pinpoint */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute"
              style={{
                width: 4, height: 4,
                borderRadius: "50%",
                background: "white",
                boxShadow: "0 0 20px 8px rgba(255,255,255,0.8), 0 0 60px 20px rgba(0,163,163,0.6)",
                animation: "singularityPulse 0.8s ease-in-out infinite",
              }}
            />
            {/* Expanding horizontal line */}
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
            {/* Scan line sweeping down */}
            <div
              className="absolute left-0 right-0"
              style={{
                height: 2,
                background: "linear-gradient(90deg, transparent, rgba(0,163,163,0.6) 20%, rgba(0,163,163,0.9) 50%, rgba(0,163,163,0.6) 80%, transparent)",
                boxShadow: "0 0 30px 10px rgba(0,163,163,0.3)",
                animation: "scanLine 1.2s 0.4s ease-out forwards",
                position: "absolute",
                top: "-2px",
              }}
            />
            {/* Logo fading in during scan */}
            <motion.img
              src={glowLogoPng}
              alt="Glow"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              className="relative z-10"
              style={{
                height: "clamp(48px, 8vw, 80px)",
                filter: "drop-shadow(0 0 15px rgba(0,163,163,0.4))",
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Phase 2: Radiant Bloom */}
      <AnimatePresence>
        {(phase === "bloom" || phase === "hardware") && (
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
                  width: "min(600px, 80vw)",
                  height: "min(600px, 80vw)",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(0,163,163,0.3) 0%, rgba(60,80,180,0.15) 40%, transparent 70%)",
                  filter: "blur(40px)",
                }}
              />
            </div>

            {/* Logo with shimmer */}
            <div className="relative z-10">
              <motion.img
                src={glowLogoPng}
                alt="Glow"
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  height: "clamp(48px, 8vw, 80px)",
                  filter: "drop-shadow(0 0 40px rgba(0,163,163,0.6)) drop-shadow(0 0 80px rgba(60,80,180,0.3))",
                }}
              />
              {/* Shimmer overlay */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ borderRadius: 8 }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0, left: 0,
                    width: "50%", height: "100%",
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                    animation: "shimmerSlide 2s 0.3s ease-in-out infinite",
                  }}
                />
              </div>
            </div>

            {/* Initializing text with glitch effect */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-xs tracking-[0.35em] uppercase"
              style={{
                fontFamily: "'Courier New', monospace",
                color: "rgba(0,163,163,0.9)",
                animation: "glitchIn 0.6s 0.3s ease-out both",
                textShadow: "0 0 10px rgba(0,163,163,0.5)",
              }}
            >
              Initializing System...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 3: Hardware Check pips */}
      <AnimatePresence>
        {(phase === "hardware" || phase === "exit") && (
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
            ].map((pip, i) => (
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
                  style={{
                    width: 6, height: 6,
                    borderRadius: "50%",
                    background: "rgba(0,163,163,0.9)",
                  }}
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

      {/* Phase 4: Exit - zoom through O / fade to black */}
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
