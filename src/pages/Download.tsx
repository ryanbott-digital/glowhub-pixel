import { Link } from "react-router-dom";
import { GlowLogoImage } from "@/components/GlowHubLogo";
import { Download, Tv, Globe, Cpu, Lightbulb, CheckCircle2, ExternalLink, Flame } from "lucide-react";

const DOWNLOADER_CODE = "6934153";

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-[#0B1120] text-foreground font-['Satoshi','Inter',system-ui,sans-serif] relative overflow-x-hidden">
      {/* Mesh gradient background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[600px] h-[600px] rounded-full bg-primary/[0.06] blur-[120px]" />
        <div className="absolute bottom-[15%] right-[10%] w-[500px] h-[500px] rounded-full bg-[#3B82F6]/[0.05] blur-[100px]" />
        <div className="absolute top-[50%] left-[50%] w-[400px] h-[400px] rounded-full bg-[#8B5CF6]/[0.04] blur-[90px] -translate-x-1/2" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0B1120]/80 border-b border-border/50">
        <div className="flex items-center justify-between px-6 py-3.5 max-w-5xl mx-auto">
          <Link to="/home">
            <GlowLogoImage className="h-8" />
          </Link>
          <Link
            to="/auth"
            className="text-sm font-medium px-5 py-2 rounded-lg bg-gradient-to-r from-primary to-[#3B82F6] text-primary-foreground hover:shadow-[0_0_20px_hsla(var(--primary),0.35)] transition-all"
          >
            Login
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12 stagger-in">
        {/* Header with pulsing icon */}
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <img
              src="/icon-512x512.png"
              alt="GLOW Icon"
              className="w-28 h-28 mx-auto rounded-3xl animate-pulse drop-shadow-[0_0_30px_hsla(180,100%,45%,0.4)]"
            />
            <div className="absolute inset-0 rounded-3xl bg-primary/10 blur-[20px] animate-pulse" />
          </div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-[0.08em] uppercase">
              Install <span className="bg-gradient-to-r from-primary to-[#3B82F6] bg-clip-text text-transparent">GLOW</span>
            </h1>
            <p className="text-muted-foreground mt-3 text-base sm:text-lg max-w-lg mx-auto">
              Get your Firestick or Android TV running GLOW in under 2 minutes.
            </p>
          </div>
        </div>

        {/* ── PRIMARY: Firestick Install Card ── */}
        <div className="glass-strong glass-spotlight rounded-2xl p-8 border-primary/20 relative overflow-hidden">
          {/* Conic gradient accent */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[conic-gradient(from_180deg,hsla(180,100%,45%,0.15),hsla(220,80%,55%,0.1),transparent)] rounded-full blur-[40px]" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                <Flame className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-wide">Install on Firestick</h2>
                <span className="text-xs text-primary font-semibold uppercase tracking-widest">Recommended</span>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">1</span>
                <p className="text-sm text-muted-foreground">
                  Install the <strong className="text-foreground">"Downloader"</strong> app from the Amazon App Store.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">2</span>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Open Downloader and enter this code:
                  </p>
                  {/* Neon code box */}
                  <div className="inline-flex items-center gap-1 px-6 py-4 rounded-xl bg-[#0B1120] border border-primary/30 shadow-[0_0_30px_hsla(180,100%,45%,0.12),inset_0_0_20px_hsla(180,100%,45%,0.05)]">
                    {DOWNLOADER_CODE.split("").map((digit, i) => (
                      <span
                        key={i}
                        className="text-3xl sm:text-4xl font-extrabold font-mono tracking-[0.15em] text-primary drop-shadow-[0_0_8px_hsla(180,100%,45%,0.6)]"
                      >
                        {digit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">3</span>
                <p className="text-sm text-muted-foreground">
                  Install the app and <strong className="text-foreground">start Glowing</strong>. ✨
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ALTERNATIVE METHODS ── */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Direct APK Download */}
          <div className="glass glass-spotlight rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Download className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-bold text-sm tracking-wide">Direct APK Download</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              For advanced users or Android TV boxes. Sideload the APK directly onto your device.
            </p>
            <a
              href="/GlowHub.apk"
              download
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary/20 to-[#3B82F6]/20 border border-primary/25 text-primary hover:border-primary/50 hover:shadow-[0_0_20px_hsla(180,100%,45%,0.15)] transition-all duration-300"
            >
              <Download className="h-4 w-4" />
              Download APK
            </a>
          </div>

          {/* Browser Mode */}
          <div className="glass glass-spotlight rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
                <Globe className="h-4 w-4 text-[#3B82F6]" />
              </div>
              <h3 className="font-bold text-sm tracking-wide">Browser Mode</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No install needed. Just open the player URL in any TV browser for instant signage.
            </p>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted/50 border border-border font-mono text-xs text-foreground">
              <span className="truncate">{window.location.origin}/player</span>
              <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* ── SYSTEM REQUIREMENTS ── */}
        <div className="glass glass-spotlight rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Cpu className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-bold tracking-wide">System Requirements</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              "Amazon Fire TV Stick Lite",
              "Amazon Fire TV Stick 4K",
              "Amazon Fire TV Stick 4K Max",
              "Android TV 9.0+",
              "Google TV (Chromecast)",
              "Any device with a modern browser",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── PRO TIP ── */}
        <div className="glass rounded-2xl p-6 border-accent/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent via-primary to-transparent" />
          <div className="flex items-start gap-3 pl-3">
            <Lightbulb className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-accent">Pro Tip</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                For the best experience, pin GLOW to your Firestick home screen for one-click access.
                Go to <strong className="text-foreground">Settings → Applications → Manage Installed Apps → GLOW → Move to Front</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-4 pb-8 space-y-4">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-[#0B1120] bg-gradient-to-r from-primary to-[#3B82F6] hover:shadow-[0_0_30px_hsla(180,100%,45%,0.35)] transition-all duration-300 magnetic-btn"
          >
            <Tv className="h-4 w-4" />
            Start Glowing for Free
          </Link>
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth" className="text-primary hover:underline">
              Log in
            </Link>{" "}
            to manage your screens.
          </p>
        </div>
      </div>
    </div>
  );
}
