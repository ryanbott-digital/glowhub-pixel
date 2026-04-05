import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Monitor, CheckCircle, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  if (isStandalone) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 animate-fade-in">
        <CheckCircle className="h-16 w-16 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Already Installed</h1>
        <p className="text-muted-foreground text-center max-w-sm">
          You're running GlowHub as an installed app. You're all set!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
      <div className="text-center pt-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <Download className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Install GlowHub</h1>
        <p className="text-muted-foreground mt-1">
          Add GlowHub to your home screen for instant access — no app store needed.
        </p>
      </div>

      {/* Install button (Android / Desktop Chrome) */}
      {installed ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6 flex flex-col items-center gap-3">
            <CheckCircle className="h-10 w-10 text-primary" />
            <p className="font-semibold text-foreground">GlowHub has been installed!</p>
            <p className="text-sm text-muted-foreground text-center">
              Find it on your home screen or app drawer.
            </p>
          </CardContent>
        </Card>
      ) : deferredPrompt ? (
        <Card className="border-primary/30">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Smartphone className="h-10 w-10 text-primary" />
            <p className="text-sm text-muted-foreground text-center">
              Tap the button below to install GlowHub as an app on this device.
            </p>
            <Button size="lg" className="w-full" onClick={handleInstall}>
              <Download className="h-4 w-4 mr-2" />
              Install GlowHub
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* iOS instructions */}
          {isIOS && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-6 w-6 text-primary flex-shrink-0" />
                  <h2 className="font-semibold text-foreground">Install on iPhone / iPad</h2>
                </div>
                <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary mt-0.5">1</span>
                    <span>Tap the <Share className="inline h-4 w-4 text-foreground align-text-bottom" /> <strong className="text-foreground">Share</strong> button in Safari</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary mt-0.5">2</span>
                    <span>Scroll down and tap <strong className="text-foreground">Add to Home Screen</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary mt-0.5">3</span>
                    <span>Tap <strong className="text-foreground">Add</strong> to confirm</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Generic / Android manual instructions */}
          {!isIOS && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Monitor className="h-6 w-6 text-primary flex-shrink-0" />
                  <h2 className="font-semibold text-foreground">Install on Android / Desktop</h2>
                </div>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary mt-0.5">1</span>
                    <span>Open this page in <strong className="text-foreground">Chrome</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary mt-0.5">2</span>
                    <span>Tap the <strong className="text-foreground">⋮ menu</strong> (three dots) in the top-right corner</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary mt-0.5">3</span>
                    <span>Select <strong className="text-foreground">Install app</strong> or <strong className="text-foreground">Add to Home screen</strong></span>
                  </li>
                </ol>
                <p className="text-xs text-muted-foreground border-t border-border pt-3">
                  💡 On Fire TV, use Silk Browser to navigate here and bookmark the page for quick access.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Benefits */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-foreground text-sm mb-3">Why install?</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              "Launches instantly from your home screen",
              "Runs in fullscreen — no browser bars",
              "Works offline with cached content",
              "Auto-updates in the background",
            ].map((text) => (
              <li key={text} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
