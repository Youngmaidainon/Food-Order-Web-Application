import express from 'express';
import { MenuRepository } from './menu_repository.js';
import { MenuService } from './menu_service.js';
import rateLimit from 'express-rate-limit';

const menuRouter = express.Router();

// Dependency Injection
const menuRepository = new MenuRepository();
const menuService = new MenuService(menuRepository);

const menuRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'คุณเรียกดูเมนูบ่อยเกินไป กรุณารอสักครู่' },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/menu - Get all available menu items with category
menuRouter.get('/', menuRateLimiter, async (req, res, next) => {
  try {
    const data = await menuService.getMenu();
    return res.json({ success: true, data });
  } catch (error) {
    next(error); // Pass to global error handler
  }
});

export { menuRouter };
