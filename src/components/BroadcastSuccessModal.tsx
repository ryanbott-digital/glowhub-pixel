import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";

interface BroadcastSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenName: string;
}

export function BroadcastSuccessModal({ open, onOpenChange, screenName }: BroadcastSuccessModalProps) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);
  const [showCheck, setShowCheck] = useState(false);
  const [particles, setParticles] = useState<Array<{
    id: number; x: number; y: number; angle: number; speed: number;
    size: number; hue: number; delay: number;
  }>>([]);

  useEffect(() => {
    if (!open) {
      setCountdown(3);
      setShowCheck(false);
      setParticles([]);
      return;
    }

    // Haptic
    if (navigator.vibrate) navigator.vibrate([30, 20, 60, 20, 100]);

    // Spiral particles using golden angle
    const goldenAngle = 137.508;
    const newParticles = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 8,
      y: 50 + (Math.random() - 0.5) * 8,
      angle: (i * goldenAngle) % 360,
      speed: 30 + Math.random() * 90,
      size: 2 + Math.random() * 5,
      hue: i % 2 === 0 ? 180 : 210,
      delay: i * 0.015,
    }));
    setParticles(newParticles);

    setTimeout(() => setShowCheck(true), 400);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 1; }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  // Celebration sound
  useEffect(() => {
    if (!open) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [392, 523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.5);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.5);
      });
    } catch {}
  }, [open]);

  const handleView = useCallback(() => {
    onOpenChange(false);
    navigate("/screens");
  }, [onOpenChange, navigate]);

  return (
    <>
      {/* Spiral particle burst */}
      {open && particles.length > 0 && (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
          {particles.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            const endX = Math.cos(rad) * p.speed;
            const endY = Math.sin(rad) * p.speed;
            return (
              <div
                key={p.id}
                className="absolute rounded-full"
                style={{
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  background: `hsl(${p.hue}, 100%, 60%)`,
                  boxShadow: `0 0 ${p.size * 2}px hsl(${p.hue}, 100%, 50%)`,
                  animation: `broadcastParticle 1.6s ease-out ${p.delay}s forwards`,
                  "--end-x": `${endX}vw`,
                  "--end-y": `${endY}vh`,
                  opacity: 0,
                } as React.CSSProperties}
              />
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md p-0 border-0 bg-transparent shadow-none overflow-visible [&>button]:hidden">
          <div className="relative rounded-3xl p-[2px] broadcast-conic-border">
            <div
              className="rounded-3xl p-8 text-center relative overflow-hidden"
              style={{
                background: "hsla(220, 55%, 6%, 0.9)",
                backdropFilter: "blur(40px) saturate(1.8)",
                WebkitBackdropFilter: "blur(40px) saturate(1.8)",
              }}
            >
              {/* Inner radial glow */}
              <div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at 50% 30%, hsla(150, 80%, 45%, 0.06), transparent 60%)",
                }}
              />

              {/* 3D Checkmark with green heartbeat */}
              <div className="flex justify-center mb-6">
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                    showCheck ? "scale-100 opacity-100" : "scale-0 opacity-0"
                  }`}
                  style={{
                    background: "linear-gradient(135deg, hsla(150, 80%, 45%, 0.12), hsla(180, 100%, 45%, 0.08))",
                    animation: showCheck ? "greenHeartbeat 1.5s ease-in-out infinite" : "none",
                    transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease",
                  }}
                >
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <path
                      d="M12 24L20 32L36 16"
                      stroke="hsl(150, 80%, 50%)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={showCheck ? "broadcast-check-draw" : ""}
                      style={{ filter: "drop-shadow(0 0 10px hsl(150, 80%, 50%))" }}
                    />
                  </svg>
                </div>
              </div>

              {/* Header with shimmer */}
              <h2 className="text-lg font-bold tracking-[0.3em] uppercase text-foreground mb-2 relative z-10 broadcast-shimmer">
                BROADCAST IS ACTIVE
              </h2>

              {/* Subtext with countdown */}
              <p className="text-sm text-muted-foreground mb-1 relative z-10">
                <span className="font-medium text-foreground">{screenName}</span> is now Glowing.
              </p>
              <p className="text-xs text-muted-foreground tracking-wider mb-6 relative z-10">
                Managing the playlist in{" "}
                <span
                  className="font-mono font-bold"
                  style={{ color: "hsl(150, 80%, 50%)", textShadow: "0 0 8px hsla(150, 80%, 50%, 0.6)" }}
                >
                  {countdown}
                </span>
                ...
              </p>

              {/* CTA with breathe + shimmer */}
              <Button
                onClick={handleView}
                className="broadcast-breathe-btn broadcast-shimmer bg-gradient-to-r from-primary to-glow-blue text-primary-foreground w-full gap-2 h-12 text-sm font-semibold tracking-wider rounded-xl relative z-10"
              >
                <Rocket className="h-4 w-4" />
                🚀 View My Live Screen
              </Button>

              <button
                onClick={() => onOpenChange(false)}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wider relative z-10"
              >
                I'll do this later
              </button>
            </div>
          </div>

          <style>{`
            @keyframes broadcastParticle {
              0% { opacity: 1; transform: translate(0, 0) scale(1); }
              60% { opacity: 0.7; }
              100% { opacity: 0; transform: translate(var(--end-x), var(--end-y)) scale(0.1); }
            }

            .broadcast-conic-border {
              background: conic-gradient(
                from var(--conic-angle, 0deg),
                hsl(180, 100%, 45%),
                hsl(220, 80%, 55%),
                hsl(330, 80%, 60%),
                hsl(150, 80%, 50%),
                hsl(180, 100%, 45%)
              );
              animation: rotateBroadcastConic 3.5s linear infinite;
            }

            @property --conic-angle {
              syntax: '<angle>';
              inherits: false;
              initial-value: 0deg;
            }

            @keyframes rotateBroadcastConic {
              to { --conic-angle: 360deg; }
            }

            .broadcast-check-draw {
              stroke-dasharray: 50;
              stroke-dashoffset: 50;
              animation: drawBroadcastCheck 0.7s ease-out 0.5s forwards;
            }

            @keyframes drawBroadcastCheck {
              to { stroke-dashoffset: 0; }
            }

            @keyframes greenHeartbeat {
              0%, 100% { box-shadow: 0 0 20px hsla(150, 80%, 45%, 0.3), 0 0 40px hsla(150, 80%, 45%, 0.1); }
              50% { box-shadow: 0 0 30px hsla(150, 80%, 45%, 0.6), 0 0 60px hsla(150, 80%, 45%, 0.2); }
            }

            .broadcast-breathe-btn {
              animation: broadcastBreathe 2.5s ease-in-out infinite;
              box-shadow: 0 0 20px hsla(150, 80%, 45%, 0.2);
            }

            @keyframes broadcastBreathe {
              0%, 100% {
                box-shadow: 0 0 20px hsla(150, 80%, 45%, 0.2), 0 0 40px hsla(150, 80%, 45%, 0.05);
                transform: scale(1);
              }
              50% {
                box-shadow: 0 0 30px hsla(150, 80%, 45%, 0.4), 0 0 60px hsla(150, 80%, 45%, 0.12);
                transform: scale(1.02);
              }
            }

            .broadcast-shimmer {
              position: relative;
              overflow: hidden;
            }

            .broadcast-shimmer::after {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(
                90deg,
                transparent,
                hsla(180, 100%, 80%, 0.15),
                transparent
              );
              animation: shimmerSlide 3s ease-in-out infinite;
            }

            @keyframes shimmerSlide {
              0% { left: -100%; }
              50% { left: 100%; }
              100% { left: 100%; }
            }
          `}</style>
        </DialogContent>
      </Dialog>
    </>
  );
}
