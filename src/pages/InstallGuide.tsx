import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Monitor, Wifi, Globe, Download, Settings, Play, ChevronRight, Smartphone, Tv } from "lucide-react";

const steps = {
  firestick: [
    {
      title: "Enable Apps from Unknown Sources",
      icon: Settings,
      content: (
        <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>From the Firestick home screen, go to <strong className="text-foreground">Settings</strong></li>
          <li>Select <strong className="text-foreground">My Fire TV</strong> (or Device & Software)</li>
          <li>Select <strong className="text-foreground">Developer Options</strong></li>
          <li>Turn on <strong className="text-foreground">Apps from Unknown Sources</strong></li>
        </ol>
      ),
    },
    {
      title: "Install a Web Browser",
      icon: Globe,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>You need a fullscreen-capable browser. We recommend:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong className="text-foreground">Amazon Silk Browser</strong> — free on the Appstore, search "Silk Browser"</li>
            <li><strong className="text-foreground">Firefox for Fire TV</strong> — also free and supports kiosk mode</li>
          </ul>
        </div>
      ),
    },
    {
      title: "Navigate to GlowHub Player",
      icon: Play,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Open the browser and navigate to your player URL:</p>
          <div className="bg-muted rounded-lg px-4 py-3 font-mono text-xs text-foreground break-all">
            {window.location.origin}/player/<span className="text-primary">YOUR_PAIRING_CODE</span>
          </div>
          <p>The 6-digit pairing code will be shown on screen. Enter it in your GlowHub dashboard under <strong className="text-foreground">Screens → Pair Screen</strong>.</p>
        </div>
      ),
    },
    {
      title: "Enable Fullscreen & Auto-Start",
      icon: Monitor,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>For the best signage experience:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Press <strong className="text-foreground">F11</strong> or use the browser menu to enter fullscreen</li>
            <li>Bookmark the player URL for quick access</li>
            <li><strong className="text-foreground">Optional:</strong> Use an app like "Autostart" (free) to launch the browser on boot</li>
          </ul>
        </div>
      ),
    },
    {
      title: "Keep the Screen Awake",
      icon: Tv,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Prevent the Firestick from sleeping:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to <strong className="text-foreground">Settings → Display & Sounds → Screen Saver</strong></li>
            <li>Set the start time to <strong className="text-foreground">Never</strong></li>
          </ol>
        </div>
      ),
    },
  ],
  androidtv: [
    {
      title: "Open the Built-in Browser",
      icon: Globe,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Most Android TV devices come with a browser. If not:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Open the <strong className="text-foreground">Google Play Store</strong></li>
            <li>Search for and install <strong className="text-foreground">Chrome</strong> or <strong className="text-foreground">TV Bro</strong> (a TV-optimized browser)</li>
          </ul>
        </div>
      ),
    },
    {
      title: "Navigate to GlowHub Player",
      icon: Play,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Enter the player URL in the browser:</p>
          <div className="bg-muted rounded-lg px-4 py-3 font-mono text-xs text-foreground break-all">
            {window.location.origin}/player/<span className="text-primary">YOUR_PAIRING_CODE</span>
          </div>
          <p>Your 6-digit pairing code will appear on the TV. Enter it in your GlowHub dashboard to link the screen.</p>
        </div>
      ),
    },
    {
      title: "Pair Your Screen",
      icon: Wifi,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <ol className="list-decimal list-inside space-y-1.5">
            <li>Log in to GlowHub on your computer or phone</li>
            <li>Go to <strong className="text-foreground">Screens</strong> and click <strong className="text-foreground">Pair Screen</strong></li>
            <li>Enter the 6-digit code shown on your TV</li>
            <li>The TV will automatically start playing your assigned playlist</li>
          </ol>
        </div>
      ),
    },
    {
      title: "Set Up Kiosk Mode (Recommended)",
      icon: Settings,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>For a dedicated signage experience, lock the TV to the player:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong className="text-foreground">Fully Kiosk Browser</strong> — a popular kiosk app available on the Play Store (free trial)</li>
            <li>Set the GlowHub player URL as the start page</li>
            <li>Enable "Prevent Sleep" and "Auto-Start on Boot"</li>
          </ul>
        </div>
      ),
    },
    {
      title: "Disable Screen Saver & Sleep",
      icon: Tv,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to <strong className="text-foreground">Settings → Device Preferences → Screen Saver</strong></li>
            <li>Set to <strong className="text-foreground">Off</strong> or <strong className="text-foreground">Never</strong></li>
            <li>Under <strong className="text-foreground">Settings → Device Preferences → About → Build</strong>, tap 7 times to enable Developer Options</li>
            <li>In Developer Options, enable <strong className="text-foreground">Stay Awake</strong></li>
          </ol>
        </div>
      ),
    },
  ],
};

export default function InstallGuide() {
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Install GlowHub Player</h1>
        <p className="text-muted-foreground mt-1">
          Set up your TV or streaming device as a digital signage screen in minutes.
        </p>
      </div>

      {/* Quick Overview */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Smartphone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">How it works</p>
              <p className="text-sm text-muted-foreground">
                GlowHub Player runs in a web browser — no app installation needed. Open the player URL on your device, enter the pairing code in your dashboard, and your screen is ready. Content updates automatically in real-time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Firestick Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Tv className="h-5 w-5 text-accent" />
            Amazon Firestick
            <Badge variant="secondary" className="ml-auto text-xs">Most Popular</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {steps.firestick.map((step, i) => (
            <div key={i}>
              {i > 0 && <Separator className="my-4" />}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{i + 1}</span>
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <step.icon className="h-4 w-4 text-primary" />
                    {step.title}
                  </h3>
                  {step.content}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Android TV Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Monitor className="h-5 w-5 text-primary" />
            Android TV / Google TV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {steps.androidtv.map((step, i) => (
            <div key={i}>
              {i > 0 && <Separator className="my-4" />}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{i + 1}</span>
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <step.icon className="h-4 w-4 text-primary" />
                    {step.title}
                  </h3>
                  {step.content}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-base">💡 Pro Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span><strong className="text-foreground">Ethernet over Wi-Fi</strong> — Use a USB ethernet adapter for more reliable connectivity on Firesticks.</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span><strong className="text-foreground">Power schedule</strong> — Use a smart plug to power your TV on/off on a timer.</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span><strong className="text-foreground">HDMI-CEC</strong> — Most TVs support turning on automatically when the Firestick powers up.</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span><strong className="text-foreground">Offline resilience</strong> — The player caches content locally, so brief network interruptions won't cause a blank screen.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
