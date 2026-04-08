import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Particle {
  x: number; y: number; vx: number; vy: number;
  alpha: number; size: number; color: string;
}

interface ConfettiO {
  x: number; y: number; vy: number; size: number;
  alpha: number; rotation: number; rotSpeed: number;
}

interface CannonPiece {
  x: number; y: number; vx: number; vy: number;
  alpha: number; size: number; color: string;
  shape: "circle" | "rect" | "star";
  rotation: number; rotSpeed: number; gravity: number;
}

function playPowerUpWhoosh() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Rising swept noise
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    // Low-pass filter for warmth
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.6);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
    // Sub-bass thump
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = "sine";
    sub.frequency.value = 60;
    subGain.gain.setValueAtTime(0.15, ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(ctx.currentTime);
    sub.stop(ctx.currentTime + 0.4);
  } catch {
    // browser blocked audio — silent fail
  }
}

function playDigitalChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [880, 1108.73, 1318.51]; // A5, C#6, E6 — major triad
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.8);
    });
    // shimmer overtone
    const shimmer = ctx.createOscillator();
    const sGain = ctx.createGain();
    shimmer.type = "triangle";
    shimmer.frequency.value = 2637;
    sGain.gain.setValueAtTime(0, ctx.currentTime + 0.3);
    sGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.4);
    sGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    shimmer.connect(sGain);
    sGain.connect(ctx.destination);
    shimmer.start(ctx.currentTime + 0.3);
    shimmer.stop(ctx.currentTime + 1.2);
  } catch {
    // browser blocked audio — silent fail
  }
}

