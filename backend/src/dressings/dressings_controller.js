import express from 'express';
import { DressingsRepository } from './dressings_repository.js';
import { DressingsService } from './dressings_service.js';
import rateLimit from 'express-rate-limit';

const dressingsRouter = express.Router();

const dressingsRepository = new DressingsRepository();
const dressingsService = new DressingsService(dressingsRepository);

const dressingsRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'คำขอมากเกินไป กรุณารอสักครู่' },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/dressings - Get all available salad dressings
dressingsRouter.get('/', dressingsRateLimiter, async (req, res, next) => {
  try {
    const data = await dressingsService.getDressings();
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export { dressingsRouter };
