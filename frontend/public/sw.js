// ─── DukaFlow Service Worker ──────────────────────────────────────────────────
// Caches static assets on install, serves cache-first for speed,
// network-first for API requests, and shows offline fallback when disconnected.

const CACHE_NAME = 'dukaflow-v1';
const RUNTIME_CACHE = 'dukaflow-runtime-v1';

// ─── Static assets to pre-cache on install ────────────────────────────────────
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/favicon.svg',
  '/manifest.json',
  '/site.webmanifest',
  // Fonts (Inter + JetBrains Mono) are loaded from Google Fonts CDN,
  // so they'll be cached at runtime.
];

// ─── Install: pre-cache core assets ───────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching core assets');
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        // Don't fail if some assets are missing (e.g. screenshots)
        console.warn('[SW] Some pre-cache assets unavailable:', err.message);
      });
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate: clean old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ─── Fetch: cache-first for static, network-first for API ─────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Don't intercept non-GET requests or chrome-extension requests
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // ── API requests: network-first with offline fallback ────────────────────────
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // ── Static assets (JS, CSS, fonts, images, icons): cache-first ──────────────
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(js|css|woff2?|png|svg|ico|webp)$/)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── Navigation requests: network-first with offline fallback ─────────────────
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // ── Everything else: network-first ───────────────────────────────────────────
  event.respondWith(networkFirst(request));
});

// ─── Strategies ───────────────────────────────────────────────────────────────

/** Cache-first: return from cache if available, otherwise fetch + cache. */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // If fetch fails and nothing cached, return an empty response for assets
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

/** Network-first: try network, fall back to cache on failure. */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error('Network unavailable');
  }
}

/** Network-first for navigations, falling back to offline page. */
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Show the offline fallback page
    const offlinePage = await caches.match('/offline.html');
    return offlinePage || new Response(
      '<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Inter,sans-serif;background:#EEF2FF"><h1 style="color:#312E81">You\'re offline 📡</h1></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// ─── Update notification ──────────────────────────────────────────────────────
// When a new SW is waiting, tell all clients so they can show an update banner.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
