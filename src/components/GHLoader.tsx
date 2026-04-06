/**
 * Branded loading component using the Glow logo image.
 * Features: pulsing glow animation around the logo.
 */
import glowLogo from "@/assets/glow-logo.png";

export function GHLoader({ size = 64, text }: { size?: number; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <img
        src={glowLogo}
        alt="Glow"
        style={{
          height: size,
          width: "auto",
          animation: "loaderPulse 2s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes loaderPulse {
          0%, 100% { opacity: 0.7; filter: drop-shadow(0 0 8px hsl(180, 100%, 40% / 0.3)); }
          50% { opacity: 1; filter: drop-shadow(0 0 20px hsl(180, 100%, 40% / 0.5)); }
        }
      `}</style>
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
}

/** Full-page loading screen using GHLoader */
export function GHLoaderPage({ text }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <GHLoader size={72} text={text} />
    </div>
  );
}
