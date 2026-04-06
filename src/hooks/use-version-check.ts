import { useEffect, useRef } from "react";
import { toast } from "sonner";

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = "glowhub_app_hash";

/**
 * Periodically fetches index.html to detect new deployments.
 * When the page's script fingerprint changes, it shows a brief
 * toast and reloads after a short delay so Firestick devices
 * always run the latest code.
 */
export function useVersionCheck(enabled = true) {
  const currentHash = useRef<string | null>(null);
  const reloading = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const extractHash = (html: string): string => {
      // Match Vite's hashed entry: /assets/index-XXXXXX.js
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
          // First run — store the baseline
          currentHash.current = hash;
          localStorage.setItem(STORAGE_KEY, hash);
          return;
        }

        if (hash !== currentHash.current) {
          reloading.current = true;
          console.log(`[VersionCheck] New version detected (${currentHash.current} → ${hash}), reloading…`);
          toast.info("Updating to latest version…", { duration: 3000 });
          localStorage.setItem(STORAGE_KEY, hash);

          // Wait for the toast to show, then reload
          setTimeout(() => {
            window.location.reload();
          }, 2500);
        }
      } catch {
        // Network error — silently ignore (device may be offline)
      }
    };

    // Initial check after a short delay (don't block boot)
    const initialTimer = setTimeout(check, 30_000);
    const interval = setInterval(check, CHECK_INTERVAL);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [enabled]);
}