export default function WelcomePro() {
  const navigate = useNavigate();
  const explosionRef = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef<HTMLCanvasElement>(null);
  const cannonRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState(0);
  const [typedText, setTypedText] = useState("");
  const terminalFull = "[ PRO ACCOUNT ACTIVATED ]";

  // Phase progression
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3000),
      setTimeout(() => setPhase(4), 4000),
      setTimeout(() => setPhase(5), 5000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Particle explosion
  useEffect(() => {
    if (phase < 1) return;
    playPowerUpWhoosh();
    const canvas = explosionRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#00E5FF", "#3B82F6", "#00E5FF", "#06B6D4", "#2563EB"];
    const particles: Particle[] = [];
    const cx = canvas.width / 2, cy = canvas.height / 2;
    for (let i = 0; i < 200; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      particles.push({
        x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        alpha: 1, size: 1.5 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    let raf: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.vy *= 0.97; p.alpha -= 0.012;
        if (p.alpha <= 0) continue;
        alive = true;
        ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
        ctx.shadowColor = p.color; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      if (alive) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Terminal typing
  useEffect(() => {
    if (phase < 4) return;
    let i = 0;
    const iv = setInterval(() => {
      i++; setTypedText(terminalFull.slice(0, i));
      if (i >= terminalFull.length) clearInterval(iv);
    }, 40);
    return () => clearInterval(iv);
  }, [phase]);

  // Confetti O's
  useEffect(() => {
    if (phase < 5) return;
    const canvas = confettiRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const items: ConfettiO[] = [];
    let raf: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (Math.random() < 0.15 && items.length < 60) {
        items.push({
          x: Math.random() * canvas.width, y: -20,
          vy: 0.3 + Math.random() * 0.8, size: 8 + Math.random() * 16,
          alpha: 0.15 + Math.random() * 0.4, rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.02,
        });
      }
      for (let i = items.length - 1; i >= 0; i--) {
        const o = items[i];
        o.y += o.vy; o.rotation += o.rotSpeed;
        if (o.y > canvas.height + 30) { items.splice(i, 1); continue; }
        ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rotation);
        ctx.globalAlpha = o.alpha; ctx.font = `bold ${o.size}px sans-serif`;
        ctx.fillStyle = "#00E5FF"; ctx.shadowColor = "#00E5FF"; ctx.shadowBlur = 6;
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("O", 0, 0);
        ctx.restore();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Confetti cannon + chime at phase 5
  useEffect(() => {
    if (phase < 5) return;

    // Play chime
    playDigitalChime();

    // Cannon burst
    const canvas = cannonRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;

    const colors = ["#00E5FF", "#3B82F6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#A855F7", "#EC4899"];
    const shapes: CannonPiece["shape"][] = ["circle", "rect", "star"];
    const pieces: CannonPiece[] = [];
    const cx = canvas.width / 2, cy = canvas.height * 0.6;

    for (let i = 0; i < 150; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 6 + Math.random() * 12;
      pieces.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed * (0.5 + Math.random()),
        vy: Math.sin(angle) * speed,
        alpha: 1, size: 3 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.15,
        gravity: 0.12 + Math.random() * 0.06,
      });
    }

    let raf: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of pieces) {
        p.x += p.vx; p.y += p.vy; p.vy += p.gravity;
        p.vx *= 0.99; p.rotation += p.rotSpeed;
        p.alpha -= 0.006;
        if (p.alpha <= 0 || p.y > canvas.height + 20) continue;
        alive = true;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
        if (p.shape === "circle") {
          ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill();
        } else if (p.shape === "rect") {
          ctx.fillRect(-p.size, -p.size / 2, p.size * 2, p.size);
        } else {
          // star
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            const a = (s * 4 * Math.PI) / 5 - Math.PI / 2;
            const r = s === 0 ? p.size : p.size;
            ctx[s === 0 ? "moveTo" : "lineTo"](Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (alive) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
      {/* Deep Space blobs */}
      <div className={`fixed inset-0 transition-colors duration-[2000ms] ${phase >= 2 ? "bg-[#0B1120]" : "bg-black"}`}>
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-[#00E5FF]/10 rounded-full blur-[140px] animate-[blobDrift_8s_ease-in-out_infinite_alternate]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#3B82F6]/10 rounded-full blur-[120px] animate-[blobDrift_8s_ease-in-out_infinite_alternate-reverse]" />
      </div>

      {/* Explosion canvas */}
      <canvas ref={explosionRef} className="fixed inset-0 z-10 pointer-events-none" />

      {/* Scan line */}
      {phase >= 2 && phase < 5 && (
        <div className="fixed inset-0 z-20 pointer-events-none">
          <div className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent shadow-[0_0_20px_#00E5FF] animate-[scanDown_1.5s_ease-in-out_forwards]" />
        </div>
      )}

      {/* Confetti O canvas */}
      <canvas ref={confettiRef} className="fixed inset-0 z-10 pointer-events-none" />

      {/* Cannon canvas */}
      <canvas ref={cannonRef} className="fixed inset-0 z-40 pointer-events-none" />

      {/* Content */}
      <div className="relative z-30 flex flex-col items-center text-center px-6 max-w-lg w-full space-y-6">
        {phase >= 3 && (
          <div className="animate-[fadeScale_0.8s_ease-out_forwards]">
            <span
              className="text-[8rem] sm:text-[10rem] font-black leading-none select-none animate-[glowPulse_3s_ease-in-out_infinite]"
              style={{
                color: "#00E5FF",
                textShadow: "0 0 20px #00E5FF, 0 0 40px #00E5FF, 0 0 80px #00E5FF44, 0 0 120px #3B82F644",
              }}
            >
              O
            </span>
          </div>
        )}

        {phase >= 4 && (
          <div className="font-mono text-green-400 text-sm sm:text-base tracking-widest animate-[fadeIn_0.3s_ease-out]">
            {typedText}
            <span className="animate-[blink_1s_step-end_infinite]">▊</span>
          </div>
        )}

        {phase >= 5 && (
          <div className="w-full space-y-6 animate-[slideUp_0.6s_ease-out_forwards]">
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 space-y-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Welcome to the Future of Signage.
              </h1>
              <p className="text-[#94A3B8] text-sm sm:text-base leading-relaxed">
                Your account is now synced. All Pro widgets, Sync Canvas, and High-Bitrate streaming are now unlocked.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate("/canvas")}
                className="flex-1 bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] hover:shadow-[0_0_24px_rgba(0,163,163,0.5)] text-white border-0 h-12 text-base transition-shadow"
              >
                🚀 Launch Sync Canvas
              </Button>
              <Button
                onClick={() => navigate("/studio")}
                className="flex-1 bg-gradient-to-r from-[#3B82F6] to-[#00A3A3] hover:shadow-[0_0_24px_rgba(59,130,246,0.5)] text-white border-0 h-12 text-base transition-shadow"
              >
                🎨 Open Glow Studio
              </Button>
            </div>

            <button
              onClick={() => navigate("/billing")}
              className="text-sm text-[#94A3B8] hover:text-white transition-colors"
            >
              Go to Billing →
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blobDrift {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(40px, -30px) scale(1.15); }
        }
        @keyframes scanDown {
          0% { top: 0; opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes fadeScale {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes glowPulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}