/**
 * Branded loading component using the Glow text image.
 * Features: pulsing glow + radiant light burst animation.
 */
import glowText from "@/assets/glow-text.png";

export function GHLoader({ size = 64, text }: { size?: number; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative flex items-center justify-center">
        <img
          src={glowText}
          alt="Glow"
          style={{ height: size, width: "auto" }}
          className="relative z-10 glow-text-pulse"
        />
      </div>
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
}

/** Full-page loading / boot screen with radiant light burst behind the GLOW logo */
export function GHLoaderPage({ text }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1120] overflow-hidden relative">
      {/* Radiant light burst rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="boot-ring boot-ring-1" />
        <div className="boot-ring boot-ring-2" />
        <div className="boot-ring boot-ring-3" />
      </div>

      {/* Central glow bloom */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="boot-bloom" />
      </div>

      <div className="relative z-10">
        <GHLoader size={96} text={text} />
      </div>

      <style>{`
        .boot-bloom {
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            hsla(180, 100%, 45%, 0.25) 0%,
            hsla(180, 100%, 45%, 0.08) 40%,
            transparent 70%
          );
          animation: bloomPulse 3s ease-in-out infinite;
        }

        .boot-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid hsla(180, 100%, 45%, 0.15);
          animation: ringExpand 4s ease-out infinite;
        }

        .boot-ring-1 {
          width: 120px; height: 120px;
          animation-delay: 0s;
        }
        .boot-ring-2 {
          width: 120px; height: 120px;
          animation-delay: 1.3s;
        }
        .boot-ring-3 {
          width: 120px; height: 120px;
          animation-delay: 2.6s;
        }

        @keyframes ringExpand {
          0% {
            transform: scale(1);
            opacity: 0.6;
            border-color: hsla(180, 100%, 45%, 0.3);
          }
          100% {
            transform: scale(4);
            opacity: 0;
            border-color: hsla(180, 100%, 45%, 0);
          }
        }

        @keyframes bloomPulse {
          0%, 100% {
            transform: scale(0.9);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
