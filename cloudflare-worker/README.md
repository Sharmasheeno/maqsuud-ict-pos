# Cloudflare API proxy

This Worker provides a same-API-path proxy from the public Hugging Face frontend to the existing Render API. It does not connect to TiDB or store credentials; login requests and authenticated API requests are forwarded to Render without logging their bodies.

## Deploy

1. In Cloudflare, create a Worker named `maqsuud-ict-pos-api-proxy`.
2. Paste `src/index.js` into the Worker editor and deploy it with the free `workers.dev` route enabled.
3. Verify `https://<worker-name>.<your-account-subdomain>.workers.dev/api/health` from the target network.
4. Only after that URL works, update the Hugging Face Space variable `API_BASE_URL` to the Worker origin (omit `/api/health` and any trailing slash).

The Worker accepts browser requests only from `https://sharmake-maqsuud-ict-pos.static.hf.space` and forwards `/api/*` to the fixed Render origin. It is a routing workaround, not a guaranteed cure if Cloudflare's domain is also unreachable from the user's network.
