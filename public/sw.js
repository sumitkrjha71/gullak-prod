// Gullak service worker — minimal & SAFE for investor demo.
// V4.1 fix: never cache HTML routes (caused "stuck on stale page" bug on Vercel).
// Strategy: cache-first ONLY for /assets/ + /icons/. All HTML always goes to network.
// Auto-clears any prior caches on activation so users get fresh content after updates.

const CACHE = 'gullak-static-v4-1';
const STATIC_ASSETS = [
  '/assets/gullak-pot.png',
  '/assets/chiraiya-v2.png',
  '/assets/coin.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(() => {
        // Don't fail install if some assets are missing.
      })
    )
  );
  // Activate this new SW immediately, displacing any older one.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Wipe ALL prior caches — fixes the "new device gets stale page" bug.
      caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
      self.clients.claim(),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never intercept cross-origin, API, _next, or HTML requests.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/_next/')) return;
  if (req.headers.get('accept')?.includes('text/html')) return; // ALWAYS network for pages
  if (req.mode === 'navigate') return;

  // Cache-first for static assets only.
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
          }
          return res;
        });
      })
    );
  }
});
