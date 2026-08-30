// ============================================================
// Service Worker — makes ALMS installable and gives it a basic offline
// fallback. This app is server-rendered and mostly dynamic (task lists,
// dashboards, etc. change every request), so pages are fetched fresh from
// the network every time — caching is limited to static assets (CSS, icons)
// plus a single offline fallback page for when there's no connection at all.
// ============================================================
const CACHE_NAME = 'alms-static-v1';
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

  // Static assets: cache-first for speed, network as a fallback/refresh.
  if (STATIC_ASSETS.some((path) => url.pathname === path)) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return res;
      }))
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
