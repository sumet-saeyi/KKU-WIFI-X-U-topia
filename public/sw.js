const CACHE = 'u-ikigai-offline-v5';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(['/', '/mobile', '/desktop', '/manifest.webmanifest', '/icon.svg', '/contracts/UIkigaiVault.json'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('u-ikigai-offline-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'CACHE_ASSETS' || !Array.isArray(event.data.assets)) return;
  const assets = event.data.assets.filter((asset) => {
    try { const url = new URL(asset); return url.origin === self.location.origin && url.pathname.startsWith('/_next/static/'); } catch { return false; }
  });
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.allSettled(assets.map((asset) => cache.add(asset)))));
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/webpack-hmr')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE).then((cache) => cache.put(url.pathname, copy))); }
      return response;
    }).catch(async () => (await caches.match(url.pathname)) || (await caches.match('/')) || Response.error()));
    return;
  }
  if (url.pathname.startsWith('/_next/static/') || ['style', 'script', 'image', 'font', 'manifest'].includes(request.destination)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy))); }
      return response;
    })));
  }
});
