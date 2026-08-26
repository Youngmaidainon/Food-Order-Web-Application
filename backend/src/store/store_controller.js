import express from 'express';
import { StoreRepository } from './store_repository.js';
import { StoreService } from './store_service.js';
import rateLimit from 'express-rate-limit';
import { authenticateAdminSession } from '../shared/middleware/auth.js';



const storeRouter = express.Router();
const storeRepository = new StoreRepository();
const storeService = new StoreService(storeRepository);

export { storeService, storeRepository };

// Store status rate limiter
const storeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'คำขอสถานะร้านมากเกินไป กรุณารอสักครู่' },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/store/status - Get store open/closed status
storeRouter.get('/status', storeRateLimiter, async (req, res, next) => {
  try {
    const data = await storeService.getStatus();
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/store/status - Update store status (Admin only)
storeRouter.patch('/status', authenticateAdminSession, async (req, res, next) => {
  try {
    const data = await storeService.updateStatus(req.body);
    return res.json({ success: true, message: 'อัปเดตสถานะร้านเรียบร้อยแล้ว', data });
  } catch (error) {
    next(error);
  }
});

export { storeRouter };
