const CACHE_NAME = 'taktiva-shell-v10';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/mascot.svg',
  '/icons/icon-180.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  ...Array.from({ length: 15 }, (_, i) => `/mascots/mascot-${String(i + 1).padStart(2, '0')}.svg`)
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(APP_SHELL.map(async path => {
      try {
        const response = await fetch(path, { cache: 'reload' });
        if (response.ok && response.type === 'basic') await cache.put(path, response);
      } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('taktiva-shell-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache authentication, account data, or any API response.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/')) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response && response.ok && response.type === 'basic') {
          await cache.put('/index.html', response.clone());
        }
        return response;
      } catch (_) {
        return (await cache.match('/index.html')) ||
               (await cache.match('/')) ||
               new Response('Taktiva offline shell belum tersedia. Buka aplikasi sekali saat online.', {
                 status: 503,
                 headers: { 'Content-Type': 'text/plain; charset=utf-8' }
               });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.ok && response.type === 'basic') await cache.put(request, response.clone());
      return response;
    } catch (_) {
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});
