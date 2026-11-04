/* Velaivaaipu service worker.
 * Deliberately small and safe:
 *  - never touches /api, auth, payment or any cross-origin request (they go straight to the network)
 *  - never caches HTML pages, so a new deploy is always picked up
 *  - caches only hashed build files and static icons/images, plus one offline page
 *  - a new version waits until the person taps "Refresh" (the page sends SKIP_WAITING)
 *  - web push: shows the notification the server sent and opens its link on tap (nothing is fetched)
 */
const VERSION = 'v2';
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

// ---- Web push -------------------------------------------------------------------------------------
// The server sends a small JSON payload: { title, body, link, tag, type }. Nothing else is fetched here,
// so a push never reads personal data from the network on its own.
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: 'Velaivaaipu', body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'Velaivaaipu';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'vv-general',
    renotify: false,
    data: { link: data.link || '/', type: data.type || 'general' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/';
  const target = new URL(link, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const open = clients.find((c) => c.url.startsWith(self.location.origin));
      if (open) {
        return open.focus().then((c) => ('navigate' in c ? c.navigate(target) : undefined));
      }
      return self.clients.openWindow(target);
    })
  );
});

// If the push service rotates the subscription, tell the server about the new one (keeps the device subscribed).
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription ? event.oldSubscription.options : { userVisibleOnly: true })
      .then((sub) => self.clients.matchAll({ type: 'window' }).then((clients) => clients.forEach((c) => c.postMessage({ type: 'PUSH_RESUBSCRIBED', subscription: sub.toJSON() }))))
      .catch(() => {})
  );
});
