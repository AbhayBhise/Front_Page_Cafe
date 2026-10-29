import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import crypto from 'crypto';
import { env } from './config/env';
import { globalLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/error';
import { prisma } from './lib/prisma';

import authRoutes from './modules/auth/auth.routes';
import cafeRoutes from './modules/cafes/cafes.routes';
import menuRoutes from './modules/menu/menu.routes';
import orderRoutes from './modules/orders/orders.routes';
import adminRoutes from './modules/admin/admin.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import qrRoutes from './modules/qr/qr.routes';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  // Request correlation ID tracking for enterprise observability
  app.use((req, res, next) => {
    const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
    res.setHeader('X-Request-Id', requestId);
    next();
  });

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (env.clientOrigins.includes(origin)) return cb(null, origin);
        if (!env.isProd && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return cb(null, origin);
        }
        return cb(new Error('Not allowed by CORS'));
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'x-cafe-id', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  if (!env.isProd) app.use(morgan('dev'));
  app.use(globalLimiter);

  // -------------------------------------------------------------
  // SRE Health Probes (Kubernetes / ECS / Cloud Run standard)
  // -------------------------------------------------------------
  
  // Fast Liveness Probe
  app.get('/api/health/live', (_req, res) => {
    res.status(200).json({ live: true, timestamp: Date.now() });
  });

  // Deep Readiness Probe (validates database availability)
  app.get('/api/health/ready', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ ready: true, db: 'connected', timestamp: Date.now() });
    } catch (err) {
      res.status(503).json({
        ready: false,
        db: 'disconnected',
        error: err instanceof Error ? err.message : String(err),
        timestamp: Date.now(),
      });
    }
  });

  // Comprehensive System Health Info
  app.get('/api/health', async (_req, res) => {
    let db = 'ok';
    let latencyMs = 0;
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      latencyMs = Date.now() - start;
    } catch {
      db = 'unavailable';
    }

    const mem = process.memoryUsage();
    res.json({
      status: db === 'ok' ? 'ok' : 'degraded',
      db,
      dbLatencyMs: latencyMs,
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      },
      env: env.nodeEnv,
      time: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/qr', qrRoutes);
  app.use('/api/cafes', cafeRoutes);
  app.use('/api/menu', menuRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/notifications', notificationRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
