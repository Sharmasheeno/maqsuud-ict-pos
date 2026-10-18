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

  const upstreamUrl = new URL(`${url.pathname}${url.search}`, FRONTEND_ORIGIN);
  const response = await fetch(new Request(upstreamUrl, { method: request.method, redirect: 'follow' }));
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  if (url.pathname === '/' || url.pathname === '/index.html') {
    headers.set('Cache-Control', 'no-cache');
  }
  headers.delete('Content-Encoding');
  headers.delete('Content-Length');

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
