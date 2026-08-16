import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { menuRouter } from './menu/menu_controller.js';
import { dressingsRouter } from './dressings/dressings_controller.js';
import { storeRouter } from './store/store_controller.js';
import { ordersRouter } from './orders/orders_controller.js';
import { adminRouter } from './admin/admin_controller.js';
import { cartRouter } from './cart/cart_controller.js';
import { cronRouter } from './cron/cron_controller.js';

import { requestContext } from './shared/middleware/requestContext.js';
import { globalErrorHandler } from './shared/middleware/errorHandler.js';
import { ForbiddenError } from './shared/errors.js';

const app = express();

app.set('trust proxy', 1); // Trust first proxy (Render)

app.use(requestContext);

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Always allow all origins in development (for Cloudflare tunnels, etc.)
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (!origin) return callback(new ForbiddenError('Not allowed by CORS (Missing Origin)'));
    
    let allowedOrigins = ['http://localhost', 'http://localhost:80', 'http://localhost:8080'];
    if (process.env.CORS_ORIGIN) {
      const origins = process.env.CORS_ORIGIN.split(',').map(o => o.trim());
      allowedOrigins = [...allowedOrigins, ...origins];
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new ForbiddenError('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https' && !req.secure) {
      return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
  });
}

const generalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
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

// Apply rate limiters
app.use('/api/', generalApiRateLimiter);
app.use('/api/admin/login', adminLoginRateLimiter);

const cronRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'มีการเรียกใช้ระบบอัตโนมัติมากเกินไป' },
  standardHeaders: true,
  legacyHeaders: false,
});

// API Route Endpoints
app.use('/api/menu', menuRouter);
app.use('/api/dressings', dressingsRouter);
app.use('/api/store', storeRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/cart', cartRouter);
app.use('/api/admin', adminRouter);
app.use('/internal/cron', cronRateLimiter, cronRouter);

// System Health Check Endpoint
app.get('/api/health', (request, response) => {
  response.json({ status: 'ok', time: new Date().toISOString() });
});

app.use(globalErrorHandler);

export default app;
