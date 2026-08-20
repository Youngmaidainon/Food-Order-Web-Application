import express from 'express';
import { OrdersRepository } from './orders_repository.js';
import { OrdersService } from './orders_service.js';
import rateLimit from 'express-rate-limit';
import { validate } from '../shared/middleware/validate.js';
import { createOrderSchema, cancelOrderSchema } from '../shared/validators/index.js';


const ordersRouter = express.Router();


const ordersRepository = new OrdersRepository();
const ordersService = new OrdersService(ordersRepository);



// Rate Limiter: ป้องกันสแปมและ DoS จำกัดโควต้าสร้างออเดอร์ 10 ครั้งต่อ 15 นาที
const createOrderRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'คุณทำรายการสั่งซื้อบ่อยเกินไป กรุณารอสักครู่ (Too many orders)' },
  standardHeaders: true,
  legacyHeaders: false,
});

const trackOrderRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'คุณตรวจสอบสถานะบ่อยเกินไป กรุณารอสักครู่' },
  standardHeaders: true,
  legacyHeaders: false,
});

const cancelOrderRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'คุณยกเลิกรายการบ่อยเกินไป กรุณารอสักครู่' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/orders - รับออเดอร์ใหม่ พร้อม Validate Input (ป้องกัน Payload Injection) และ Rate Limiting
ordersRouter.post('/', createOrderRateLimiter, validate(createOrderSchema), async (req, res, next) => {
  try {
    const data = await ordersService.createOrder(req.body, req.ip, req.cookies?.springroll_cart_session);
    return res.status(201).json({
      success: true,
      message: 'ส่งคำสั่งซื้อเรียบร้อยแล้ว',
      data
    });
  } catch (error) {
    if (error.statusCode) {
      return next(error);
    }
    // ส่ง Error กลับไปที่ Global Error Handler แทนการคืน Stack Trace (ป้องกัน Information Leak)
    error.statusCode = error.statusCode || 400; // Validation errors default to 400
    next(error);
  }
});

// GET /api/orders/track/:order_number - Track order status by order number
ordersRouter.get('/track/:order_number', trackOrderRateLimiter, async (req, res, next) => {
  try {
    const isAdmin = !!req.user; // Assuming req.user is set by auth middleware if admin is logged in
    const data = await ordersService.trackOrder(req.params.order_number.trim(), req.cookies?.springroll_cart_session, isAdmin);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/orders/:id/status - ยกเลิกออเดอร์โดยลูกค้า (ส่งต่อให้ Service จัดการ Logic)
ordersRouter.patch('/:id/status', cancelOrderRateLimiter, validate(cancelOrderSchema), async (req, res, next) => {
  try {
    const data = await ordersService.cancelOrderCustomer(req.params.id, req.body.status, req.body.cancel_reason, req.cookies?.springroll_cart_session);
    return res.json({ success: true, message: 'ยกเลิกออเดอร์เรียบร้อยแล้ว', data });
  } catch (error) {
    if (error.statusCode) {
      return next(error);
    }
    error.statusCode = error.statusCode || 400;
    next(error);
  }
});

export { ordersRouter };
