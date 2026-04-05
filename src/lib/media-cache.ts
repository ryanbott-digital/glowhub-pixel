/**
 * Media Cache Helper
 *
 * Registers the media service worker and provides functions
 * to proactively cache playlist media files.
 */

const SW_PATH = "/media-sw.js";

let swRegistration: ServiceWorkerRegistration | null = null;

/** Register the media cache service worker (safe to call multiple times). */
export async function registerMediaSW(): Promise<boolean> {
  if (swRegistration) return true;

  // Don't register in iframes or preview hosts
  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const isPreviewHost =
    window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com");

  if (isInIframe || isPreviewHost) return false;

  if (!("serviceWorker" in navigator)) return false;

  try {
    swRegistration = await navigator.serviceWorker.register(SW_PATH, {
      scope: "/",
    });
    return true;
  } catch {
    return false;
  }
}

/** Send a list of media URLs to the service worker for proactive caching. */
export async function precacheMediaUrls(urls: string[]): Promise<void> {
  if (!urls.length) return;

  await registerMediaSW();

  const sw =
    navigator.serviceWorker?.controller ||
    swRegistration?.active;

  if (sw) {
    sw.postMessage({ type: "PRECACHE_MEDIA", urls });
  }
}

/** Get the current cache status from the service worker. */
export function getCacheStatus(): Promise<{ count: number; urls: string[] }> {
  return new Promise((resolve) => {
    const sw =
      navigator.serviceWorker?.controller ||
      swRegistration?.active;

    if (!sw) {
      resolve({ count: 0, urls: [] });
      return;
    }

    const handler = (event: MessageEvent) => {
      if (event.data?.type === "CACHE_STATUS") {
        navigator.serviceWorker.removeEventListener("message", handler);
        resolve({ count: event.data.count, urls: event.data.urls });
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    sw.postMessage({ type: "GET_CACHE_STATUS" });

    // Timeout after 3s
    setTimeout(() => {
      navigator.serviceWorker.removeEventListener("message", handler);
      resolve({ count: 0, urls: [] });
    }, 3000);
  });
}
