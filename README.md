---
title: Maqsuud ICT POS
emoji: 🛒
colorFrom: green
colorTo: gray
sdk: static
app_file: dist/index.html
---

# Maqsuud ICT POS

Retail point of sale and shop management app with a React frontend, Express API, and TiDB Cloud storage.

## Deployment overview

The React frontend runs as a free Hugging Face Static Space. The Express API runs as a Render Node web service. The frontend sends requests to the API using the public `API_BASE_URL` variable configured in the Hugging Face Space.

### Hugging Face frontend

Create a **Static** Space and use this repository. Set the Space variable `API_BASE_URL` to the Render API origin, for example `https://maqsuud-ict-pos-api.onrender.com` (without a trailing slash). This URL is public configuration, not a secret. Static Spaces can build React apps with `app_build_command` and `app_file` metadata.

### Render backend

Use the included `render.yaml` Blueprint, select the **Free** web service plan in Render, and set these environment secrets when prompted. Do not commit real credentials to this repository.

- `TIDB_URL`: the full connection URL copied from TiDB Cloud's **Connect → Node.js** panel. TLS certificate validation is enforced.
- `JWT_SECRET`: a unique random value with at least 32 characters.
- `BOOTSTRAP_ADMIN_EMAIL`: email address for the initial administrator.
- `BOOTSTRAP_ADMIN_PASSWORD`: a unique password with at least 14 characters.
- `BOOTSTRAP_ADMIN_NAME`: optional display name for the initial administrator.
- `CORS_ORIGINS`: additional exact browser origins allowed to call the API. The deployed Hugging Face Static Space origin is allowed by default: `https://sharmake-maqsuud-ict-pos.static.hf.space`.
- `NODE_ENV`: set to `production`.

You may use `TIDB_HOST`, `TIDB_PORT`, `TIDB_USER`, `TIDB_PASSWORD`, and `TIDB_DATABASE` instead of `TIDB_URL`.

On the first launch with an empty TiDB store, the API creates its table and seeds initial shop settings plus the administrator above. Sample customers, suppliers, products, and sales are not seeded in production. The backend requires a working TiDB connection and will not silently use temporary container storage.

Render Free web services sleep after 15 minutes without traffic and take about a minute to wake. Their filesystem is temporary, and Render documents Free services for testing or hobby projects rather than production applications. Outbound bandwidth has a monthly allowance; if a payment method is attached, overage can be billed. Review Render's [free plan limits](https://render.com/docs/free) before using it for live shop operations.

## Local development

```bash
npm ci
npm run dev
```

Copy `.env.example` to `.env` and configure TiDB credentials if you want to use the cloud database locally. Without them, development uses a local JSON file in `.data/`.
