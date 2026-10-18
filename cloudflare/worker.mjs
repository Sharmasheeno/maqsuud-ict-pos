const API_ORIGIN = 'https://maqsuud-ict-pos-api.onrender.com';
const FRONTEND_ORIGIN = 'https://sharmake-maqsuud-ict-pos.static.hf.space';
const WORKER_ORIGIN = 'https://maqsuud-ict-pos-api-proxy.sharmacadenuur2017.workers.dev';

const ALLOWED_ORIGINS = new Set([FRONTEND_ORIGIN, WORKER_ORIGIN]);

function corsHeaders(origin) {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  });

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  return headers;
}

async function proxyApi(request, url) {
  const origin = request.headers.get('Origin');
  if (request.method === 'OPTIONS') {
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return new Response('Origin not allowed', { status: 403 });
    }
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const upstreamUrl = new URL(`${url.pathname}${url.search}`, API_ORIGIN);
  const upstreamHeaders = new Headers(request.headers);

  // Render currently allows the Hugging Face frontend origin. The Worker is
  // the browser-facing origin after migration, so use the allowed origin for
  // the upstream hop and return CORS headers for the actual browser origin.
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    upstreamHeaders.set('Origin', FRONTEND_ORIGIN);
  }

  const upstreamInit = {
    method: request.method,
    headers: upstreamHeaders,
    redirect: 'follow',
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    upstreamInit.body = request.body;
  }
  const response = await fetch(new Request(upstreamUrl, upstreamInit));
  const headers = new Headers(response.headers);

  // Do not let a cached API response expose stale or account-specific data.
  headers.set('Cache-Control', 'no-store');
  headers.delete('Content-Encoding');
  headers.delete('Content-Length');
  headers.delete('Access-Control-Allow-Origin');
  headers.delete('Access-Control-Allow-Credentials');
  const allowed = corsHeaders(origin);
  for (const [name, value] of allowed) headers.set(name, value);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function proxyFrontend(request, url) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Not found', { status: 404 });
  }

  // Retire the old browser-side PWA cache at the Worker origin. The POS is
  // online-only for API access, so a stale offline shell is worse than no
  // service worker and can keep old product/customer screens installed.
  if (url.pathname === '/sw.js') {
    return new Response(`
      self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
      self.addEventListener('activate', event => event.waitUntil(
        caches.keys()
          .then(keys => Promise.all(keys.map(key => caches.delete(key))))
          .then(() => self.registration.unregister())
      ));
    `, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
        'Service-Worker-Allowed': '/',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  const upstreamUrl = new URL(`${url.pathname}${url.search}`, FRONTEND_ORIGIN);
  const isAppShell = url.pathname === '/' || url.pathname === '/index.html';
  if (isAppShell) {
    // Hugging Face's static CDN can retain the app shell at its unversioned
    // path. Give each shell fetch a unique upstream cache key so the default
    // Worker URL always picks up the latest published build and service worker.
    upstreamUrl.searchParams.set('_refresh', Date.now().toString());
  }
  const response = await fetch(new Request(upstreamUrl, { method: request.method, redirect: 'follow' }));
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  if (isAppShell) {
    headers.set('Cache-Control', 'no-store, max-age=0');
  }
  headers.delete('Content-Encoding');
  headers.delete('Content-Length');

  if (isAppShell && response.ok && request.method !== 'HEAD') {
    let html = await response.text();
    // Remove the upstream registration for its legacy service worker, then
    // clean up any previously installed worker and Cache Storage on this host.
    html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (script, attributes, body) => {
      return body.includes("navigator.serviceWorker.register('/sw.js')") ? '' : script;
    });
    html = html.replace('</body>', `<script>
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations()
          .then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
          .catch(() => {});
      }
      if ('caches' in window) caches.keys().then(keys => keys.forEach(key => caches.delete(key))).catch(() => {});
    </script></body>`);
    return new Response(html, { status: response.status, statusText: response.statusText, headers });
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      return proxyApi(request, url);
    }
    return proxyFrontend(request, url);
  },
};
