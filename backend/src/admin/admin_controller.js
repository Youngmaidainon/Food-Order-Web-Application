import express from 'express';
import rateLimit from 'express-rate-limit';

import authRouter from '../routes/admin/auth.js';
import ordersRouter from '../routes/admin/orders.js';
import menuRouter from '../routes/admin/menu.js';
import categoriesRouter from '../routes/admin/categories.js';
import dressingsRouter from '../routes/admin/dressings.js';
import storeRouter from '../routes/admin/store.js';
import analyticsRouter from '../routes/admin/analytics.js';

const adminRouter = express.Router();

const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: { success: false, message: 'ผู้ดูแลระบบทำรายการบ่อยเกินไป กรุณารอสักครู่' },
  standardHeaders: true,
  legacyHeaders: false,
});

adminRouter.use('/', authRouter);
adminRouter.use(adminRateLimiter); // Apply to all subsequent admin routes
adminRouter.use('/orders', ordersRouter);
adminRouter.use('/menu', menuRouter);
adminRouter.use('/categories', categoriesRouter);
adminRouter.use('/dressings', dressingsRouter);
adminRouter.use('/store', storeRouter);
adminRouter.use('/analytics', analyticsRouter);

export { adminRouter };
