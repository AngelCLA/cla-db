/**
 * CLA-DB: minimal app-shell service worker for the integration app.
 *
 * It caches only the app shell of this test application. It never caches
 * `/api/` traffic, so replication always talks to the network and offline
 * reads come from IndexedDB. The database package does not ship a service
 * worker and must not depend on one.
 */
const CACHE_NAME = 'cla-db-app-shell-v1';
const APP_SHELL = ['./', './index.html'];

self.addEventListener('install', event => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') {
        return;
    }
    const url = new URL(request.url);
    if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
        return;
    }

    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) {
            return cached;
        }
        try {
            const response = await fetch(request);
            if (response.ok && response.type === 'basic') {
                cache.put(request, response.clone());
            }
            return response;
        } catch (error) {
            if (request.mode === 'navigate') {
                const shell = await cache.match('./index.html');
                if (shell) {
                    return shell;
                }
            }
            throw error;
        }
    })());
});
