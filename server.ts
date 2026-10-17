import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './src/server/routes/api';
import { dbStore } from './src/server/db/store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = parseInt(process.env.PORT || (isProduction ? '7860' : '3000'), 10);

  if (isProduction) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.startsWith('replace-')) {
      throw new Error('Production requires a JWT_SECRET with at least 32 characters.');
    }
    if (
      !process.env.BOOTSTRAP_ADMIN_EMAIL ||
      process.env.BOOTSTRAP_ADMIN_EMAIL.endsWith('@example.com') ||
      !process.env.BOOTSTRAP_ADMIN_PASSWORD ||
      process.env.BOOTSTRAP_ADMIN_PASSWORD.length < 14 ||
      process.env.BOOTSTRAP_ADMIN_PASSWORD.startsWith('replace-')
    ) {
      throw new Error('Production requires BOOTSTRAP_ADMIN_EMAIL and a BOOTSTRAP_ADMIN_PASSWORD of at least 14 characters.');
    }
    if (!process.env.TIDB_URL && !(process.env.TIDB_HOST && process.env.TIDB_USER && process.env.TIDB_PASSWORD)) {
      throw new Error('Production requires TiDB Cloud connection secrets.');
    }
  }

  await dbStore.initFromCloud();
  if (isProduction && !dbStore.isCloudConnected()) {
    throw new Error('Could not connect to TiDB Cloud. Refusing to start without persistent cloud storage.');
  }

  // Parse body
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  const allowedOrigins = new Set(
    (process.env.CORS_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    }
    if (req.method === 'OPTIONS') {
      return origin && allowedOrigins.has(origin) ? res.sendStatus(204) : res.sendStatus(403);
    }
    next();
  });

  // Health check with TiDB Cloud vs Local Disk Fallback indicator
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Maqsuud ICT — Smart POS & Enterprise Management API',
      database: dbStore.getDatabaseStatus(),
      cloudConnected: dbStore.isCloudConnected(),
    });
  });

  // Mount API router after the public health endpoint.
  app.use('/api', apiRouter);

  if (!isProduction) {
    // Mount Vite dev server middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Maqsuud ICT — Smart POS & Enterprise Management running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
