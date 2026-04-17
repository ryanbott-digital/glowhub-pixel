/**
 * GlowHub PWA Service Worker
 * Handles offline caching and navigation fallback for APK/PWA installability.
 * 
 * IMPORTANT: Hashed JS/CSS bundles use NetworkFirst so code updates always
 * propagate to APK-wrapped TVs without re-packaging.
 */

const CACHE_NAME = "glowhub-pwa-v3";
const PRECACHE_URLS = ["/index.html", "/manifest.json"];

// Install: precache shell + force activate immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: purge ALL old caches, claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Push notification handler — Glow Watchdog
self.addEventListener("push", (event) => {
  let data = { title: "Glow Alert", body: "A screen needs attention.", icon: "/admin-icon-alert-192x192.png", url: "/screens" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {
    // fallback to defaults
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: "/admin-icon-192x192.png",
      vibrate: [200, 100, 200],
      data: { url: data.url },
    })
  );
});

// Notification click — open the relevant page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/screens";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(targetUrl) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

// Pattern: JS/CSS bundles from Vite (hashed filenames in /assets/)
const CODE_BUNDLE_PATTERN = /\/assets\/.*\.(js|css|mjs)(\?.*)?$/i;

// Fetch strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // APK downloads should always hit the network so stale builds never get served from cache.
  if (/\.apk$/i.test(new URL(request.url).pathname)) {
    event.respondWith(fetch(request));
    return;
  }

  // Navigations: NetworkFirst (fall back to cached index.html when offline)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the latest index.html
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // JS/CSS code bundles: NetworkFirst so code updates always propagate
  if (CODE_BUNDLE_PATTERN.test(request.url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets (images, fonts, etc.): CacheFirst for performance
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Only cache successful same-origin responses
        if (response.ok && request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
