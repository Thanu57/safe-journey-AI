/* SafeJourney AI service worker.
   - App shell: network first, falls back to the cached copy when offline.
   - Static assets: stale-while-revalidate.
   - Map tiles you have already viewed: cached (capped) so that area still shows offline.
   The API is NOT cached here: the app saves its own copy of the data with a visible timestamp. */
const SHELL = 'sj-shell-v1';
const TILES = 'sj-tiles-v1';
const TILE_LIMIT = 250;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(['/', '/manifest.json', '/icons/icon.svg'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => ![SHELL, TILES].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    e.respondWith(
      caches.open(TILES).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          cache.put(req, res.clone());
          trim(TILES, TILE_LIMIT);
          return res;
        } catch (err) {
          return new Response('', { status: 504 });
        }
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(SHELL).then((c) => c.put('/', copy));
        return res;
      }).catch(() => caches.match('/'))
    );
    return;
  }

  e.respondWith(
    caches.open(SHELL).then(async (cache) => {
      const hit = await cache.match(req);
      const network = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || network;
    })
  );
});
