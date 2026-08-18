import express from 'express';
import rateLimit from 'express-rate-limit';

import authRouter from './auth_controller.js';
import ordersRouter from './orders_controller.js';
import menuRouter from './menu_controller.js';
import categoriesRouter from './categories_controller.js';
import dressingsRouter from './dressings_controller.js';
import analyticsRouter from './analytics_controller.js';
import { eventsRouter } from './events_controller.js';
import { storeRouter } from '../store/store_controller.js';

const adminRouter = express.Router();

// Rate Limiting (ป้องกัน Brute Force / DoS ระดับ Router ของฝั่งแอดมิน)
const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: { success: false, message: 'ผู้ดูแลระบบทำรายการบ่อยเกินไป กรุณารอสักครู่' },
  standardHeaders: true,
  legacyHeaders: false,
});

adminRouter.use('/', authRouter);
adminRouter.use(adminRateLimiter); // บังคับใช้ Rate Limiter กับทุก Route ของแอดมิน (ยกเว้น Login)
adminRouter.use('/orders', ordersRouter);
adminRouter.use('/menu', menuRouter);
adminRouter.use('/categories', categoriesRouter);
adminRouter.use('/dressings', dressingsRouter);
adminRouter.use('/store', storeRouter);
adminRouter.use('/analytics', analyticsRouter);
adminRouter.use('/events', eventsRouter);

export { adminRouter };
