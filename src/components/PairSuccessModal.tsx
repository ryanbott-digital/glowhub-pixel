import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";

interface PairSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenName: string;
}

export function PairSuccessModal({ open, onOpenChange, screenName }: PairSuccessModalProps) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);
  const [showCheck, setShowCheck] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; angle: number; speed: number; size: number; hue: number; delay: number }>>([]);

  // Generate particles on open
  useEffect(() => {
    if (!open) {
      setCountdown(3);
      setShowCheck(false);
      setParticles([]);
      return;
    }

    // Haptic vibration
    if (navigator.vibrate) navigator.vibrate([50, 30, 80]);

    // Generate light particles
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 10,
      y: 50 + (Math.random() - 0.5) * 10,
      angle: Math.random() * 360,
      speed: 40 + Math.random() * 80,
      size: 3 + Math.random() * 5,
      hue: [180, 200, 220, 260, 330][i % 5],
      delay: Math.random() * 0.3,
    }));
    setParticles(newParticles);

    // Spring in the checkmark
    setTimeout(() => setShowCheck(true), 300);

    // Countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 1; }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  // Play celebration sound
  useEffect(() => {
    if (!open) return;
    const playSound = localStorage.getItem("glowhub_pair_sound") !== "false";
    if (!playSound) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.6);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.6);
      });
    } catch {}
  }, [open]);

  return (
    <>
      {/* Light particle burst */}
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
                  background: `hsl(${p.hue}, 100%, 65%)`,
                  boxShadow: `0 0 ${p.size * 3}px hsl(${p.hue}, 100%, 55%), 0 0 ${p.size * 6}px hsl(${p.hue}, 100%, 45%)`,
                  animation: `particleBurst 1.8s ease-out ${p.delay}s forwards`,
                  "--end-x": `${endX}vw`,
                  "--end-y": `${endY}vh`,
                  opacity: 0,
                } as React.CSSProperties}
              />
            );
          })}
          <style>{`
            @keyframes particleBurst {
              0% { opacity: 1; transform: translate(0, 0) scale(1); }
              60% { opacity: 0.8; }
              100% { opacity: 0; transform: translate(var(--end-x), var(--end-y)) scale(0.2); }
            }
          `}</style>
        </div>
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md p-0 border-0 bg-transparent shadow-none overflow-visible [&>button]:hidden">
          {/* Rotating conic gradient border wrapper */}
          <div className="relative rounded-3xl p-[2px] conic-border-wrap">
            <div
              className="rounded-3xl p-8 text-center relative overflow-hidden"
              style={{
                background: "hsla(220, 55%, 6%, 0.85)",
                backdropFilter: "blur(30px) saturate(1.6)",
                WebkitBackdropFilter: "blur(30px) saturate(1.6)",
              }}
            >
              {/* Inner glow */}
              <div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at 50% 0%, hsla(180, 100%, 45%, 0.08), transparent 60%)",
                }}
              />

              {/* 3D Glowing Checkmark */}
              <div className="flex justify-center mb-6">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    showCheck ? "scale-100 opacity-100" : "scale-0 opacity-0"
                  }`}
                  style={{
                    background: "linear-gradient(135deg, hsla(180, 100%, 45%, 0.15), hsla(220, 80%, 55%, 0.1))",
                    boxShadow: "0 0 40px hsla(180, 100%, 45%, 0.3), 0 0 80px hsla(180, 100%, 45%, 0.15), inset 0 0 30px hsla(180, 100%, 45%, 0.1)",
                    transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease",
                  }}
                >
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="drop-shadow-[0_0_12px_hsl(180,100%,50%)]">
                    <path
                      d="M10 20L17 27L30 13"
                      stroke="hsl(180, 100%, 50%)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={showCheck ? "check-draw" : ""}
                      style={{ filter: "drop-shadow(0 0 8px hsl(180, 100%, 50%))" }}
                    />
                  </svg>
                </div>
              </div>

              {/* Headline */}
              <h2 className="text-lg font-bold tracking-[0.25em] uppercase text-foreground mb-2 relative z-10">
                System Link Established
              </h2>

              {/* Subtext with countdown */}
              <p className="text-sm text-muted-foreground mb-1 relative z-10">
                <span className="font-medium text-foreground">{screenName}</span> is now Glowing.
              </p>
              <p className="text-xs text-muted-foreground tracking-wider mb-6 relative z-10">
                Broadcasting in{" "}
                <span className="font-mono text-primary font-bold" style={{ textShadow: "0 0 8px hsl(180, 100%, 45%)" }}>
                  {countdown}
                </span>
                ... {countdown <= 2 ? `${countdown}` : ""}... {countdown <= 1 ? "1..." : ""}
              </p>

              {/* CTA Button with breathe animation */}
              <Button
                onClick={() => { onOpenChange(false); navigate("/playlists"); }}
                className="breathe-btn bg-gradient-to-r from-primary to-glow-blue text-primary-foreground w-full gap-2 h-12 text-sm font-semibold tracking-wider rounded-xl relative z-10"
              >
                <Rocket className="h-4 w-4" />
                Send My First Playlist
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
            .conic-border-wrap {
              background: conic-gradient(
                from var(--conic-angle, 0deg),
                hsl(180, 100%, 45%),
                hsl(220, 80%, 55%),
                hsl(330, 80%, 60%),
                hsl(180, 100%, 45%)
              );
              animation: rotateConic 4s linear infinite;
            }

            @property --conic-angle {
              syntax: '<angle>';
              inherits: false;
              initial-value: 0deg;
            }

            @keyframes rotateConic {
              to { --conic-angle: 360deg; }
            }

            .check-draw {
              stroke-dasharray: 40;
              stroke-dashoffset: 40;
              animation: drawCheck 0.6s ease-out 0.4s forwards;
            }

            @keyframes drawCheck {
              to { stroke-dashoffset: 0; }
            }

            .breathe-btn {
              animation: breathe 2.5s ease-in-out infinite;
              box-shadow: 0 0 20px hsla(180, 100%, 45%, 0.2);
            }

            @keyframes breathe {
              0%, 100% {
                box-shadow: 0 0 20px hsla(180, 100%, 45%, 0.2), 0 0 40px hsla(180, 100%, 45%, 0.05);
                transform: scale(1);
              }
              50% {
                box-shadow: 0 0 30px hsla(180, 100%, 45%, 0.4), 0 0 60px hsla(180, 100%, 45%, 0.12);
                transform: scale(1.02);
              }
            }
          `}</style>
        </DialogContent>
      </Dialog>
    </>
  );
}
