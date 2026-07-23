// DostOS Service Worker - Offline Support & SPA Routing
const CACHE_NAME = 'dostos-v2';
const STATIC_CACHE = 'dostos-static-v2';
const DYNAMIC_CACHE = 'dostos-dynamic-v2';

const BASE_PATH = self.location.pathname.replace('/sw.js', '') || '/dostos-app-new';
const BASE_URL = self.location.origin + BASE_PATH;

const STATIC_ASSETS = [
  BASE_URL + '/',
  BASE_URL + '/index.html',
  BASE_URL + '/manifest.json',
  BASE_URL + '/favicon.ico',
  BASE_URL + '/favicon-16x16.png',
  BASE_URL + '/favicon-32x32.png',
  BASE_URL + '/apple-touch-icon.png',
  BASE_URL + '/icon-72x72.png',
  BASE_URL + '/icon-96x96.png',
  BASE_URL + '/icon-128x128.png',
  BASE_URL + '/icon-144x144.png',
  BASE_URL + '/icon-192x192.png',
  BASE_URL + '/icon-512x512.png',
  BASE_URL + '/icon-192x192-maskable.png',
  BASE_URL + '/icon-512x512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch((err) => console.log('[SW] Cache addAll failed:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isStaticAsset(url) {
  return ['.js','.css','.png','.jpg','.jpeg','.gif','.svg','.ico','.woff','.woff2','.ttf','.eot','.json','.mp3','.mp4']
    .some(ext => url.pathname.endsWith(ext));
}

function isExternalRequest(url) {
  return !url.href.startsWith(BASE_URL);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (isExternalRequest(url)) return;

  // SPA routing: all navigation requests -> index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(BASE_URL + '/index.html')
            .then((cached) => cached || caches.match(BASE_URL + '/')
              .then((fallback) => fallback || new Response('Offline', { status: 503 })))
        )
    );
    return;
  }

  // Static assets: cache first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              const clone = networkResponse.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Default: network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
