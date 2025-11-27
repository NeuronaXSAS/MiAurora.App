// Aurora Service Worker v2.0.0 - Updated to fix CORS issues
const CACHE_NAME = 'aurora-cache-v2';
const OFFLINE_URL = '/offline';

// Critical assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon.png',
  '/favicon.ico',
];

// API routes that should use network-first strategy
const API_ROUTES = [
  '/api/',
  '/_next/data/',
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  console.log('[Aurora SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Aurora SW] Precaching critical assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Aurora SW] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Aurora SW] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Aurora SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[Aurora SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[Aurora SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// Domains and paths to skip (let browser handle directly)
const SKIP_DOMAINS = [
  'workos.com',
  'api.workos.com',
  'convex.cloud',
  'convex.dev',
  'posthog.com',
  'i.posthog.com',
  'googlesyndication.com',
  'googleads.g.doubleclick.net',
  'mapbox.com',
  'events.mapbox.com',
  'api.mapbox.com',
];

const SKIP_PATHS = [
  '/api/auth/',
  '/_rsc',
];

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip external domains that should not be cached/intercepted
  if (SKIP_DOMAINS.some(domain => url.hostname.includes(domain))) {
    return;
  }

  // Skip auth and RSC paths - let browser handle directly
  if (SKIP_PATHS.some(path => url.pathname.startsWith(path))) {
    return;
  }

  // Skip requests with _rsc query param (React Server Components)
  if (url.searchParams.has('_rsc')) {
    return;
  }

  // API routes - network first, fall back to cache
  if (API_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets - cache first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML pages - stale while revalidate
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default - network first
  event.respondWith(networkFirst(request));
});

// Cache-first strategy
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    // Only cache successful, complete responses (not partial 206 responses)
    if (response.ok && response.status !== 206) {
      const cache = await caches.open(CACHE_NAME);
      try {
        cache.put(request, response.clone());
      } catch (cacheError) {
        console.debug('[Aurora SW] Cache put failed:', cacheError);
      }
    }
    return response;
  } catch (error) {
    console.debug('[Aurora SW] Cache-first fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    // Only cache successful, complete responses (not partial 206 responses)
    if (response.ok && response.status !== 206) {
      const cache = await caches.open(CACHE_NAME);
      // Clone before caching
      try {
        cache.put(request, response.clone());
      } catch (cacheError) {
        // Silently fail cache operations (e.g., for opaque responses)
        console.debug('[Aurora SW] Cache put failed:', cacheError);
      }
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((response) => {
      // Only cache successful, complete responses (not partial 206 responses)
      if (response.ok && response.status !== 206) {
        try {
          cache.put(request, response.clone());
        } catch (cacheError) {
          console.debug('[Aurora SW] Cache put failed:', cacheError);
        }
      }
      return response;
    })
    .catch(() => {
      // Return offline page if fetch fails and no cache
      if (!cached) {
        return caches.match(OFFLINE_URL);
      }
      return cached;
    });

  return cached || fetchPromise;
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', 
    '.ico', '.woff', '.woff2', '.ttf', '.eot', '.webp'
  ];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[Aurora SW] Push received');
  
  let data = {
    title: 'Aurora',
    body: 'You have a new notification',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: 'aurora-notification',
    data: {},
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Aurora SW] Notification clicked');
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Aurora SW] Background sync:', event.tag);
  
  if (event.tag === 'aurora-sync') {
    event.waitUntil(syncOfflineData());
  }
  
  if (event.tag === 'aurora-emergency-sync') {
    event.waitUntil(syncEmergencyData());
  }
});

// Sync offline data
async function syncOfflineData() {
  try {
    // Get pending actions from IndexedDB
    const db = await openDB();
    const pendingActions = await getAllPendingActions(db);
    
    for (const action of pendingActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body,
        });
        await deletePendingAction(db, action.id);
      } catch (error) {
        console.error('[Aurora SW] Failed to sync action:', error);
      }
    }
  } catch (error) {
    console.error('[Aurora SW] Sync failed:', error);
  }
}

// Sync emergency data (high priority)
async function syncEmergencyData() {
  try {
    const db = await openDB();
    const emergencyData = await getEmergencyData(db);
    
    if (emergencyData) {
      await fetch('/api/emergency/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emergencyData),
      });
      await clearEmergencyData(db);
    }
  } catch (error) {
    console.error('[Aurora SW] Emergency sync failed:', error);
  }
}

// IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('aurora-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-actions')) {
        db.createObjectStore('pending-actions', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('emergency-data')) {
        db.createObjectStore('emergency-data', { keyPath: 'id' });
      }
    };
  });
}

function getAllPendingActions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending-actions', 'readonly');
    const store = transaction.objectStore('pending-actions');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deletePendingAction(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending-actions', 'readwrite');
    const store = transaction.objectStore('pending-actions');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function getEmergencyData(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('emergency-data', 'readonly');
    const store = transaction.objectStore('emergency-data');
    const request = store.get('current');
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function clearEmergencyData(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('emergency-data', 'readwrite');
    const store = transaction.objectStore('emergency-data');
    const request = store.delete('current');
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

console.log('[Aurora SW] Service Worker loaded');
