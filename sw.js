/* חם ככה — service worker
   מעטפת בלבד. קריאות ה-API אף פעם לא נשמרות במטמון,
   אחרת האפליקציה תראה טמפרטורה של אתמול. */
const CACHE = 'hamkacha-v1';
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
  if (url.origin !== location.origin) return;   // API ופונטים — תמיד מהרשת

  // ניווט: רשת קודם, מטמון כגיבוי במצב לא מקוון
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(caches.match(request).then(r => r || fetch(request)));
});
