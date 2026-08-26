import express from 'express';
import { OrdersRepository } from './orders_repository.js';
import { OrdersService } from './orders_service.js';
import rateLimit from 'express-rate-limit';
import { validate } from '../shared/middleware/validate.js';
import { createOrderSchema, cancelOrderSchema } from '../shared/validators/index.js';


const ordersRouter = express.Router();


const ordersRepository = new OrdersRepository();
const ordersService = new OrdersService(ordersRepository);



// Rate limiters for orders
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

// POST /api/orders - Create new order
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
    error.statusCode = error.statusCode || 400;
    next(error);
  }
});

// GET /api/orders/track/:order_number - Track order by order number
ordersRouter.get('/track/:order_number', trackOrderRateLimiter, async (req, res, next) => {
  try {
    const isAdmin = !!req.user;
    const data = await ordersService.trackOrder(req.params.order_number.trim(), req.cookies?.springroll_cart_session, isAdmin);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/orders/:id/status - Cancel order by customer
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
