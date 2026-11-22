/* MatematicaOro — aggiornamento controllato e utilizzo offline. */
const VERSION = 'mo-20261122-github-4';
const ASSETS = ['./index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './lib/pdf.min.js', './lib/pdf.worker.min.js', './lib/pdf-lib.min.js'];

self.addEventListener('install', event => {
  // Installazione atomica: non attivare una nuova versione se manca un file.
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('mo-') && key !== VERSION).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(request).then(response => {
    if (response.ok && new URL(request.url).pathname !== '/__matematicaoro/status') {
      const copy = response.clone();
      event.waitUntil(caches.open(VERSION).then(cache => cache.put(request, copy)).catch(() => {}));
    }
    return response;
  }).catch(async () => {
    const match = await caches.match(request, {ignoreSearch: true});
    if (match) return match;
    if (request.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    return Response.error();
  }));
});
