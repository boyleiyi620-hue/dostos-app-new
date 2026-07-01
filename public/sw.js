const CACHE_NAME = 'dostos-final-v1';
const BASE_URL = 'https://boyleiyi620-hue.github.io/dostos-app-new/';
const ASSETS = [
  BASE_URL,
  BASE_URL + 'index.html',
  BASE_URL + 'manifest.json',
  BASE_URL + 'icon-192x192.png',
  BASE_URL + 'icon-512x512.png',
  BASE_URL + 'icon-192x192-maskable.png',
  BASE_URL + 'icon-512x512-maskable.png',
  BASE_URL + 'apple-touch-icon.png',
  BASE_URL + 'favicon-32x32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // Sadece kendi domainimizdeki assetleri cache'ten döndür
  if (event.request.url.startsWith(BASE_URL)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request);
      })
    );
  }
});
