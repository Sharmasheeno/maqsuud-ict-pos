self.addEventListener('install', (event) => {
  // POS data and application updates require a live connection. Do not pin an
  // older app shell or JavaScript bundle in an offline cache.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    })
      .then(() => self.registration.unregister())
  );
});

self.addEventListener('fetch', (event) => {
  // Leave API requests to the browser's normal network stack. Caching API
  // responses here can expose stale or account-specific data, and a failed
  // cache lookup must not resolve respondWith() with undefined.
  if (new URL(event.request.url).pathname.startsWith('/api/')) return;
  if (event.request.method !== 'GET') return;
  // Always check the host for the latest app shell first. This keeps installed
  // mobile PWAs from staying on an older cached customer/product interface.
  // Do not intercept app resources: stale cached bundles caused the installed
  // POS to keep showing old product/customer screens after deployment.
});
