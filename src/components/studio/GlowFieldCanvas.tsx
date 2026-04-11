import { useRef, useEffect, useCallback } from "react";

export type ParticleShape = "orbs" | "stars" | "sparkles";

export interface GlowFieldConfig {
  density: number;
  speed: number;
  color: string;
  glow: number;
  shape?: ParticleShape;
  particleSize?: number;
  opacity?: number;
  trail?: number;
  colorGradient?: boolean;
  color2?: string;
  gradientSpeed?: number;
  direction?: ParticleDirection;
}

export type ParticleDirection = "random" | "up" | "down" | "left" | "right" | "radial" | "swirl";

export const DEFAULT_GLOW_FIELD: GlowFieldConfig = {
  density: 30,
  speed: 3,
  color: "#00b4d8",
  glow: 20,
  shape: "orbs",
  particleSize: 1,
};

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  alphaDir: number;
  rotation: number;
  rotSpeed: number;
  phase: number;
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, points: number, rotation: number) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI * i) / points - Math.PI / 2 + rotation;
    const rad = i % 2 === 0 ? r : r * 0.4;
    const x = cx + Math.cos(angle) * rad;
    const y = cy + Math.sin(angle) * rad;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawSparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rotation: number) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * i) / 4 + rotation;
    const rad = i % 2 === 0 ? r : r * 0.2;
    const x = cx + Math.cos(angle) * rad;
    const y = cy + Math.sin(angle) * rad;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function hexToRgb(hex: string) {
  const m = hex.replace("#", "").match(/.{2}/g);
  return m ? { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) } : { r: 0, g: 180, b: 216 };
}

function lerpColor(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, t: number) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

export function GlowFieldCanvas({ config, className }: { config: GlowFieldConfig; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const initParticles = useCallback((w: number, h: number, count: number, speedMul: number, direction: ParticleDirection = "random") => {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const { vx, vy } = getDirectionVelocity(direction, speedMul, w, h, Math.random() * w, Math.random() * h);
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1.5 + Math.random() * 3,
        vx,
        vy,
        alpha: 0.3 + Math.random() * 0.7,
        alphaDir: (Math.random() > 0.5 ? 1 : -1) * (0.003 + Math.random() * 0.008),
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resize();

    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;
    const count = Math.max(5, Math.round(config.density * (w * h) / (960 * 540)));
    const speedMul = config.speed * 0.15;
    particlesRef.current = initParticles(w, h, count, speedMul);

    const rgb1 = hexToRgb(config.color);
    const rgb2 = config.colorGradient ? hexToRgb(config.color2 || "#ff006e") : rgb1;
    const glowR = config.glow;
    const shape = config.shape || "orbs";
    const sizeMul = config.particleSize ?? 1;
    const opacityMul = config.opacity ?? 1;
    const trail = config.trail ?? 0;
    const useGradient = config.colorGradient ?? false;
    const gradSpeed = config.gradientSpeed ?? 1;
    timeRef.current = 0;

    const draw = () => {
      const rw = canvas.getBoundingClientRect().width;
      const rh = canvas.getBoundingClientRect().height;
      timeRef.current += 0.016;

      if (trail > 0) {
        ctx.fillStyle = `rgba(0,0,0,${1 - trail})`;
        ctx.fillRect(0, 0, rw, rh);
      } else {
        ctx.clearRect(0, 0, rw, rh);
      }

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;

        if (p.x < -10) p.x = rw + 10;
        if (p.x > rw + 10) p.x = -10;
        if (p.y < -10) p.y = rh + 10;
        if (p.y > rh + 10) p.y = -10;

        p.alpha += p.alphaDir;
        if (p.alpha >= 1) { p.alpha = 1; p.alphaDir = -Math.abs(p.alphaDir); }
        if (p.alpha <= 0.15) { p.alpha = 0.15; p.alphaDir = Math.abs(p.alphaDir); }

        // Compute color (gradient or static)
        const t = useGradient ? (Math.sin(timeRef.current * gradSpeed + p.phase) * 0.5 + 0.5) : 0;
        const rgb = useGradient ? lerpColor(rgb1, rgb2, t) : rgb1;

        // Glow layer
        const sr = p.r * sizeMul;
        const a = p.alpha * opacityMul;
        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sr + glowR);
        grad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${a * 0.9})`);
        grad.addColorStop(0.3, `rgba(${rgb.r},${rgb.g},${rgb.b},${a * 0.4})`);
        grad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, sr + glowR, 0, Math.PI * 2);
        ctx.fill();

        // Core shape
        const coreColor = `rgba(${Math.min(255, rgb.r + 60)},${Math.min(255, rgb.g + 60)},${Math.min(255, rgb.b + 60)},${a})`;
        ctx.fillStyle = coreColor;

        if (shape === "stars") {
          drawStar(ctx, p.x, p.y, sr * 2.5, 5, p.rotation);
          ctx.fill();
        } else if (shape === "sparkles") {
          drawSparkle(ctx, p.x, p.y, sr * 2.5, p.rotation);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, sr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [config, initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
