// Service Worker for Aurora App PWA
const CACHE_NAME = 'aurora-app-v1';
const RUNTIME_CACHE = 'aurora-runtime-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/feed',
  '/routes',
  '/opportunities',
  '/assistant',
  '/map',
  '/offline',
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return caches.open(RUNTIME_CACHE).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline');
            }
            // Return a basic response for other requests
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
            });
          });
      });
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-routes') {
    event.waitUntil(syncOfflineRoutes());
  }
});

async function syncOfflineRoutes() {
  // Get offline routes from IndexedDB and sync to server
  // This will be implemented when offline route tracking is added
  console.log('Syncing offline routes...');
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'Aurora App';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: data.url || '/',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
