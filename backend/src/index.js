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

app.set('trust proxy', 'loopback, linklocal, uniquelocal'); // Trust internal proxies (Docker/Nginx/Render)

app.use(requestContext);

// ติดตั้ง Security Headers ด้วย Helmet ป้องกัน XSS, Clickjacking, MIME Sniffing
app.use(helmet());
// ตั้งค่า CORS (Cross-Origin Resource Sharing) แบบ Whitelist (Security First)
app.use(cors({
  origin: (origin, callback) => {
    // Always allow all origins in development (for Cloudflare tunnels, etc.)
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (!origin) return callback(null, true); // Allow same-origin or curl requests
    
    // อนุญาตทุก Origin หากเปิดใช้งาน ALLOW_DYNAMIC_CORS (เฉพาะการจำลอง Production บน Docker)
    if (process.env.ALLOW_DYNAMIC_CORS === 'true') {
      return callback(null, true);
    }

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
// จำกัดขนาด Request Body (Payload Size Limit) ป้องกัน DoS จาก Payload ขนาดใหญ่
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// เปิด ETag สำหรับ Smart Cache (HTTP 304 Not Modified) เพื่อประหยัด Bandwidth ขณะ Polling
app.set('etag', 'strong');

// ตั้งค่า Cache Headers สำหรับ Dynamic API: ป้องกัน Browser/Proxy Cache แต่อนุญาต Conditional Requests (ETag/If-None-Match)
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// Global Rate Limiter: ป้องกัน DoS ระดับ API ทั้งระบบ
const generalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: { success: false, message: 'คำขอมากเกินไป กรุณารอสักครู่ (Too many requests)' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate Limiter พิเศษสำหรับ Login (จำกัด 5 ครั้งต่อ 15 นาที เพื่อป้องกัน Brute-Force Password)
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
