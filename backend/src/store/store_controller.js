import express from 'express';
import { StoreRepository } from './store_repository.js';
import { StoreService } from './store_service.js';
import rateLimit from 'express-rate-limit';
import { authenticateAdminSession } from '../shared/middleware/auth.js';

import { sseManager } from '../shared/sse.js';

const storeRouter = express.Router();
const storeRepository = new StoreRepository();
const storeService = new StoreService(storeRepository);

// Export Service และ Repository เผื่อระบบอื่นเรียกใช้ข้าม Domain (เช่น สั่งอาหารต้องเช็คร้านเปิดไหม)
export { storeService, storeRepository };

// GET /api/store/events - SSE สตรีมสถานะร้านค้าและข้อความประกาศแบบเรียลไทม์
storeRouter.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Store SSE connection established' })}\n\n`);
  sseManager.addGeneralClient(res);
});

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

// PATCH /api/store/status - อัปเดตสถานะการเปิด/ปิดร้าน (Admin Only)
storeRouter.patch('/status', authenticateAdminSession, async (req, res, next) => {
  try {
    const data = await storeService.updateStatus(req.body);
    return res.json({ success: true, message: 'อัปเดตสถานะร้านเรียบร้อยแล้ว', data });
  } catch (error) {
    next(error);
  }
});

export { storeRouter };
