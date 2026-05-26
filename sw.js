/* Konuşuyorum PWA - Service Worker */
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `konusuyorum-${CACHE_VERSION}`;

// Çekirdek dosyalar - offline çalışma için önbelleğe alınır
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-64.png',
  // Google Fonts (uygulama bunları kullanıyor)
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Baloo+2:wght@600;700;800&display=swap'
];

// Yükleme: Çekirdek dosyaları önbelleğe al
self.addEventListener('install', (event) => {
  console.log('[SW] Yükleniyor...', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Dosyaları teker teker eklemeyi dene (biri başarısız olsa diğerleri devam etsin)
      return Promise.allSettled(
        CORE_ASSETS.map(url =>
          cache.add(url).catch(err => {
            console.warn('[SW] Önbelleğe alınamadı:', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Aktivasyon: Eski önbellekleri temizle
self.addEventListener('activate', (event) => {
  console.log('[SW] Aktif:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('konusuyorum-') && key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Eski önbellek siliniyor:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch stratejisi:
// - HTML/Navigation: Network-first, başarısız olursa cache
// - Diğer (statik): Cache-first, başarısız olursa network
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Sadece GET istekleri
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Chrome extension, vb. atla
  if (!url.protocol.startsWith('http')) return;

  // Navigation isteği (HTML) → Network-first
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Başarılı yanıtı önbelleğe kopyala
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match('./index.html'))
        )
    );
    return;
  }

  // Diğer istekler → Cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        // Arka planda güncelle (stale-while-revalidate)
        fetch(req).then((res) => {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
        }).catch(() => {});
        return cached;
      }

      return fetch(req).then((res) => {
        // Sadece başarılı, opaque olmayan yanıtları önbelleğe al
        if (!res || res.status !== 200 || res.type === 'error') {
          return res;
        }
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      }).catch(() => {
        // Tam offline ve önbellekte yok
        return new Response('Offline - içerik bulunamadı', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});

// Güncelleme tetiklemek için mesaj dinleyici
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
