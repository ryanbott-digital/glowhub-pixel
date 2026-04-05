/**
 * Media Cache Service Worker
 * 
 * Intercepts requests to Supabase Storage (signage-content bucket)
 * and serves from Cache Storage when offline.
 * 
 * Strategy: Network-first with cache fallback.
 * - Online: fetch from network, update cache
 * - Offline: serve from cache
 */

const CACHE_NAME = "glowhub-media-v1";

// Match Supabase storage URLs for our signage-content bucket
function isMediaRequest(url) {
  return url.includes("/storage/v1/object/public/signage-content/");
}

// Install: activate immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate: claim all clients and clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old cache versions
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("glowhub-media-") && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      ),
    ])
  );
});

// Fetch: network-first for media, passthrough for everything else
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (!isMediaRequest(request.url)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        // Try network first
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
          // Clone and cache the response
          cache.put(request, networkResponse.clone());
          return networkResponse;
        }

        // Non-OK response — try cache
        const cached = await cache.match(request);
        return cached || networkResponse;
      } catch (_err) {
        // Network failed (offline) — serve from cache
        const cached = await cache.match(request);
        if (cached) return cached;

        // Nothing cached either
        return new Response("Media not available offline", {
          status: 503,
          statusText: "Service Unavailable",
        });
      }
    })()
  );
});

// Listen for messages from the app
self.addEventListener("message", (event) => {
  if (event.data?.type === "PRECACHE_MEDIA") {
    const urls = event.data.urls || [];
    event.waitUntil(precacheUrls(urls));
  }

  if (event.data?.type === "EVICT_STALE") {
    const activeUrls = new Set(event.data.urls || []);
    event.waitUntil(evictStale(activeUrls));
  }

  if (event.data?.type === "GET_CACHE_STATUS") {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        event.source.postMessage({
          type: "CACHE_STATUS",
          count: keys.length,
          urls: keys.map((r) => r.url),
        });
      })()
    );
  }
});

async function evictStale(activeUrls) {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  for (const request of keys) {
    if (!activeUrls.has(request.url)) {
      await cache.delete(request);
    }
  }
}

async function precacheUrls(urls) {
  const cache = await caches.open(CACHE_NAME);

  for (const url of urls) {
    try {
      // Check if already cached
      const existing = await cache.match(url);
      if (existing) continue;

      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (_err) {
      // Silently skip — will be cached on next play
    }
  }
}
