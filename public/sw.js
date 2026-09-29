/* X-Chat service worker: offline shell + one notification per chat. */
const CACHE = 'xchat-v4';
const ASSETS = [
  '/icons/xchat-512.png',
  '/icons/xchat-192.png',
  '/favicon.png',
  '/manifest.webmanifest',
  '/splash.json',
  '/lottie.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.allSettled(ASSETS.map((u) => c.add(u)))).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isStatic = /^\/(icons\/|favicon|manifest|splash\.json|lottie\.min\.js)/.test(url.pathname);
  if (isStatic) {
    // Cache-first so the logo always appears, even fully offline.
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => hit))
    );
    return;
  }

  if (req.mode === 'navigate' || url.pathname === '/app.html') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then((hit) => hit || caches.match('/')))
    );
  }
});

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = {}; }
  const title = d.title || 'X-Chat';
  const tag = d.tag || ('chat-' + (d.chatId || 'general'));
  e.waitUntil((async () => {
    const open = await self.registration.getNotifications({ tag });
    open.forEach((n) => n.close());
    await self.registration.showNotification(title, {
      body: d.body || 'New message',
      tag,
      renotify: true,
      icon: '/icons/xchat-192.png',
      badge: '/icons/xchat-192.png',
      data: { url: d.url || '/', chatId: d.chatId || '' }
    });
  })());
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of list) {
      if (new URL(c.url).origin === self.location.origin) {
        await c.focus();
        try { c.postMessage({ type: 'open-chat', chatId: e.notification.data && e.notification.data.chatId }); } catch (_) {}
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});
