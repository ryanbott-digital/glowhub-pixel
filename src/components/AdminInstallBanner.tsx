import { useState, useEffect, useCallback } from "react";
import { X, Download, Share, ArrowDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "glowhub_admin_install_dismissed";

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

export function AdminInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [iosDevice, setIosDevice] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    if (isIOS()) {
      setIosDevice(true);
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (iosDevice) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt, iosDevice]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  }, []);

  return (
    <>
      {visible && (
        <div className="sticky top-0 z-50 flex items-center justify-between gap-3 px-4 py-2.5 bg-gradient-to-r from-primary/90 to-primary text-primary-foreground text-sm shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 min-w-0">
            <Download className="h-4 w-4 shrink-0" />
            <span className="truncate font-medium">
              Install Glow Admin for a faster, full-screen experience.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 px-3 text-xs font-semibold"
              onClick={handleInstall}
            >
              Install
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Install Guide Modal */}
      <Dialog open={showIOSGuide} onOpenChange={setShowIOSGuide}>
        <DialogContent className="glass-strong border-border/50 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2 text-base">
              <Download className="h-5 w-5 text-primary" />
              Install Glow Admin
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-1">
            <p className="text-xs text-muted-foreground">
              Safari doesn't have an install button, but you can add Glow Admin to your Home Screen in 3 easy steps:
            </p>

            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
                1
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Tap the Share button
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Look for the</span>
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-muted">
                    <Share className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <span>icon at the bottom of Safari</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
                2
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Scroll down & tap "Add to Home Screen"
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Look for the</span>
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-muted">
                    <Plus className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <span>icon in the share sheet</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
                3
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Tap "Add" to confirm
                </p>
                <p className="text-xs text-muted-foreground">
                  Glow Admin will appear on your Home Screen with the full app experience.
                </p>
              </div>
            </div>

            {/* Push notification note */}
            <div className="rounded-xl bg-muted/40 border border-border/40 p-3 space-y-1.5">
              <p className="text-xs font-medium text-foreground">📲 Push Notifications on iOS</p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                After installing to your Home Screen, open the app and enable <span className="font-medium text-foreground">Offline Alerts</span> in Settings. iOS 16.4+ supports push notifications for Home Screen apps.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowIOSGuide(false)}
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
