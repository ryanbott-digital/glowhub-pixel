/**
 * GlowHub PWA Service Worker
 * Handles offline caching and navigation fallback for APK/PWA installability.
 */

const CACHE_NAME = "glowhub-pwa-v1";
const PRECACHE_URLS = ["/index.html", "/manifest.json"];

// Install: precache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean old caches, claim clients
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

// Fetch: NetworkFirst for navigations, CacheFirst for assets
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
