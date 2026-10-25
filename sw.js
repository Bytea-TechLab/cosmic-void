const CACHE_NAME = 'cosmic-void-v2.1.0';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './img/icon-192.png',
  './img/icon-512.png',
  './js/game.js',
  './js/player.js',
  './js/villain.js',
  './js/boss.js',
  './js/enemy.js',
  './js/collisions.js',
  './js/projectile.js',
  './js/effects.js',
  './js/drops.js',
  './js/pool.js',
  './js/world.js',
  './js/ui.js',
  './js/save.js',
  './js/pacing.js',
  './js/sanctuary.js',
  './js/controls.js',
  './js/events.js',
  './js/renderer.js',
  './js/quickrun.js',
  './js/blackout.js',
  './js/bossrush.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Usar individualmente para que a falha de um recurso opcional não quebre a instalação
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(err => console.warn('[SW] Cache warn for:', url, err)))
      );
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Purgando cache antigo:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Ignora requisições não-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cached => {
      if (cached) {
        // Stale-while-revalidate em segundo plano para recursos estáticos
        fetch(event.request).then(networkResp => {
          if (networkResp && networkResp.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResp));
          }
        }).catch(() => {/* Offline */});
        return cached;
      }
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        let responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(err => {
        // Fallback offline se for documento HTML
        if (event.request.destination === 'document' || event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        throw err;
      });
    })
  );
});
