const API_ORIGIN = 'https://maqsuud-ict-pos-api.onrender.com';
const FRONTEND_ORIGIN = 'https://sharmake-maqsuud-ict-pos.static.hf.space';

const ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
const ALLOWED_HEADERS = 'Authorization, Content-Type';

function corsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

export default {
  async fetch(request) {
    const requestUrl = new URL(request.url);
    const origin = request.headers.get('Origin');

    if (origin && origin !== FRONTEND_ORIGIN) {
      return new Response('Origin not allowed', { status: 403 });
    }

    if (!requestUrl.pathname.startsWith('/api/')) {
      return new Response('Not found', { status: 404 });
    }

    if (request.method === 'OPTIONS') {
      if (origin !== FRONTEND_ORIGIN) {
        return new Response('Origin not allowed', { status: 403 });
      }
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    if (!origin && !(request.method === 'GET' && requestUrl.pathname === '/api/health')) {
      return new Response('Origin not allowed', { status: 403 });
    }

    const upstreamUrl = new URL(requestUrl.pathname + requestUrl.search, API_ORIGIN);
    const upstreamRequest = new Request(upstreamUrl, request);

    try {
      const upstreamResponse = await fetch(upstreamRequest);
      const headers = new Headers(upstreamResponse.headers);
      for (const [key, value] of Object.entries(corsHeaders(origin))) {
        headers.set(key, value);
      }

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers,
      });
    } catch {
      return new Response(JSON.stringify({
        success: false,
        message: 'The POS API is temporarily unreachable. Please retry shortly.',
      }), {
        status: 502,
        headers: {
          ...corsHeaders(origin),
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    }
  },
};
