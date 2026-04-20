import { useEffect, useState } from "react";
import { Shield, X, ExternalLink } from "lucide-react";

const DISMISS_KEY = "glow_silk_warning_dismissed";

/**
 * Detects if the player is running inside Amazon Silk browser
 * (i.e. NOT inside our Capacitor APK and NOT inside Fully Kiosk Browser).
 * Silk cannot programmatically hide its URL bar, so we surface a one-time
 * overlay telling the user to switch to the APK or Fully Kiosk Browser.
 */
function isAmazonSilk(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  // Capacitor native shell exposes window.Capacitor
  const isCapacitor = !!(window as unknown as { Capacitor?: unknown }).Capacitor;
  // Fully Kiosk Browser injects window.fully
  const isFullyKiosk = !!(window as unknown as { fully?: unknown }).fully || /FullyKiosk/i.test(ua);
  if (isCapacitor || isFullyKiosk) return false;
  return /\bSilk\b/i.test(ua);
}

export function SilkFallbackOverlay() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isAmazonSilk()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch { /* noop */ }
    setShow(true);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* noop */ }
    setShow(false);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{ background: "rgba(2, 6, 23, 0.92)", backdropFilter: "blur(12px)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="silk-warning-title"
    >
      <div
        className="relative max-w-lg w-full rounded-2xl p-8 space-y-5 text-center"
        style={{
          background: "rgba(11, 17, 32, 0.95)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          boxShadow: "0 0 60px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div
          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(234, 88, 12, 0.12))",
            border: "1px solid rgba(245, 158, 11, 0.3)",
          }}
        >
          <Shield className="h-8 w-8 text-amber-400" />
        </div>

        <div className="space-y-2">
          <h2 id="silk-warning-title" className="text-xl font-extrabold tracking-wide text-foreground">
            You're in the Fire Stick browser
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Amazon Silk always shows a URL bar at the top — this can't be hidden by any web app.
            For a true fullscreen kiosk, install the <strong className="text-foreground">GlowHub APK</strong> or
            <strong className="text-foreground"> Fully Kiosk Browser</strong>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <a
            href="/download"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_24px_rgba(245,158,11,0.3)] hover:shadow-[0_0_32px_rgba(245,158,11,0.5)] transition-all"
          >
            Open Setup Guide
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            onClick={dismiss}
            className="flex-1 inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold text-muted-foreground bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:text-foreground transition-all"
          >
            Continue anyway
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground/60 font-mono pt-1">
          This message only appears once per device.
        </p>
      </div>
    </div>
  );
}
