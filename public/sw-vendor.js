/**
 * DuraGrit Vitrified - Dedicated Vendor Partner Mobile PWA Service Worker (v2.5)
 * Scope: /app/
 * Strictly serves the Vendor Partner Mobile App and offline shell.
 * NEVER falls back to Admin ERP (/index.html).
 */

const VENDOR_CACHE_NAME = 'duragrit-vendor-portal-v4.8.9-live';
const VENDOR_STATIC_ASSETS = [
  '/manifest-vendor.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/logo-white.png',
  '/logo.png'
];

// Install Event - Pre-cache vendor shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VENDOR_CACHE_NAME).then((cache) => {
      console.log('[Vendor SW] Pre-caching vendor static assets');
      return cache.addAll(VENDOR_STATIC_ASSETS).catch((err) => {
        console.warn('[Vendor SW] Some assets skipped during pre-cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up stale vendor cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key.startsWith('duragrit-vendor-') && key !== VENDOR_CACHE_NAME) {
            console.log('[Vendor SW] Removing stale vendor cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network-first with Vendor shell fallback
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

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic' &&
          event.request.mode !== 'navigate' &&
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

        // Return offline VENDOR shell for navigation requests
        if (event.request.mode === 'navigate') {
          const vendorShell = await caches.match('/app/index.html');
          if (vendorShell) return vendorShell;
          return caches.match('/app/');
        }

        return new Response('Offline and asset not cached', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      })
  );
});

