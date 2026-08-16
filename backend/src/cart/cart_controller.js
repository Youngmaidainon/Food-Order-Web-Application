import express from 'express';
import { CartRepository } from './cart_repository.js';
import { CartService } from './cart_service.js';
import { ensureCartSessionMiddleware } from './cart_middleware.js';
import rateLimit from 'express-rate-limit';
import { validate } from '../shared/middleware/validate.js';
import { cartItemAddSchema, cartItemUpdateSchema } from '../shared/validators/index.js';

const cartRouter = express.Router();
const cartRepository = new CartRepository();
const cartService = new CartService(cartRepository);

export { cartService, cartRepository };

// Rate Limiter: ป้องกัน DoS บนตะกร้าสินค้า
const cartRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: { success: false, message: 'คุณทำรายการตะกร้าสินค้าบ่อยเกินไป กรุณารอสักครู่' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ใช้ Middleware จัดการ Session ของตะกร้าสินค้า (Guest Session) ก่อนเข้า Endpoint อื่นๆ
cartRouter.use(ensureCartSessionMiddleware);
cartRouter.use(cartRateLimiter);

// GET /api/cart - ดึงข้อมูลสินค้าในตะกร้าปัจจุบัน
cartRouter.get('/', async (req, res, next) => {
  try {
    const data = await cartService.getCartItems(req.cartSessionId);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// POST /api/cart/add - เพิ่มสินค้าลงตะกร้า (มีการ Validate Input ป้องกัน Injection)
cartRouter.post('/add', validate(cartItemAddSchema), async (req, res, next) => {
  try {
    await cartService.addItem(req.cartSessionId, req.body);
    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// PUT /api/cart/update/:id - Update item quantity
cartRouter.put('/update/:id', validate(cartItemUpdateSchema), async (req, res, next) => {
  try {
    await cartService.updateItemQuantity(req.cartSessionId, req.params.id, req.body.quantity);
    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart/remove/:id - Remove item
cartRouter.delete('/remove/:id', async (req, res, next) => {
  try {
    await cartService.removeItem(req.cartSessionId, req.params.id);
    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart/clear - Clear cart
cartRouter.delete('/clear', async (req, res, next) => {
  try {
    await cartService.clearCart(req.cartSessionId);
    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export { cartRouter };
