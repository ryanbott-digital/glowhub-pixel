import { useEffect, useState, useRef } from "react";
import glowLogoPng from "@/assets/glow-text.png";
import { PairingSuccessLanding } from "@/components/PairingSuccessLanding";

interface ScreenSaverProps {
  delayMs?: number;
}

/**
 * A cinematic screen saver with drifting GLOW logo, aurora blobs,
 * and a live clock. Activates when no content is assigned.
 */
export function ScreenSaver({ delayMs = 30_000 }: ScreenSaverProps) {
  const [active, setActive] = useState(false);
  const [clock, setClock] = useState("");
  const [logoPos, setLogoPos] = useState({ x: 50, y: 50 });
  const dirRef = useRef({ dx: 0.3, dy: 0.2 });
  const posRef = useRef({ x: 50, y: 50 });
  const rafRef = useRef<number>();

  // Activate after delay
  useEffect(() => {
    const timer = setTimeout(() => setActive(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  // Live clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 10_000);
    return () => clearInterval(interval);
  }, []);

  // Drifting logo (DVD-style bounce)
  useEffect(() => {
    if (!active) return;
    let running = true;

    const drift = () => {
      if (!running) return;
      const pos = posRef.current;
      const dir = dirRef.current;

      pos.x += dir.dx;
      pos.y += dir.dy;

      if (pos.x <= 10 || pos.x >= 90) dir.dx *= -1;
      if (pos.y <= 10 || pos.y >= 90) dir.dy *= -1;

      pos.x = Math.max(10, Math.min(90, pos.x));
      pos.y = Math.max(10, Math.min(90, pos.y));

      setLogoPos({ x: pos.x, y: pos.y });
      rafRef.current = requestAnimationFrame(drift);
    };

    rafRef.current = requestAnimationFrame(drift);
    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  return (
    <div
      className="w-screen h-screen overflow-hidden relative bg-black"
      style={{ animation: "ssContentFadeIn 1.2s ease-out forwards" }}
    >
      {/* Aurora blobs — always visible */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            width: "1200px",
            height: "1200px",
            top: "-20%",
            left: "-10%",
            background:
              "radial-gradient(circle, rgba(0,163,163,0.35) 0%, transparent 65%)",
            filter: "blur(120px)",
            animation: "ssAuroraA 25s ease-in-out infinite alternate",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: "1000px",
            height: "1000px",
            bottom: "-15%",
            right: "-5%",
            background:
              "radial-gradient(circle, rgba(26,54,93,0.45) 0%, transparent 65%)",
            filter: "blur(120px)",
            animation: "ssAuroraB 20s ease-in-out infinite alternate",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: "800px",
            height: "800px",
            top: "50%",
            left: "60%",
            background:
              "radial-gradient(circle, rgba(109,40,217,0.2) 0%, transparent 70%)",
            filter: "blur(130px)",
            animation: "ssAuroraC 22s ease-in-out infinite alternate",
          }}
        />
      </div>

      {/* Pairing success landing — fades out when screen saver activates */}
      <div
        className="absolute inset-0 transition-opacity duration-[2000ms]"
        style={{ opacity: active ? 0 : 1, pointerEvents: active ? "none" : "auto" }}
      >
        <PairingSuccessLanding />
      </div>

      {/* Screen saver — drifting logo + clock */}
      <div
        className="absolute inset-0 z-20 transition-opacity duration-[2000ms]"
        style={{ opacity: active ? 1 : 0, pointerEvents: "none" }}
      >
        {/* Drifting GLOW logo */}
        <div
          className="absolute transition-none"
          style={{
            left: `${logoPos.x}%`,
            top: `${logoPos.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <img
            src={glowLogoPng}
            alt="Glow"
            className="h-14 w-auto glow-text-pulse select-none"
            style={{
              filter:
                "drop-shadow(0 0 30px rgba(0,163,163,0.5)) drop-shadow(0 0 60px rgba(0,163,163,0.2))",
            }}
          />
        </div>

        {/* Clock — bottom center */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
          <span
            className="font-mono text-white/15 tracking-[0.15em] select-none"
            style={{
              fontSize: "clamp(2rem, 5vw, 4rem)",
              animation: "ssClockPulse 4s ease-in-out infinite",
            }}
          >
            {clock}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes ssContentFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes ssAuroraA {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(100px, 60px) scale(1.15); }
        }
        @keyframes ssAuroraB {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-80px, -50px) scale(1.1); }
        }
        @keyframes ssAuroraC {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(60px, -40px) scale(1.2); }
        }
        @keyframes ssPowerUp {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes ssClockPulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.25; }
        }
      `}</style>
    </div>
  );
}
