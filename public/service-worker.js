// ============================================================
// Service Worker — makes ALMS installable and gives it a basic offline
// fallback. This app is server-rendered and mostly dynamic (task lists,
// dashboards, etc. change every request), so pages are fetched fresh from
// the network every time — caching is limited to static assets (CSS, icons)
// plus a single offline fallback page for when there's no connection at all.
//
// Static assets are network-first, not cache-first: this app changes CSS/JS
// often, and a cache-first strategy meant anyone who'd already loaded the
// app once would keep seeing the old stylesheet forever, no matter how many
// times the site got redeployed, since nothing ever told the cache it was
// stale. Network-first means every visit gets whatever's actually live when
// online; the cache only kicks in as a fallback if the network fails.
// ============================================================
const CACHE_NAME = 'alms-static-v2';
const STATIC_ASSETS = [
  '/css/style.css',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // never intercept POSTs (forms, actions)

  const url = new URL(req.url);

  // Static assets: network-first, so a redeploy shows up on the very next
  // load instead of being silently masked by a stale cache. The cache is
  // only a fallback for when there's genuinely no connection.
  if (STATIC_ASSETS.some((path) => url.pathname === path)) {
    event.respondWith(
      fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Everything else (dynamic pages, API calls): network-first, offline
  // fallback page only for full page navigations when there's no connection.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/offline.html'))
    );
  }
});

// --- Real OS-level push notifications (reminders/alarms) ---
self.addEventListener('push', (event) => {
  let data = { title: 'ALMS', body: 'You have a notification.', url: '/dashboard' };
  try { if (event.data) data = Object.assign(data, event.data.json()); } catch (e) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/dashboard' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
