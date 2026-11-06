const CACHE_NAME = 'proforientir-4';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/professions.json',
  '/universities.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(error => {
        console.warn('Failed to cache some resources:', error);
        return cache.addAll(urlsToCache.filter(url => !url.includes('fonts') && !url.includes('cdn')));
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Code/data that changes between deploys: always try the network first so
// users get fresh content, falling back to cache only when offline.
const NETWORK_FIRST_DESTINATIONS = ['document', 'script', 'style'];
const NETWORK_FIRST_PATHS = ['/professions.json', '/universities.json'];

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.origin !== location.origin) {
    return;
  }

  const isNetworkFirst = NETWORK_FIRST_DESTINATIONS.includes(request.destination) ||
    NETWORK_FIRST_PATHS.includes(url.pathname);

  if (isNetworkFirst) {
    event.respondWith(
      fetch(request).then(response => {
        if (response && response.status === 200 && response.type !== 'error') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
        }
        return response;
      }).catch(() => caches.match(request).then(cached => {
        if (cached) return cached;
        if (request.destination === 'document') return caches.match('/index.html');
        return new Response('Offline - resource not available', { status: 503 });
      }))
    );
    return;
  }

  // Static assets (images, fonts): cache-first for speed, network as fallback.
  event.respondWith(
    caches.match(request).then(response => {
      if (response) {
        return response;
      }

      return fetch(request).then(response => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch(() => {
        if (request.destination === 'image') {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#f0f0f0" width="100" height="100"/></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
        return new Response('Offline - resource not available', { status: 503 });
      });
    })
  );
});
