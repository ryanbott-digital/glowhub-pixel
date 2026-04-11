import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Check {
  label: string;
  status: "pass" | "fail" | "warn" | "loading";
  detail: string;
}

function StatusIcon({ status }: { status: Check["status"] }) {
  switch (status) {
    case "pass": return <CheckCircle2 className="w-5 h-5 text-glow-green shrink-0" />;
    case "fail": return <XCircle className="w-5 h-5 text-destructive shrink-0" />;
    case "warn": return <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />;
    case "loading": return <Loader2 className="w-5 h-5 text-muted-foreground animate-spin shrink-0" />;
  }
}

async function runChecks(): Promise<Check[]> {
  const checks: Check[] = [];

  // 1. Manifest link
  const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
  if (!manifestLink) {
    checks.push({ label: "Manifest link", status: "fail", detail: "No <link rel='manifest'> found in document" });
  } else {
    checks.push({ label: "Manifest link", status: "pass", detail: manifestLink.href });
  }

  // 2. Fetch & validate manifest
  let manifest: any = null;
  if (manifestLink) {
    try {
      const res = await fetch(manifestLink.href);
      manifest = await res.json();
      checks.push({ label: "Manifest fetchable", status: "pass", detail: `${res.status} OK` });
    } catch (e: any) {
      checks.push({ label: "Manifest fetchable", status: "fail", detail: e.message });
    }
  }

  if (manifest) {
    // name
    checks.push(manifest.name
      ? { label: "Manifest name", status: "pass", detail: manifest.name }
      : { label: "Manifest name", status: "fail", detail: "Missing" });

    // short_name
    checks.push(manifest.short_name
      ? { label: "Manifest short_name", status: "pass", detail: manifest.short_name }
      : { label: "Manifest short_name", status: "warn", detail: "Missing (recommended)" });

    // start_url
    checks.push(manifest.start_url
      ? { label: "start_url", status: "pass", detail: manifest.start_url }
      : { label: "start_url", status: "fail", detail: "Missing" });

    // display
    const validDisplays = ["standalone", "fullscreen", "minimal-ui"];
    checks.push(validDisplays.includes(manifest.display)
      ? { label: "display mode", status: "pass", detail: manifest.display }
      : { label: "display mode", status: "fail", detail: manifest.display || "Missing" });

    // scope
    checks.push(manifest.scope
      ? { label: "scope", status: "pass", detail: manifest.scope }
      : { label: "scope", status: "warn", detail: "Not set (defaults to /)" });

    // icons
    const icons: any[] = manifest.icons || [];
    const has192 = icons.some((i: any) => i.sizes?.includes("192x192"));
    const has512 = icons.some((i: any) => i.sizes?.includes("512x512"));
    const hasMaskable = icons.some((i: any) => (i.purpose || "").includes("maskable"));

    checks.push(has192
      ? { label: "192×192 icon", status: "pass", detail: "Found" }
      : { label: "192×192 icon", status: "fail", detail: "Required for installability" });

    checks.push(has512
      ? { label: "512×512 icon", status: "pass", detail: "Found" }
      : { label: "512×512 icon", status: "fail", detail: "Required for Play Store" });

    checks.push(hasMaskable
      ? { label: "Maskable icon", status: "pass", detail: "Found" }
      : { label: "Maskable icon", status: "warn", detail: "Recommended for adaptive icons" });

    // Verify icon URLs are reachable
    for (const icon of icons.slice(0, 4)) {
      try {
        const iconUrl = new URL(icon.src, window.location.origin).href;
        const r = await fetch(iconUrl, { method: "HEAD" });
        checks.push(r.ok
          ? { label: `Icon ${icon.sizes}`, status: "pass", detail: `${r.status} — ${iconUrl}` }
          : { label: `Icon ${icon.sizes}`, status: "fail", detail: `${r.status} — ${iconUrl}` });
      } catch (e: any) {
        checks.push({ label: `Icon ${icon.sizes}`, status: "fail", detail: e.message });
      }
    }
  }

  // 3. Service Worker
  if ("serviceWorker" in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    if (regs.length > 0) {
      const active = regs[0].active;
      checks.push({
        label: "Service Worker registered",
        status: "pass",
        detail: `Scope: ${regs[0].scope} — State: ${active?.state || "none"}`,
      });
    } else {
      checks.push({ label: "Service Worker registered", status: "warn", detail: "No registrations found (may register on navigation)" });
    }
  } else {
    checks.push({ label: "Service Worker support", status: "fail", detail: "Browser does not support Service Workers" });
  }

  // 4. HTTPS
  checks.push(location.protocol === "https:"
    ? { label: "HTTPS", status: "pass", detail: location.origin }
    : { label: "HTTPS", status: location.hostname === "localhost" ? "warn" : "fail", detail: location.protocol });

  // 5. Offline readiness — try fetching start_url from cache
  if ("caches" in window) {
    try {
      const keys = await caches.keys();
      checks.push({ label: "Cache Storage", status: keys.length > 0 ? "pass" : "warn", detail: `${keys.length} cache(s): ${keys.join(", ") || "none"}` });
    } catch {
      checks.push({ label: "Cache Storage", status: "warn", detail: "Unable to query" });
    }
  }

  // 6. Persistent storage
  if (navigator.storage?.persisted) {
    const persisted = await navigator.storage.persisted();
    checks.push({ label: "Persistent storage", status: persisted ? "pass" : "warn", detail: persisted ? "Granted" : "Not granted" });
  }

  return checks;
}

export default function PwaDiagnostics() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [running, setRunning] = useState(true);

  const run = async () => {
    setRunning(true);
    setChecks([]);
    const results = await runChecks();
    setChecks(results);
    setRunning(false);
  };

  useEffect(() => { run(); }, []);

  const passCount = checks.filter(c => c.status === "pass").length;
  const failCount = checks.filter(c => c.status === "fail").length;
  const warnCount = checks.filter(c => c.status === "warn").length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">PWA Diagnostics</h1>
        <Button onClick={run} disabled={running} size="sm" variant="outline">
          {running ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Re-run
        </Button>
      </div>

      {!running && (
        <div className="flex gap-2 mb-4">
          <Badge variant="secondary" className="bg-glow-green/20 text-glow-green">{passCount} passed</Badge>
          {failCount > 0 && <Badge variant="destructive">{failCount} failed</Badge>}
          {warnCount > 0 && <Badge variant="outline" className="border-yellow-500 text-yellow-500">{warnCount} warnings</Badge>}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Installability Checks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {running && checks.length === 0 && (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="w-5 h-5 animate-spin" /> Running diagnostics…
            </div>
          )}
          {checks.map((c, i) => (
            <div key={i} className="flex items-start gap-3">
              <StatusIcon status={c.status} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{c.label}</p>
                <p className="text-xs text-muted-foreground break-all">{c.detail}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
