import { useEffect, useRef } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "glowhub_app_hash";

/**
 * Periodically fetches index.html to detect new deployments.
 * When the page's script fingerprint changes, it shows a brief
 * toast and reloads after a short delay so Firestick devices
 * always run the latest code.
 *
 * @param intervalMs – polling interval in milliseconds (0 = disabled)
 */
export function useVersionCheck(intervalMs: number, silent = false) {
  const currentHash = useRef<string | null>(null);
  const reloading = useRef(false);

  useEffect(() => {
    if (intervalMs <= 0) return;

    const extractHash = (html: string): string => {
      const match = html.match(/src="\/assets\/index[.-]([a-zA-Z0-9]+)\.js"/);
      return match?.[1] ?? html.length.toString();
    };

    const check = async () => {
      if (reloading.current) return;
      try {
        const res = await fetch(`/?_t=${Date.now()}`, {
          cache: "no-store",
          headers: { Accept: "text/html" },
        });
        if (!res.ok) return;
        const html = await res.text();
        const hash = extractHash(html);

        if (currentHash.current === null) {
          currentHash.current = hash;
          localStorage.setItem(STORAGE_KEY, hash);
          return;
        }

        if (hash !== currentHash.current) {
          reloading.current = true;
          console.log(`[VersionCheck] New version detected (${currentHash.current} → ${hash}), reloading…`);
          localStorage.setItem(STORAGE_KEY, hash);
          if (silent) {
            window.location.reload();
          } else {
            toast.info("Updating to latest version…", { duration: 3000 });
            setTimeout(() => window.location.reload(), 2500);
          }
        }
      } catch {
        // Network error — silently ignore
      }
    };

    const initialTimer = setTimeout(check, 30_000);
    const interval = setInterval(check, intervalMs);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [intervalMs]);
}
