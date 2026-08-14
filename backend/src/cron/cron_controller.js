import express from 'express';
import { CronRepository } from './cron_repository.js';
import { CronService } from './cron_service.js';

const cronRouter = express.Router();
const cronRepository = new CronRepository();
const cronService = new CronService(cronRepository);

cronRouter.all('/maintenance', async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const providedToken = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : (authHeader || req.query.secret);

  try {
    const data = await cronService.runMaintenance(providedToken);
    res.status(200).json({
      success: true,
      message: 'การบำรุงรักษาระบบเสร็จสมบูรณ์',
      data
    });
  } catch (error) {
    // If it's not an operational error, map it or just pass to global
    if (!error.isOperational) {
      console.error('[CRON] Maintenance task failed:', error);
      return res.status(500).json({
        success: false,
        message: 'การบำรุงรักษาระบบล้มเหลว',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    next(error);
  }
});

export { cronRouter };
