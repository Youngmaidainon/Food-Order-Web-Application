import express from 'express';
import { MenuRepository } from './menu_repository.js';
import { MenuService } from './menu_service.js';

const menuRouter = express.Router();

// Dependency Injection
const menuRepository = new MenuRepository();
const menuService = new MenuService(menuRepository);

// GET /api/menu - Get all available menu items with category
menuRouter.get('/', async (req, res, next) => {
  try {
    const data = await menuService.getMenu();
    return res.json({ success: true, data });
  } catch (error) {
    next(error); // Pass to global error handler
  }
});

export { menuRouter };
