import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { GlowLogoImage } from "@/components/GlowHubLogo";
import { Download, Tv, Flame, Rocket, Sparkles, Bug, Zap, Shield, ChevronDown, Monitor, Smartphone, Play, ExternalLink } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { APK_VERSION, APK_DATE } from "@/lib/apk-version";
import { toast } from "sonner";

const DOWNLOADER_CODE = "1648081";

const CHANGELOG = [
  {
    version: APK_VERSION,
    date: APK_DATE,
    changes: [
      { icon: Zap, text: "Improved player stability and performance on Fire TV devices" },
      { icon: Shield, text: "Enhanced offline caching for smoother playback" },
      { icon: Sparkles, text: "Updated PWA manifest for better installability" },
    ],
  },
  {
    version: "2.1.0",
    date: "March 2026",
    changes: [
      { icon: Zap, text: "Added crossfade and transition effects between media items" },
      { icon: Bug, text: "Fixed screen wake-lock dropping on certain Android TV models" },
      { icon: Sparkles, text: "New pairing flow with animated success screen" },
    ],
  },
  {
    version: "2.0.0",
    date: "February 2026",
    changes: [
      { icon: Rocket, text: "Complete UI redesign with the new Glow design system" },
      { icon: Zap, text: "Multi-screen sync support for video walls" },
      { icon: Shield, text: "Added proof-of-play logging and error reporting" },
    ],
  },
];

// Particle burst config
const PARTICLE_COUNT = 80;
const COLORS = [
  "hsla(180,100%,45%,1)", // teal
  "hsla(220,80%,55%,1)",  // blue
  "hsla(280,70%,60%,1)",  // purple
  "hsla(45,100%,60%,1)",  // gold
  "hsla(160,80%,50%,1)",  // emerald
  "hsla(0,0%,100%,1)",    // white
];

function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();

  const fire = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const cx = canvas.width / 2;
    const cy = canvas.height * 0.4;

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: cx,
      y: cy,
      vx: (Math.random() - 0.5) * 16,
      vy: Math.random() * -14 - 4,
      size: Math.random() * 6 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 1,
      decay: Math.random() * 0.015 + 0.008,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      for (const p of particles) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.99;
        p.life -= p.decay;
        p.rotation += p.rotSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (alive) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  return { canvasRef, fire };
}

