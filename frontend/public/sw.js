// Service Worker for MWS IntegraLearn PWA
const CACHE_NAME = 'mws-integralearn-v1.0.0';
const STATIC_CACHE = 'mws-static-v1.0.0';
const DYNAMIC_CACHE = 'mws-dynamic-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/vite.svg',
    '/Millennia.webp',
    '/index.html',
    '/src/main.jsx',
    '/src/index.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip external requests (fonts, APIs, etc.)
    if (!url.origin.includes(self.location.origin)) return;

    // Let backend auth routes pass through to the server (OAuth, login, etc.)
    // /auth/callback is a React SPA route handled by nginx separately
    if (url.pathname.startsWith('/auth/') && !url.pathname.startsWith('/auth/callback')) return;

    // Let socket.io requests pass through
    if (url.pathname.startsWith('/socket.io/')) return;

    // Handle API requests with network-first strategy
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful API responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Return cached API response if available
                    return caches.match(request);
                })
        );
        return;
    }

    // Handle static assets and pages with cache-first strategy
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response.ok) return response;

                        const responseClone = response.clone();

                        // Cache the response
                        caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });

                        return response;
                    })
                    .catch(() => {
                        // Return offline fallback for navigation requests
                        if (request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync triggered:', event.tag);

    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// Push notifications
self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);

    const options = {
        body: event.data ? event.data.text() : 'New notification from MWS IntegraLearn',
        icon: '/Millennia.webp',
        badge: '/vite.svg',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Explore',
                icon: '/vite.svg'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/vite.svg'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('MWS IntegraLearn', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification click:', event);

    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Background sync function
async function doBackgroundSync() {
    try {
        // Implement background sync logic here
        console.log('[SW] Performing background sync');
        // This could sync offline actions like form submissions, etc.
    } catch (error) {
        console.error('[SW] Background sync failed:', error);
    }
}

// Periodic cache cleanup
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAN_CACHE') {
        cleanOldCaches();
    }
});

async function cleanOldCaches() {
    const cacheNames = await caches.keys();
    const validCaches = [STATIC_CACHE, DYNAMIC_CACHE];

    for (const cacheName of cacheNames) {
        if (!validCaches.includes(cacheName)) {
            await caches.delete(cacheName);
        }
    }
}