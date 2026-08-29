import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { executeQuery } from './config/database.js';

import { menuRouter } from './menu/menu_controller.js';
import { dressingsRouter } from './dressings/dressings_controller.js';
import { storeRouter } from './store/store_controller.js';
import { ordersRouter } from './orders/orders_controller.js';
import { adminRouter } from './admin/admin_controller.js';
import { cartRouter } from './cart/cart_controller.js';

import { requestContext } from './shared/middleware/requestContext.js';
import { globalErrorHandler } from './shared/middleware/errorHandler.js';
import { ForbiddenError } from './shared/errors.js';

const app = express();

app.set('trust proxy', 'loopback, linklocal, uniquelocal'); // Trust proxy headers (Docker/Nginx/Render)

// Helper: Ping database with timeout
async function checkDatabaseHealth(timeoutMs = 5000) {
  const startTime = Date.now();
  let timer;
  try {
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Database ping timeout')), timeoutMs);
    });
    await Promise.race([executeQuery('SELECT 1'), timeoutPromise]);
    return {
      status: 'connected',
      latency_ms: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'disconnected',
      error: error.message || 'Database unreachable'
    };
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================================
// Health Check & Keep-Alive Probes (Bypasses Heavy Middlewares / Auto HEAD)
// ============================================================================

// 1. Liveness & Keep-Alive Probe (Zero DB / Ultra Fast < 1ms)
app.all(['/api/health', '/health'], (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// 2. Readiness Probe (Deep Check: Database connection & latency)
app.all(['/api/health/ready', '/health/ready'], async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  const dbHealth = await checkDatabaseHealth(5000);
  const isHealthy = dbHealth.status === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ready' : 'unhealthy',
    database: dbHealth,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// 3. Root API info for Uptime Monitors & Browser inspection
app.all(['/', '/api'], (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.status(200).json({
    status: 'ok',
    service: 'springroll-backend',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// --- Middlewares & Security Layer ---
app.use(requestContext);
app.use(helmet());

// CORS config
const defaultAllowedOrigins = ['http://localhost', 'http://localhost:80', 'http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'];
const envOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim().replace(/\/+$/, '')) : [];
const allowedOrigins = [...defaultAllowedOrigins, ...envOrigins];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || process.env.NODE_ENV !== 'production' || process.env.ALLOW_DYNAMIC_CORS === 'true' || process.env.CORS_ORIGIN === '*') {
      return callback(null, true);
    }
    const cleanOrigin = origin.replace(/\/+$/, '');
    if (allowedOrigins.includes(cleanOrigin) || cleanOrigin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    callback(new ForbiddenError(`Not allowed by CORS: ${origin}`));
  },
  credentials: true
}));

app.use(express.json({ limit: '100kb' })); // Max 100KB payload limit
app.use(cookieParser());
app.set('etag', 'strong'); // Smart ETag cache (HTTP 304)

// Prevent cache for dynamic API routes
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// Rate limiters
const generalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: { success: false, message: 'คำขอมากเกินไป กรุณารอสักครู่ (Too many requests)' },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'พยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่ (Too many login attempts)' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalApiRateLimiter);
app.use('/api/admin/login', adminLoginRateLimiter);

// API Routes
app.use('/api/menu', menuRouter);
app.use('/api/dressings', dressingsRouter);
app.use('/api/store', storeRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/cart', cartRouter);
app.use('/api/admin', adminRouter);

app.use(globalErrorHandler);

export default app;
