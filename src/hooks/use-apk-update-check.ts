import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { APK_VERSION } from "@/lib/apk-version";

const DISMISS_KEY = "glowhub_apk_update_dismissed";
const DISMISS_TTL = 24 * 60 * 60 * 1000; // 24 hours

function isNewerVersion(remote: string, local: string): boolean {
  const r = remote.split(".").map(Number);
  const l = local.split(".").map(Number);
  for (let i = 0; i < Math.max(r.length, l.length); i++) {
    const rv = r[i] ?? 0;
    const lv = l[i] ?? 0;
    if (rv > lv) return true;
    if (rv < lv) return false;
  }
  return false;
}

function isApkEnvironment(): boolean {
  const ua = navigator.userAgent;
  return (
    /AFT|FireTV|AFTM|AFTT|AFTS|AFTB|AFTKA/i.test(ua) ||
    typeof (window as any).Capacitor !== "undefined"
  );
}

export function useApkUpdateCheck(intervalMs = 30 * 60 * 1000) {
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>("/download");
  const [dismissed, setDismissed] = useState(false);

  const showBanner =
    latestVersion !== null &&
    isNewerVersion(latestVersion, APK_VERSION) &&
    !dismissed;

  useEffect(() => {
    if (!isApkEnvironment()) return;

    // Check if previously dismissed within TTL
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < DISMISS_TTL) {
      setDismissed(true);
    }

    const check = async () => {
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("key, value")
          .in("key", ["latest_apk_version", "apk_download_url"]);

        if (data) {
          for (const row of data) {
            if (row.key === "latest_apk_version") setLatestVersion(row.value);
            if (row.key === "apk_download_url") setDownloadUrl(row.value || "/download");
          }
        }
      } catch {
        // silently ignore
      }
    };

    check();
    const interval = setInterval(check, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  return { showBanner, latestVersion, currentVersion: APK_VERSION, downloadUrl, dismiss };
}
