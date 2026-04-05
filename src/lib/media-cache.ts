/**
 * Media Cache Helper
 *
 * Registers the media service worker, manages proactive caching,
 * persistent storage, and progress tracking.
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

/** Request persistent storage so the browser won't evict our cache. */
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    try {
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }
  return false;
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

/** Evict cached media that is no longer in the active playlist. */
export function evictStaleMedia(activeUrls: string[]): void {
  const sw =
    navigator.serviceWorker?.controller ||
    swRegistration?.active;

  if (sw) {
    sw.postMessage({ type: "EVICT_STALE", urls: activeUrls });
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

    setTimeout(() => {
      navigator.serviceWorker.removeEventListener("message", handler);
      resolve({ count: 0, urls: [] });
    }, 3000);
  });
}

export interface CacheProgress {
  total: number;
  completed: number;
  failed: number;
  done: boolean;
}

/** Listen for cache progress updates from the service worker. */
export function onCacheProgress(callback: (progress: CacheProgress) => void): () => void {
  const handler = (event: MessageEvent) => {
    if (event.data?.type === "CACHE_PROGRESS") {
      callback({
        total: event.data.total,
        completed: event.data.completed,
        failed: event.data.failed,
        done: event.data.done,
      });
    }
  };

  navigator.serviceWorker?.addEventListener("message", handler);
  return () => {
    navigator.serviceWorker?.removeEventListener("message", handler);
  };
}
