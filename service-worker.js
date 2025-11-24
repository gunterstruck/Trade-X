// Service Worker für Trade-X PWA
const CACHE_VERSION = 'trade-x-v1.1.0';
const CACHE_NAME = `trade-x-cache-${CACHE_VERSION}`;

// Ressourcen, die beim Install gecacht werden sollen
const STATIC_RESOURCES = [
  '/Trade-X/',
  '/Trade-X/index.html',
  '/Trade-X/manifest.json',
  // CSS
  '/Trade-X/css/styles.css',
  // JavaScript Core
  '/Trade-X/js/config.js',
  '/Trade-X/js/utils.js',
  '/Trade-X/js/dom-cache.js',
  '/Trade-X/js/game-engine.js',
  // JavaScript Managers
  '/Trade-X/js/managers/sound-manager.js',
  '/Trade-X/js/managers/mode-manager.js',
  '/Trade-X/js/managers/state-manager.js',
  '/Trade-X/js/managers/view-manager.js',
  '/Trade-X/js/managers/board-manager.js',
  '/Trade-X/js/managers/ui-manager.js',
  // CDN Ressourcen
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.0/chart.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js',
  'https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-annotation/1.4.0/chartjs-plugin-annotation.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
];

// Install Event - Ressourcen in Cache speichern
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        // Sofort aktivieren ohne auf andere Tabs zu warten
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate Event - Alte Caches löschen
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Lösche alle alten Caches, die nicht dem aktuellen Cache-Namen entsprechen
              return cacheName.startsWith('trade-x-cache-') && cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        // Übernimmt sofort die Kontrolle über alle Clients
        return self.clients.claim();
      })
  );
});

// Fetch Event - Strategie: Cache First, fallback zu Network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Für CDN-Ressourcen und statische Dateien: Cache First
  if (
    url.origin === location.origin ||
    url.hostname === 'cdn.tailwindcss.com' ||
    url.hostname === 'cdnjs.cloudflare.com' ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[Service Worker] Serving from cache:', request.url);
            return cachedResponse;
          }

          // Wenn nicht im Cache, hole vom Netzwerk und cache es
          return fetch(request)
            .then((response) => {
              // Prüfe ob die Response gültig ist
              if (!response || response.status !== 200 || response.type === 'error') {
                return response;
              }

              // Clone die Response (kann nur einmal gelesen werden)
              const responseToCache = response.clone();

              caches.open(CACHE_NAME)
                .then((cache) => {
                  console.log('[Service Worker] Caching new resource:', request.url);
                  cache.put(request, responseToCache);
                });

              return response;
            })
            .catch((error) => {
              console.error('[Service Worker] Fetch failed:', error);

              // Fallback für HTML-Dateien: Zeige gecachte Hauptseite
              if (request.headers.get('accept').includes('text/html')) {
                return caches.match('/Trade-X/index.html');
              }

              throw error;
            });
        })
    );
  } else {
    // Für andere Ressourcen: Network First
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(request);
        })
    );
  }
});

// Message Event - Erlaubt Kommunikation mit der App
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        return self.clients.matchAll();
      }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'CACHE_CLEARED' });
        });
      })
    );
  }
});

// Sync Event - Background Sync für später
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-game-data') {
    event.waitUntil(
      // Hier könnte man später Spieldaten synchronisieren
      Promise.resolve()
    );
  }
});

// Push Event - Für Push Notifications (optional)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'Neue Updates verfügbar!',
    icon: '/Trade-X/icons/icon-192x192.png',
    badge: '/Trade-X/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Trade-X', options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/Trade-X/')
  );
});
