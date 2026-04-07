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
      title: "Install the GlowHub APK",
      icon: Download,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>The easiest way to get Glow on your Firestick:</p>
          <ol className="list-decimal list-inside space-y-1.5">
            <li>Install the <a href="https://www.amazon.com/dp/B01N0BP507" target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium">Downloader</a> app from the Amazon Appstore (free)</li>
            <li>Open Downloader and enter code: <span className="font-mono text-primary font-bold">1648081</span></li>
            <li>The GlowHub APK will download and install automatically</li>
            <li>The app will appear in <strong className="text-foreground">Your Apps & Channels</strong> on the home screen</li>
          </ol>
          <p className="text-xs mt-2 text-muted-foreground/70">
            <strong>Tip:</strong> If the app doesn't appear in your app list, long-press the home button and check "App Library", or move it to the front row from Settings → Applications → Manage Installed Applications.
          </p>
          <div className="mt-3 p-2.5 rounded-lg bg-accent/10 border border-accent/20">
            <p className="text-xs font-medium text-foreground mb-1">🔧 Building a Fire TV APK from your phone</p>
            <p className="text-xs text-muted-foreground">
              If the APK doesn't show in the Fire TV app grid, you can rebuild it with Leanback support using our automated cloud build:
            </p>
            <ol className="list-decimal list-inside text-xs text-muted-foreground mt-1 space-y-0.5">
              <li>Go to <strong className="text-foreground">pwabuilder.com</strong> and download the <em>Android source ZIP</em></li>
              <li>Upload the ZIP to your GitHub repo root</li>
              <li>Go to <strong className="text-foreground">Actions → Build Fire TV APK → Run workflow</strong></li>
              <li>Download the built APK from the workflow artifacts</li>
              <li>Sideload the new APK to your Fire TV</li>
            </ol>
          </div>
          <div className="mt-3 p-2.5 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs font-medium text-foreground mb-1">📺 App not showing in Fire TV grid?</p>
            <p className="text-xs text-muted-foreground">
              Install the free <a href="https://www.amazon.com/dp/B01N39YCGP" target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium">Sideload Launcher</a> from the Amazon Appstore — it shows all installed apps including sideloaded ones that are hidden from the default home screen.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Install a Web Browser",
      icon: Globe,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>You need a fullscreen-capable browser. We recommend:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><a href="https://www.amazon.com/dp/B01M35MQV4" target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium">Amazon Silk Browser</a> — free on the Appstore</li>
            <li><a href="https://www.amazon.com/dp/B01LWPEXHM" target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium">Firefox for Fire TV</a> — also free and supports kiosk mode</li>
          </ul>
        </div>
      ),
    },
    {
      title: "Navigate to Glow Player",
      icon: Play,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Open the browser and navigate to your player URL:</p>
          <div className="bg-muted rounded-lg px-4 py-3 font-mono text-xs text-foreground break-all">
            {window.location.origin}/player/<span className="text-primary">YOUR_PAIRING_CODE</span>
          </div>
          <p>The 6-digit pairing code will be shown on screen. Enter it in your Glow dashboard under <strong className="text-foreground">Screens → Pair Screen</strong>.</p>
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
      title: "Navigate to Glow Player",
      icon: Play,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Enter the player URL in the browser:</p>
          <div className="bg-muted rounded-lg px-4 py-3 font-mono text-xs text-foreground break-all">
            {window.location.origin}/player/<span className="text-primary">YOUR_PAIRING_CODE</span>
          </div>
          <p>Your 6-digit pairing code will appear on the TV. Enter it in your Glow dashboard to link the screen.</p>
        </div>
      ),
    },
    {
      title: "Pair Your Screen",
      icon: Wifi,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <ol className="list-decimal list-inside space-y-1.5">
            <li>Log in to Glow on your computer or phone</li>
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
            <li>Set the Glow player URL as the start page</li>
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
  smarttv: [
    {
      title: "Cast a Tab with Chromecast",
      icon: Wifi,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>If you have a Chromecast or Chromecast-built-in TV:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open <strong className="text-foreground">Google Chrome</strong> on your computer</li>
            <li>Navigate to your player URL (see step 3 below)</li>
            <li>Click the <strong className="text-foreground">three-dot menu → Cast</strong></li>
            <li>Select your Chromecast device and choose <strong className="text-foreground">Cast tab</strong></li>
          </ol>
        </div>
      ),
    },
    {
      title: "Use the Built-in Browser (Samsung / LG / Vizio)",
      icon: Globe,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Most modern Smart TVs ship with a web browser:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong className="text-foreground">Samsung</strong> — Open the <em>Internet</em> app from the app drawer</li>
            <li><strong className="text-foreground">LG webOS</strong> — Launch the <em>Web Browser</em> from the home bar</li>
            <li><strong className="text-foreground">Vizio SmartCast</strong> — Use the built-in Chromecast to cast a Chrome tab</li>
          </ul>
        </div>
      ),
    },
    {
      title: "Navigate to Glow Player & Pair",
      icon: Play,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Enter the player URL in the browser:</p>
          <div className="bg-muted rounded-lg px-4 py-3 font-mono text-xs text-foreground break-all">
            {window.location.origin}/player/<span className="text-primary">YOUR_PAIRING_CODE</span>
          </div>
          <p>Enter the 6-digit code shown on your TV into <strong className="text-foreground">Screens → Pair Screen</strong> in your dashboard.</p>
        </div>
      ),
    },
    {
      title: "Disable Screen Saver & Sleep",
      icon: Settings,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Prevent the TV from sleeping or showing a screensaver:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong className="text-foreground">Samsung</strong> — Settings → General → System Manager → Time → Sleep Timer → Off</li>
            <li><strong className="text-foreground">LG</strong> — Settings → General → Timers → Off</li>
            <li>Alternatively, use a <strong className="text-foreground">smart plug</strong> to schedule power on/off</li>
          </ul>
        </div>
      ),
    },
    {
      title: "Lock to Fullscreen",
      icon: Monitor,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>For the cleanest signage look:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Press <strong className="text-foreground">F11</strong> or use the browser's fullscreen option</li>
            <li>Bookmark the URL so the TV can reload quickly after a power cycle</li>
            <li><strong className="text-foreground">Tip:</strong> Some Samsung TVs support a <em>URL Launcher</em> in their business settings for kiosk mode</li>
          </ul>
        </div>
      ),
    },
  ],
  raspberrypi: [
    {
      title: "Install Raspberry Pi OS",
      icon: Download,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <ol className="list-decimal list-inside space-y-1">
            <li>Download <strong className="text-foreground">Raspberry Pi Imager</strong> from <em>raspberrypi.com</em></li>
            <li>Flash <strong className="text-foreground">Raspberry Pi OS (Desktop)</strong> to a microSD card</li>
            <li>Insert the card, connect HDMI, keyboard and power — boot the Pi</li>
            <li>Complete the initial setup wizard (Wi-Fi, locale, updates)</li>
          </ol>
        </div>
      ),
    },
    {
      title: "Open Chromium & Navigate to Glow",
      icon: Globe,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Chromium comes pre-installed on Raspberry Pi OS:</p>
          <div className="bg-muted rounded-lg px-4 py-3 font-mono text-xs text-foreground break-all">
            {window.location.origin}/player/<span className="text-primary">YOUR_PAIRING_CODE</span>
          </div>
          <p>Enter the 6-digit pairing code in your dashboard under <strong className="text-foreground">Screens → Pair Screen</strong>.</p>
        </div>
      ),
    },
    {
      title: "Enable Kiosk Mode (Auto-Start Fullscreen)",
      icon: Settings,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Launch Chromium in fullscreen kiosk mode on every boot:</p>
          <div className="bg-muted rounded-lg px-4 py-3 font-mono text-xs text-foreground break-all">
            nano ~/.config/autostart/glowhub.desktop
          </div>
          <p className="pt-1">Paste the following:</p>
          <div className="bg-muted rounded-lg px-4 py-3 font-mono text-xs text-foreground break-all whitespace-pre-wrap">{`[Desktop Entry]\nType=Application\nName=Glow\nExec=chromium-browser --noerrdialogs --disable-infobars --kiosk ${window.location.origin}/player/YOUR_CODE`}</div>
        </div>
      ),
    },
    {
      title: "Disable Screen Blanking",
      icon: Tv,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Prevent the screen from going blank:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open <strong className="text-foreground">Raspberry Pi Configuration → Display</strong></li>
            <li>Set <strong className="text-foreground">Screen Blanking</strong> to <em>Disabled</em></li>
            <li>Alternatively, run: <code className="bg-muted px-1.5 py-0.5 rounded text-xs text-foreground">sudo raspi-config</code> → Display Options → Screen Blanking → No</li>
          </ol>
        </div>
      ),
    },
    {
      title: "Hide the Mouse Cursor",
      icon: Monitor,
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Install <strong className="text-foreground">unclutter</strong> to auto-hide the cursor:</p>
          <div className="bg-muted rounded-lg px-4 py-3 font-mono text-xs text-foreground break-all">
            sudo apt install unclutter -y
          </div>
          <p>It will auto-hide the cursor after a few seconds of inactivity on the next reboot.</p>
        </div>
      ),
    },
  ],
};

export default function InstallGuide() {
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Install Glow Player</h1>
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
                Glow Player runs in a web browser — no app installation needed. Open the player URL on your device, enter the pairing code in your dashboard, and your screen is ready. Content updates automatically in real-time.
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

      {/* Chromecast / Smart TV Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Globe className="h-5 w-5 text-primary" />
            Chromecast / Smart TV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {steps.smarttv.map((step, i) => (
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
      {/* Raspberry Pi Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Monitor className="h-5 w-5 text-primary" />
            Raspberry Pi
            <Badge variant="secondary" className="ml-auto text-xs">Best Value</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {steps.raspberrypi.map((step, i) => (
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
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span><strong className="text-foreground">Raspberry Pi heatsink case</strong> — For 24/7 operation, use a passive aluminium heatsink case (e.g. Flirc or Argon Neo) to keep the Pi cool without a noisy fan.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
