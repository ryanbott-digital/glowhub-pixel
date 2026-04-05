/**
 * Media Cache Service Worker — Offline-First Engine
 *
 * Strategy: CACHE-FIRST with background refresh.
 * - Always check Cache Storage first → instant offline playback.
 * - If cache miss, fetch from network and store in cache.
 * - On cache hit, optionally refresh in background (stale-while-revalidate).
 *
 * Handles: precaching, eviction, progress reporting, persistent storage.
 */

const CACHE_NAME = "glowhub-media-v1";

// Match Supabase storage URLs for signage-content bucket
function isMediaRequest(url) {
  return url.includes("/storage/v1/object/public/signage-content/");
}

// ── Install: skip waiting ──
self.addEventListener("install", () => {
  self.skipWaiting();
});

// ── Activate: claim clients, clean old caches ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
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

// ── Fetch: CACHE-FIRST for media, passthrough for everything else ──
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (!isMediaRequest(request.url)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // 1. Check cache first — instant response even offline
      const cached = await cache.match(request);
      if (cached) {
        // Background refresh: update cache silently for freshness
        event.waitUntil(
          fetch(request)
            .then((res) => {
              if (res.ok) cache.put(request, res);
            })
            .catch(() => {})
        );
        return cached;
      }

      // 2. Cache miss — try network
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        }
        return networkResponse;
      } catch (_err) {
        // Fully offline with no cache
        return new Response("Media not available offline", {
          status: 503,
          statusText: "Service Unavailable",
        });
      }
    })()
  );
});

// ── Messages from app ──
self.addEventListener("message", (event) => {
  const { type } = event.data || {};

  if (type === "PRECACHE_MEDIA") {
    const urls = event.data.urls || [];
    event.waitUntil(precacheWithProgress(urls, event.source));
  }

  if (type === "EVICT_STALE") {
    const activeUrls = new Set(event.data.urls || []);
    event.waitUntil(evictStale(activeUrls));
  }

  if (type === "GET_CACHE_STATUS") {
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

// ── Evict files not in active playlist ──
async function evictStale(activeUrls) {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  let evicted = 0;
  for (const request of keys) {
    if (!activeUrls.has(request.url)) {
      await cache.delete(request);
      evicted++;
    }
  }
  // Broadcast eviction result to all clients
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({ type: "CACHE_EVICTED", evicted });
  }
}

// ── Precache with per-file progress reporting ──
async function precacheWithProgress(urls, source) {
  const cache = await caches.open(CACHE_NAME);
  const total = urls.length;
  let completed = 0;
  let failed = 0;

  // Report initial state
  broadcastProgress(total, completed, failed);

  for (const url of urls) {
    try {
      const existing = await cache.match(url);
      if (existing) {
        completed++;
        broadcastProgress(total, completed, failed);
        continue;
      }

      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        completed++;
      } else {
        failed++;
      }
    } catch (_err) {
      failed++;
    }
    broadcastProgress(total, completed, failed);
  }

  // Final complete message
  broadcastProgress(total, completed, failed, true);
}

async function broadcastProgress(total, completed, failed, done = false) {
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({
      type: "CACHE_PROGRESS",
      total,
      completed,
      failed,
      done,
    });
  }
}
