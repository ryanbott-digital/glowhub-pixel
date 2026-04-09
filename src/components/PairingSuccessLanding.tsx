import { useMemo } from "react";
import { motion } from "framer-motion";
import glowLogoPng from "@/assets/glow-text.png";

const BLOBS = [
  { color: "rgba(0,163,163,0.40)", size: 1200, x: ["10%", "50%", "20%"], y: ["5%", "55%", "15%"], dur: 35 },
  { color: "rgba(109,40,217,0.35)", size: 1050, x: ["65%", "15%", "75%"], y: ["55%", "10%", "50%"], dur: 30 },
  { color: "rgba(0,130,140,0.30)", size: 950, x: ["35%", "70%", "25%"], y: ["75%", "25%", "65%"], dur: 38 },
  { color: "rgba(88,28,180,0.25)", size: 1000, x: ["75%", "30%", "60%"], y: ["20%", "70%", "30%"], dur: 32 },
];

const STAR_COUNT = 80;

function generateStars() {
  return Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2,
    delay: Math.random() * 6,
    duration: 3 + Math.random() * 4,
    brightness: 0.15 + Math.random() * 0.45,
  }));
}

export function PairingSuccessLanding() {
  const stars = useMemo(generateStars, []);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
      {/* Starfield */}
      <div className="absolute inset-0 z-0">
        {stars.map((s) => (
          <motion.div
            key={s.id}
            className="absolute rounded-full"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              background: `rgba(255,255,255,${s.brightness})`,
            }}
            animate={{ opacity: [0, s.brightness, 0] }}
            transition={{
              duration: s.duration,
              delay: s.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Luminous Pulse blobs */}
      {/* Luminous Pulse blobs */}
      {BLOBS.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: b.size,
            height: b.size,
            background: `radial-gradient(circle, ${b.color} 0%, transparent 65%)`,
            filter: "blur(100px)",
          }}
          animate={{ left: b.x, top: b.y, scale: [1, 1.15, 1] }}
          transition={{ duration: b.dur, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
      ))}

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <motion.img
          src={glowLogoPng}
          alt="Glow"
          className="h-12 w-auto select-none"
          style={{
            filter: "drop-shadow(0 0 20px rgba(0,163,163,0.4)) drop-shadow(0 0 50px rgba(0,163,163,0.15))",
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.h1
          className="text-white font-bold text-lg tracking-[0.4em] uppercase select-none"
          style={{ fontFamily: "'Poppins', sans-serif" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <span className="ss-breathe-text">LINK ESTABLISHED</span>
        </motion.h1>
      </div>

      {/* Status: Ready indicator */}
      <motion.div
        className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
      >
        <span className="ss-ready-dot" />
        <span className="font-mono text-[11px] tracking-[0.25em] text-white/30 uppercase select-none">
          Status: Ready
        </span>
      </motion.div>

      <style>{`
        .ss-breathe-text {
          animation: ssBreathe 4s ease-in-out infinite;
        }
        @keyframes ssBreathe {
          0%, 100% {
            text-shadow: 0 0 10px rgba(0,163,163,0.3), 0 0 30px rgba(0,163,163,0.15);
          }
          50% {
            text-shadow: 0 0 20px rgba(0,163,163,0.6), 0 0 60px rgba(0,163,163,0.3), 0 0 90px rgba(0,163,163,0.1);
          }
        }
        .ss-ready-dot {
          position: relative;
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 6px #22c55e;
        }
        .ss-ready-dot::before,
        .ss-ready-dot::after {
          content: '';
          position: absolute;
          inset: -4px;
          border: 1px solid rgba(34,197,94,0.4);
          border-radius: 50%;
          animation: ssRipple 2.5s ease-out infinite;
        }
        .ss-ready-dot::after {
          animation-delay: 1.25s;
        }
        @keyframes ssRipple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(3.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
