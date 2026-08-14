import express from 'express';
import { CartRepository } from './cart_repository.js';
import { CartService } from './cart_service.js';
import { ensureCartSessionMiddleware } from './cart_middleware.js';

const cartRouter = express.Router();
const cartRepository = new CartRepository();
const cartService = new CartService(cartRepository);

export { cartService, cartRepository };

cartRouter.use(ensureCartSessionMiddleware);

// GET /api/cart - Fetch current items in shopping cart
cartRouter.get('/', async (req, res, next) => {
  try {
    const data = await cartService.getCartItems(req.cartSessionId);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// POST /api/cart/add - Add item to cart
cartRouter.post('/add', async (req, res, next) => {
  try {
    await cartService.addItem(req.cartSessionId, req.body);
    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// PUT /api/cart/update/:id - Update item quantity
cartRouter.put('/update/:id', async (req, res, next) => {
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
