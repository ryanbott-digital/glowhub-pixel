import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { GlowLogoImage } from "@/components/GlowHubLogo";
import { Download, Tv, Globe, Flame, Monitor, Tablet, Rocket, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DOWNLOADER_CODE = "1648081";

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

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleUnlock = async () => {
    if (!isValidEmail || submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("leads").insert({ email: email.trim() });
      // 23505 = unique_violation — email already exists, still unlock
      if (error && error.code !== "23505") throw error;
      setFlashActive(true);
      setTimeout(() => {
        setUnlocked(true);
        setFlashActive(false);
        fireConfetti();
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
                <Button
                  onClick={handleUnlock}
                  disabled={!isValidEmail || submitting}
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

          {/* Secondary actions */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="glass glass-spotlight rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Download className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-bold text-sm tracking-wide">Direct APK Download</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                For Android TV boxes and sideloading onto any device.
              </p>
              <a
                href="/GlowHub.apk"
                download
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary/20 to-[hsl(220,80%,55%)]/20 border border-primary/30 shadow-[0_0_12px_hsla(180,100%,32%,0.15)] text-primary hover:border-primary/60 hover:shadow-[0_0_20px_hsla(180,100%,32%,0.3)] transition-all duration-300"
              >
                <Download className="h-4 w-4" />
                Download APK
              </a>
            </div>

            <div className="glass glass-spotlight rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[hsl(220,80%,55%)]/10 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-[hsl(220,80%,55%)]" />
                </div>
                <h3 className="font-bold text-sm tracking-wide">Browser Mode</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                No install needed. Open the player URL in any TV browser.
              </p>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted/50 border border-border font-mono text-xs text-foreground">
                <span className="truncate">{window.location.origin}/player</span>
                <ChevronRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* ── DEVICE GUIDES ── */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold tracking-wide text-center">How to install on your device</h3>

            <Accordion type="single" collapsible className="space-y-3">
              <AccordionItem value="firestick" className="glass rounded-xl border-primary/15 px-5">
                <AccordionTrigger className="hover:no-underline gap-3">
                  <div className="flex items-center gap-3">
                    <Flame className="h-5 w-5 text-accent" />
                    <span className="font-semibold text-sm">Amazon Firestick</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-3 pt-2">
                  <Step n={1}>Install the <strong className="text-foreground">Downloader</strong> app from the Amazon App Store.</Step>
                  <Step n={2}>Open Downloader, enter code <strong className="text-primary">{DOWNLOADER_CODE}</strong>, and press <strong className="text-foreground">Go</strong>.</Step>
                  <Step n={3}>Install the downloaded APK and launch <strong className="text-foreground">GLOW</strong>. ✨</Step>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="androidtv" className="glass rounded-xl border-primary/15 px-5">
                <AccordionTrigger className="hover:no-underline gap-3">
                  <div className="flex items-center gap-3">
                    <Tv className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-sm">Android TV / Google TV</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-3 pt-2">
                  <Step n={1}>Enable <strong className="text-foreground">Unknown Sources</strong> in Settings → Security.</Step>
                  <Step n={2}>Download the APK via the <strong className="text-foreground">Downloader</strong> app or USB transfer.</Step>
                  <Step n={3}>Open the APK to install, then launch <strong className="text-foreground">GLOW</strong> from your apps.</Step>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tablet" className="glass rounded-xl border-primary/15 px-5">
                <AccordionTrigger className="hover:no-underline gap-3">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-[hsl(220,80%,55%)]" />
                    <span className="font-semibold text-sm">Tablet / PC / Any Browser</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-3 pt-2">
                  <Step n={1}>Open your browser and navigate to <strong className="text-primary">{window.location.origin}/player</strong>.</Step>
                  <Step n={2}>Enter your <strong className="text-foreground">pairing code</strong> shown in your GLOW dashboard.</Step>
                  <Step n={3}>Go fullscreen (F11) and your signage is live. 🎉</Step>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* CTA + footer */}
          <div className="text-center pt-4 pb-8 space-y-4">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-[hsl(220,80%,55%)] hover:shadow-[0_0_30px_hsla(180,100%,45%,0.35)] transition-all duration-300"
            >
              <Tv className="h-4 w-4" />
              Start Glowing for Free
            </Link>
            <p className="text-[10px] text-muted-foreground/60 max-w-xs mx-auto leading-relaxed">
              By downloading, you agree to receive Glow updates and pro offers. Unsubscribe anytime.
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
