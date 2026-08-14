import express from 'express';

import authRouter from './admin/auth.js';
import ordersRouter from './admin/orders.js';
import menuRouter from './admin/menu.js';
import categoriesRouter from './admin/categories.js';
import dressingsRouter from './admin/dressings.js';
import storeRouter from './admin/store.js';
import analyticsRouter from './admin/analytics.js';

const adminRouter = express.Router();

adminRouter.use('/', authRouter);
adminRouter.use('/orders', ordersRouter);
adminRouter.use('/menu', menuRouter);
adminRouter.use('/categories', categoriesRouter);
adminRouter.use('/dressings', dressingsRouter);
adminRouter.use('/store', storeRouter);
adminRouter.use('/analytics', analyticsRouter);

export default adminRouter;
