/* hamkacha — service worker
   Shell only. API calls are never cached, otherwise the app would show
   yesterday's temperature. */
/* The number in the cache name is the only invalidation mechanism: shell
   files are served cache-first, so a change to the icons or the manifest
   never reaches a returning visitor unless the version here is bumped.
   activate deletes every cache under a different name, so the bump
   cleans up after itself. */
const CACHE = 'hamkacha-v2';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;   // APIs and fonts — always from the network

  // Navigation: network first, cache as the offline fallback
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(r => {
          /* The cache write is a promise that starts after the response has
             already been returned, so it needs waitUntil — without it the
             browser may shut the service worker down mid-write and leave a
             half-written cache. And only ok responses: a 404 or 500 stored
             here becomes the permanent offline page. */
          if (r.ok) { const cp = r.clone(); e.waitUntil(caches.open(CACHE).then(c => c.put('./index.html', cp))); }
          return r;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./'))
          .then(r => r || new Response('<!doctype html><meta charset=utf-8><p dir=rtl>אין חיבור, ואין עותק שמור.',
            { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } })))
    );
    return;
  }

  e.respondWith(caches.match(request).then(r => r || fetch(request)));
});
