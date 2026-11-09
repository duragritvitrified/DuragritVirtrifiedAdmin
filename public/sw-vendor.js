/**
 * DuraGrit Vitrified - Dedicated Vendor Partner Mobile PWA Service Worker (v4.8.5)
 * Scope: /app/
 * Strictly serves the Vendor Partner Mobile App and offline shell.
 * NEVER falls back to Admin ERP (/index.html).
 */

const VENDOR_CACHE_NAME = 'duragrit-vendor-portal-v4.8.8-fresh';
const VENDOR_STATIC_ASSETS = [
  '/manifest-vendor.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/logo-white.png',
  '/logo.png'
];

// Install Event - Pre-cache vendor static assets and skip waiting immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VENDOR_CACHE_NAME).then((cache) => {
      console.log('[Vendor SW v4.8.5] Pre-caching vendor static assets');
      return cache.addAll(VENDOR_STATIC_ASSETS).catch((err) => {
        console.warn('[Vendor SW] Some assets skipped during pre-cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up ANY stale cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== VENDOR_CACHE_NAME) {
            console.log('[Vendor SW] Purging stale vendor cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Message Listener for explicit skip waiting / reload from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Event - Network-first with fresh navigation guarantee
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass chrome-extension, APK downloads, and Supabase realtime websockets
  if (
    url.protocol.startsWith('chrome-extension') ||
    url.pathname.includes('/realtime/v1/') ||
    url.pathname.includes('/apk/') ||
    url.pathname.endsWith('.apk')
  ) {
    return;
  }

  // Pure network-first for navigation (HTML) requests — never serve stale HTML online
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(async () => {
          const vendorShell = await caches.match('/app/index.html');
          if (vendorShell) return vendorShell;
          return new Response('Offline and asset not cached', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic' &&
          !url.pathname.endsWith('.html') &&
          !url.pathname.endsWith('/app/') &&
          url.pathname !== '/app'
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(VENDOR_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        return new Response('Offline and asset not cached', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      })
  );
});
