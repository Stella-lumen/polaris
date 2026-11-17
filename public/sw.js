// Polaris service worker — network-first for pages, cache-first for static assets.
const VERSION = "polaris-v1";
const STATIC_CACHE = `${VERSION}-static`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(["/icons/icon-192.png", "/icons/icon-512.png", "/stella-lumen.jpg"]),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API calls & server actions: network only (never serve stale data)
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/data")) return;

  // Static assets: content-hashed build chunks, icons, images — cache-first.
  // (/_next/static/ is immutable by content hash; dev HMR/devtools paths are skipped.)
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || /\.(png|jpg|svg|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Page navigations: network-first, fall back to cache when offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(`${VERSION}-pages`).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request).then((hit) => hit ?? caches.match("/dashboard"))),
    );
  }
});
