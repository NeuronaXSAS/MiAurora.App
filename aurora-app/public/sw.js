// Aurora Service Worker v3.0.0 - Fixed chunk loading and cache issues
const CACHE_VERSION = 'v3';
const CACHE_NAME = `aurora-cache-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';

// Critical assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon.png',
  '/favicon.ico',
];

// Paths that should NEVER be cached (dynamic chunks, etc.)
const NEVER_CACHE_PATHS = [
  '/_next/static/chunks/',
  '/_next/static/webpack/',
  '/_next/static/development/',
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

// Activate event - clean up old caches aggressively
self.addEventListener('activate', (event) => {
  console.log('[Aurora SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            // Delete any cache that is NOT the current cache
            // This includes old aurora caches AND any other stale caches
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[Aurora SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[Aurora SW] Activation complete');
        // Force all clients to use the new service worker immediately
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients that SW has been updated
        return self.clients.matchAll({ type: 'window' }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
          });
        });
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

  // CRITICAL: Never cache dynamic chunks - they change with each build
  // This prevents stale chunk errors (404s, MIME type issues)
  if (NEVER_CACHE_PATHS.some(path => url.pathname.includes(path))) {
    event.respondWith(networkOnlyWithFallback(request));
    return;
  }

  // API routes - network first, fall back to cache
  if (API_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets (non-chunk) - cache first, but validate
  if (isStaticAsset(url.pathname) && !isChunkFile(url.pathname)) {
    event.respondWith(cacheFirstWithValidation(request));
    return;
  }

  // HTML pages - network first to always get fresh content
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstForPages(request));
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

// Check if URL is a dynamic chunk file (should not be cached)
function isChunkFile(pathname) {
  // Next.js chunk patterns - these change with each build
  return pathname.includes('/_next/static/chunks/') ||
         pathname.includes('/_next/static/webpack/') ||
         pathname.includes('/_next/static/development/') ||
         // Hashed chunk files (e.g., bd7ab94bf4546879.js)
         /\/[a-f0-9]{16,}\.js$/.test(pathname);
}

// Network only with graceful fallback - for dynamic chunks
async function networkOnlyWithFallback(request) {
  try {
    const response = await fetch(request);
    
    // If we get a 404 or non-OK response, don't cache it
    if (!response.ok) {
      console.warn('[Aurora SW] Chunk load failed:', request.url, response.status);
      // Return the error response so the app can handle it
      return response;
    }
    
    // Verify it's actually JavaScript (not a 404 page served as text/html)
    const contentType = response.headers.get('content-type') || '';
    if (request.url.endsWith('.js') && !contentType.includes('javascript')) {
      console.warn('[Aurora SW] Invalid content type for JS:', contentType);
      // Return a proper error so the app knows to reload
      return new Response('Chunk load failed - please refresh', { 
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    return response;
  } catch (error) {
    console.error('[Aurora SW] Network error for chunk:', error);
    // Return error response - app should handle reload
    return new Response('Network error - please check connection', { 
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Cache first with validation - for stable static assets
async function cacheFirstWithValidation(request) {
  const cached = await caches.match(request);
  
  if (cached) {
    // Validate cached response is still valid
    const contentType = cached.headers.get('content-type') || '';
    const isJS = request.url.endsWith('.js');
    
    // If it's a JS file but content-type is wrong, fetch fresh
    if (isJS && !contentType.includes('javascript')) {
      console.warn('[Aurora SW] Invalid cached JS, fetching fresh');
      return fetchAndCache(request);
    }
    
    return cached;
  }
  
  return fetchAndCache(request);
}

// Fetch and cache helper
async function fetchAndCache(request) {
  try {
    const response = await fetch(request);
    
    // Only cache successful responses with correct content type
    if (response.ok && response.status !== 206) {
      const contentType = response.headers.get('content-type') || '';
      const isJS = request.url.endsWith('.js');
      
      // Don't cache if content type doesn't match
      if (isJS && !contentType.includes('javascript')) {
        console.warn('[Aurora SW] Not caching invalid JS response');
        return response;
      }
      
      const cache = await caches.open(CACHE_NAME);
      try {
        cache.put(request, response.clone());
      } catch (cacheError) {
        console.debug('[Aurora SW] Cache put failed:', cacheError);
      }
    }
    
    return response;
  } catch (error) {
    console.debug('[Aurora SW] Fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network first for HTML pages - always try to get fresh content
async function networkFirstForPages(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      try {
        cache.put(request, response.clone());
      } catch (cacheError) {
        console.debug('[Aurora SW] Cache put failed:', cacheError);
      }
    }
    
    return response;
  } catch (error) {
    // Offline - try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Return offline page
    return caches.match(OFFLINE_URL);
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[Aurora SW] Push received');
  
  let data = {
    title: 'Aurora App',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
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

  // Customize notification based on type
  const notificationType = data.data?.type || 'system';
  let options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag || notificationType,
    data: data.data,
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    silent: data.silent || false,
  };

  // Safety-critical notifications get special treatment
  if (['safety_alert', 'emergency', 'safety_checkin'].includes(notificationType)) {
    options.requireInteraction = true;
    options.vibrate = [500, 200, 500, 200, 500];
    options.actions = [
      { action: 'view', title: 'View Details' },
      { action: 'safe', title: "I'm Safe" },
    ];
  }

  // Gift notifications
  if (notificationType === 'gift_received') {
    options.vibrate = [100, 50, 100, 50, 100];
  }

  // Achievement notifications
  if (notificationType === 'achievement') {
    options.vibrate = [100, 50, 100, 50, 100, 50, 100];
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Aurora SW] Notification clicked:', event.action);
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  const notificationType = notificationData.type || 'system';
  let urlToOpen = notificationData.url || '/feed';

  // Handle specific actions
  if (event.action === 'safe') {
    // User confirmed they're safe - could trigger API call
    urlToOpen = '/emergency?action=confirm-safe';
  } else if (event.action === 'help') {
    urlToOpen = '/emergency?action=need-help';
  } else if (event.action === 'reply') {
    urlToOpen = notificationData.url || '/messages';
  } else if (event.action === 'watch') {
    urlToOpen = notificationData.url || '/live';
  } else if (event.action === 'view') {
    urlToOpen = notificationData.url || '/feed';
  } else if (event.action === 'save') {
    // Save action - could trigger API call
    urlToOpen = notificationData.url || '/opportunities';
  } else if (event.action === 'dismiss') {
    // Just close, don't navigate
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open with Aurora App
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Navigate existing window
            client.navigate(urlToOpen);
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

// Notification close event (for analytics)
self.addEventListener('notificationclose', (event) => {
  const notificationData = event.notification.data || {};
  console.log('[Aurora SW] Notification closed:', notificationData.type);
  
  // Could send analytics event here
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