export default function DownloadPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const { canvasRef, fire: fireConfetti } = useConfetti();
  const [consented, setConsented] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleUnlock = async () => {
    if (!isValidEmail || !consented || submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("leads").insert({ email: email.trim(), consented_at: new Date().toISOString() });
      const isReturning = error?.code === "23505";
      if (error && !isReturning) throw error;
      setFlashActive(true);
      setTimeout(() => {
        setUnlocked(true);
        setFlashActive(false);
        fireConfetti();
        if (isReturning) {
          toast("Welcome back! 👋", { description: "Good to see you again." });
        }
      }, 400);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(220,40%,8%)] text-foreground font-['Satoshi','Inter',system-ui,sans-serif] relative overflow-x-hidden">
      {/* Flash overlay */}
      <div
        className={`fixed inset-0 z-[100] pointer-events-none bg-white/90 transition-opacity duration-400 ${flashActive ? "opacity-100" : "opacity-0"}`}
        style={{ transitionDuration: "400ms" }}
      />
      {/* Confetti canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 z-[101] pointer-events-none" />

      {/* Mesh gradient background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[600px] h-[600px] rounded-full bg-primary/[0.06] blur-[120px]" />
        <div className="absolute bottom-[15%] right-[10%] w-[500px] h-[500px] rounded-full bg-[hsl(220,80%,55%)]/[0.05] blur-[100px]" />
        <div className="absolute top-[50%] left-[50%] w-[400px] h-[400px] rounded-full bg-[hsl(260,60%,55%)]/[0.04] blur-[90px] -translate-x-1/2" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[hsl(220,40%,8%)]/80 border-b border-border/50">
        <div className="flex items-center justify-between px-6 py-3.5 max-w-5xl mx-auto">
          <Link to="/home">
            <GlowLogoImage className="h-8" />
          </Link>
          <Link
            to="/auth"
            className="text-sm font-medium px-5 py-2 rounded-lg bg-gradient-to-r from-primary to-[hsl(220,80%,55%)] text-primary-foreground hover:shadow-[0_0_20px_hsla(var(--primary),0.35)] transition-all"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* ── PHASE 1: THE GATE ── */}
      <div
        className={`transition-all duration-700 ease-in-out ${unlocked ? "opacity-0 max-h-0 overflow-hidden pointer-events-none" : "opacity-100 max-h-[800px]"}`}
      >
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-6">
          <div className="glass-strong glass-spotlight rounded-2xl p-8 sm:p-10 border-primary/20 max-w-md w-full text-center space-y-8 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[conic-gradient(from_180deg,hsla(180,100%,45%,0.15),hsla(220,80%,55%,0.1),transparent)] rounded-full blur-[40px]" />

            <div className="relative z-10 space-y-6">
              <div className="relative inline-block">
                <GlowLogoImage className="h-16 mx-auto" />
                <div className="absolute inset-0 bg-primary/10 blur-[20px] animate-pulse" />
               </div>
               <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-[11px] font-mono font-semibold text-primary">
                 v{APK_VERSION} · {APK_DATE}
               </span>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[0.08em] uppercase">
                  Get the <span className="bg-gradient-to-r from-primary to-[hsl(220,80%,55%)] bg-clip-text text-transparent">GLOW</span> Player
                </h1>
                <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto">
                  Enter your email to unlock your download link and Firestick setup code.
                </p>
              </div>

              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                  className="bg-background/50 border-primary/30 focus:border-primary/60 focus:shadow-[0_0_16px_hsla(180,100%,45%,0.15)] text-center text-base"
                />
                <label className="flex items-start gap-2.5 text-left cursor-pointer">
                  <Checkbox
                    checked={consented}
                    onCheckedChange={(v) => setConsented(v === true)}
                    className="mt-0.5 border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className="text-[11px] text-muted-foreground leading-relaxed">
                    I agree to the <Link to="/terms" className="underline hover:text-cyan-400 transition-colors">Terms of Service</Link> & <Link to="/terms?tab=privacy" className="underline hover:text-cyan-400 transition-colors">Privacy Policy</Link> and to receive product updates, setup guides, and promotional offers from Glow. You can unsubscribe at any time.
                  </span>
                </label>
                <Button
                  onClick={handleUnlock}
                  disabled={!isValidEmail || !consented || submitting}
                  className="w-full bg-gradient-to-r from-primary to-[hsl(220,80%,55%)] text-primary-foreground font-semibold text-base py-5 hover:shadow-[0_0_30px_hsla(180,100%,45%,0.35)] transition-all"
                >
                  <Rocket className="h-4 w-4 mr-1" />
                  {submitting ? "Unlocking…" : "Unlock Access 🚀"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PHASE 2: THE PAYLOAD ── */}
      <div
        className={`transition-all duration-700 ease-in-out ${unlocked ? "opacity-100" : "opacity-0 max-h-0 overflow-hidden pointer-events-none"}`}
      >
        <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <GlowLogoImage className="h-16 mx-auto" />
              <div className="absolute inset-0 bg-primary/10 blur-[20px] animate-pulse" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[0.08em] uppercase">
              Access <span className="bg-gradient-to-r from-primary to-[hsl(220,80%,55%)] bg-clip-text text-transparent">Unlocked</span>
            </h2>
            <p className="text-muted-foreground text-sm">Your download links and setup code are ready.</p>
          </div>

          {/* Firestick Code Card */}
          <div className="glass-strong glass-spotlight rounded-2xl p-8 border-primary/20 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[conic-gradient(from_180deg,hsla(180,100%,45%,0.15),hsla(220,80%,55%,0.1),transparent)] rounded-full blur-[40px]" />
            <div className="relative z-10 space-y-5 text-center">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                  <Flame className="h-5 w-5 text-accent" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold tracking-wide">Firestick Downloader Code</h3>
                  <span className="text-xs text-primary font-semibold uppercase tracking-widest">Recommended</span>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-8 py-5 rounded-xl bg-background/80 border border-primary/30 shadow-[0_0_40px_hsla(180,100%,45%,0.15),inset_0_0_20px_hsla(180,100%,45%,0.05)]">
                {DOWNLOADER_CODE.split("").map((digit, i) => (
                  <span
                    key={i}
                    className="text-4xl sm:text-5xl font-extrabold font-mono tracking-[0.18em] text-primary drop-shadow-[0_0_10px_hsla(180,100%,45%,0.7)]"
                  >
                    {digit}
                  </span>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Open the <strong className="text-foreground">Downloader</strong> app on your Firestick and enter this code.
              </p>
            </div>
          </div>

          {/* APK Download */}
          <div className="glass-strong glass-spotlight rounded-2xl p-8 border-primary/20 relative overflow-hidden text-center space-y-5">
            <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-[conic-gradient(from_0deg,hsla(180,100%,45%,0.12),hsla(220,80%,55%,0.08),transparent)] rounded-full blur-[40px]" />
            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold tracking-wide">Direct APK Download</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                For Android TV boxes and sideloading onto any device.
              </p>
              <a
                href="/GlowHub.apk"
                download
                className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-10 py-4 rounded-xl text-base font-bold bg-gradient-to-r from-primary to-[hsl(220,80%,55%)] text-primary-foreground shadow-[0_0_30px_hsla(180,100%,45%,0.3)] hover:shadow-[0_0_50px_hsla(180,100%,45%,0.5)] hover:scale-[1.02] transition-all duration-300"
              >
                <Download className="h-5 w-5" />
                Download APK
              </a>
              <p className="text-[10px] text-muted-foreground/60 font-mono">v{APK_VERSION} · {APK_DATE}</p>
            </div>
          </div>

          {/* ── SIDELOADING GUIDE ── */}
          <Collapsible>
            <CollapsibleTrigger className="w-full glass rounded-xl border-primary/15 p-5 flex items-center justify-between text-left group hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Rocket className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">Sideloading Install Guide</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Step-by-step instructions for any Android device</p>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 glass rounded-xl border-primary/15 p-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <Step n={1}>
                Download the APK file above to your device or a USB drive.
              </Step>
              <Step n={2}>
                On your Android TV / Firestick, go to <strong className="text-foreground">Settings → My Fire TV → Developer Options</strong> and enable <strong className="text-foreground">Install Unknown Apps</strong>.
              </Step>
              <Step n={3}>
                If you don't have a file manager, install one from the app store (e.g. <strong className="text-foreground">File Commander</strong> or <strong className="text-foreground">ES File Explorer</strong>).
              </Step>
              <Step n={4}>
                Open the file manager and navigate to the downloaded <strong className="text-foreground">GlowHub.apk</strong> file.
              </Step>
              <Step n={5}>
                Tap the APK file and select <strong className="text-foreground">Install</strong>. Confirm any prompts.
              </Step>
              <Step n={6}>
                Once installed, open <strong className="text-foreground">Glow Player</strong> from your apps list and pair your screen.
              </Step>
            </CollapsibleContent>
          </Collapsible>

          <div className="space-y-4">
            <h3 className="text-lg font-bold tracking-wide text-center flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              What's New
            </h3>

            <div className="space-y-3">
              {CHANGELOG.map((entry, i) => (
                <div key={i} className="glass rounded-xl border-primary/15 p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary font-mono">v{entry.version}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{entry.date}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {entry.changes.map((change, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <change.icon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary/70" />
                        <span>{change.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center pt-4 pb-8 space-y-4">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-[hsl(220,80%,55%)] hover:shadow-[0_0_30px_hsla(180,100%,45%,0.35)] transition-all duration-300"
            >
              <Tv className="h-4 w-4" />
              Start Glowing for Free
            </Link>
            <p className="text-[10px] text-muted-foreground/60 max-w-xs mx-auto leading-relaxed">
              By downloading, you agree to our{" "}
              <Link to="/terms" className="underline hover:text-cyan-400 transition-colors">Terms of Service & Privacy Policy</Link>{" "}
              and to receive Glow updates. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
        {n}
      </span>
      <p>{children}</p>
    </div>
  );
}
