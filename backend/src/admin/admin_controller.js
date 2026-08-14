import express from 'express';

import authRouter from '../routes/admin/auth.js';
import ordersRouter from '../routes/admin/orders.js';
import menuRouter from '../routes/admin/menu.js';
import categoriesRouter from '../routes/admin/categories.js';
import dressingsRouter from '../routes/admin/dressings.js';
import storeRouter from '../routes/admin/store.js';
import analyticsRouter from '../routes/admin/analytics.js';

const adminRouter = express.Router();

adminRouter.use('/', authRouter);
adminRouter.use('/orders', ordersRouter);
adminRouter.use('/menu', menuRouter);
adminRouter.use('/categories', categoriesRouter);
adminRouter.use('/dressings', dressingsRouter);
adminRouter.use('/store', storeRouter);
adminRouter.use('/analytics', analyticsRouter);

export { adminRouter };
