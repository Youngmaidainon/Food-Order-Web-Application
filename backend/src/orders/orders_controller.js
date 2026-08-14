import express from 'express';
import { OrdersRepository } from './orders_repository.js';
import { OrdersService } from './orders_service.js';

const ordersRouter = express.Router();
const ordersRepository = new OrdersRepository();
const ordersService = new OrdersService(ordersRepository);

export { ordersService, ordersRepository };

// POST /api/orders - Create new order
ordersRouter.post('/', async (req, res, next) => {
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
    // Convert generic error to AppError for client if needed, or pass it to handler
    error.statusCode = error.statusCode || 400; // Validation errors default to 400
    next(error);
  }
});

// GET /api/orders/track/:order_number - Track order status by order number
ordersRouter.get('/track/:order_number', async (req, res, next) => {
  try {
    const data = await ordersService.trackOrder(req.params.order_number.trim());
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/orders/:id/status - Cancel order by customer
ordersRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const data = await ordersService.cancelOrderCustomer(req.params.id, req.body.status, req.body.cancel_reason);
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
