/* ============================================================
   ZERO — service worker

   Makes Zero installable and usable offline: the app shell and
   its assets are cached, so once installed it launches without a
   network and keeps working if you go offline. Live data (markets,
   news, lookups) still needs the network when you ask for it —
   this caches the APP, not the world.

   Cache-first for our own files; network-only for everything else,
   so nothing third-party is ever silently stored here.
   ============================================================ */
const CACHE = 'zero-v1';
const SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/vault.js',
  './js/hud.js',
  './js/storage.js',
  './js/files.js',
  './js/abilities.js',
  './js/app.js',
  './manifest.webmanifest',
  './assets/backdrop.jpg',
  './assets/zero-mark.png',
  './assets/zero-crest.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Only our own origin/scope is cached. Everything else goes straight to
  // the network and is never stored — no third-party data lands here.
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      // Runtime-cache same-origin GETs we did not pre-list (e.g. new assets).
      if (e.request.method === 'GET' && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
