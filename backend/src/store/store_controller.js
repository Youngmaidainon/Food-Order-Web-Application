import express from 'express';
import { StoreRepository } from './store_repository.js';
import { StoreService } from './store_service.js';
import rateLimit from 'express-rate-limit';

const storeRouter = express.Router();
const storeRepository = new StoreRepository();
const storeService = new StoreService(storeRepository);

// Export Service และ Repository เผื่อระบบอื่นเรียกใช้ข้าม Domain (เช่น สั่งอาหารต้องเช็คร้านเปิดไหม)
export { storeService, storeRepository };

// Rate Limiter: ป้องกัน DoS บน Endpoint สถานะร้าน
const storeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'คำขอสถานะร้านมากเกินไป กรุณารอสักครู่' },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/store/status - ดึงสถานะเปิด/ปิดร้าน
storeRouter.get('/status', storeRateLimiter, async (req, res, next) => {
  try {
    const data = await storeService.getStatus();
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export { storeRouter };
