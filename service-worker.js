
const CACHE_NAME = 'bogus-boys-2027-v1';

const APP_FILES = [
  './',
  './index.html',
  './css/home-2027.css',
  './images/bogus-boys-icon-192.png',
  './images/bogus-boys-icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('bogus-boys-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never cache Supabase or other external services.
  if (url.origin !== self.location.origin) return;

  // Only serve the app's icon files from cache.
  // All league pages and data remain network-first.
  if (url.pathname.includes('/images/bogus-boys-icon-')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request);
      })
    );
  }
});
