import express from 'express';
import { StoreRepository } from './store_repository.js';
import { StoreService } from './store_service.js';
import rateLimit from 'express-rate-limit';

const storeRouter = express.Router();
const storeRepository = new StoreRepository();
const storeService = new StoreService(storeRepository);

// Export instances to be used by other features (e.g. orders)
export { storeService, storeRepository };

const storeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'คำขอสถานะร้านมากเกินไป กรุณารอสักครู่' },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/store/status - Fetch store status
storeRouter.get('/status', storeRateLimiter, async (req, res, next) => {
  try {
    const data = await storeService.getStatus();
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export { storeRouter };
