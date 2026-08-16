import express from 'express';
import { MenuRepository } from './menu_repository.js';
import { MenuService } from './menu_service.js';
import rateLimit from 'express-rate-limit';

const menuRouter = express.Router();

// ใช้งาน Dependency Injection: สอดไส้ Repository เข้าไปใน Service (ง่ายต่อการ Test)
const menuRepository = new MenuRepository();
const menuService = new MenuService(menuRepository);

// Rate Limiter: ป้องกัน DoS บน Endpoint ดูเมนู
const menuRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'คุณเรียกดูเมนูบ่อยเกินไป กรุณารอสักครู่' },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/menu - ดึงข้อมูลเมนูและหมวดหมู่ทั้งหมด
menuRouter.get('/', menuRateLimiter, async (req, res, next) => {
  try {
    const data = await menuService.getMenu();
    return res.json({ success: true, data });
  } catch (error) {
    next(error); // Pass to global error handler
  }
});

export { menuRouter };
