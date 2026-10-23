/* Velaivaaipu service worker.
 * Deliberately small and safe:
 *  - never touches /api, auth, payment or any cross-origin request (they go straight to the network)
 *  - never caches HTML pages, so a new deploy is always picked up
 *  - caches only hashed build files and static icons/images, plus one offline page
 *  - a new version waits until the person taps "Refresh" (the page sends SKIP_WAITING)
 */
const VERSION = 'v1';
const STATIC_CACHE = `vv-static-${VERSION}`;
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png', '/icons/icon-512.png', '/velaivaaipu-mark.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('vv-') && k !== STATIC_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

const isStaticAsset = (url) => url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/images/');

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth') || url.pathname === '/sw.js') return;
  if (req.headers.has('range')) return;

  // Pages: always the network; if it fails, show the offline page. HTML is never stored.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Build files and images: cache first (hashed file names never change), fill the cache on first use.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }))
    );
  }
  // Everything else is left to the browser.
});
