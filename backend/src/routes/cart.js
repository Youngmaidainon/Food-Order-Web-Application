import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '../config/database.js';

const cartRouter = express.Router();

// Middleware to ensure a shopping cart session exists for the user
const ensureCartSessionMiddleware = async (request, response, nextFunction) => {
  let cartSessionId = request.cookies.springroll_cart_session;

  try {
    if (!cartSessionId) {
      cartSessionId = uuidv4();
      await executeQuery('INSERT INTO cart_sessions (session_id) VALUES ($1)', [cartSessionId]);
      response.cookie('springroll_cart_session', cartSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' && process.env.HTTPS_ENABLED === 'true',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });
    } else {
      const sessionQueryResult = await executeQuery('SELECT session_id FROM cart_sessions WHERE session_id = $1', [cartSessionId]);
      if (sessionQueryResult.rows.length === 0) {
        cartSessionId = uuidv4();
        await executeQuery('INSERT INTO cart_sessions (session_id) VALUES ($1)', [cartSessionId]);
        response.cookie('springroll_cart_session', cartSessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production' && process.env.HTTPS_ENABLED === 'true',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000 // 1 day
        });
      }
      // Removed UPDATE last_accessed_at query to optimize database load

    }
    request.cartSessionId = cartSessionId;
    nextFunction();
  } catch (cartSessionError) {
    console.error('Shopping cart session middleware error:', cartSessionError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
};

cartRouter.use(ensureCartSessionMiddleware);

// GET /api/cart - Fetch current items in shopping cart
cartRouter.get('/', async (request, response) => {
  try {
    const fetchCartItemsSql = `
      SELECT 
        cartItem.id as cart_item_id,
        cartItem.menu_item_id,
        menuItem.name as name,
        menuItem.price,
        menuItem.image_url,
        cartItem.quantity,
        cartItem.dressing_id,
        COALESCE(dressing.name, 'ไม่รับน้ำสลัด') as dressing_name,
        cartItem.item_notes
      FROM cart_items cartItem
      JOIN menu_items menuItem ON cartItem.menu_item_id = menuItem.id
      LEFT JOIN dressings dressing ON cartItem.dressing_id = dressing.id
      WHERE cartItem.session_id = $1
      ORDER BY cartItem.created_at ASC
    `;
    const cartQueryResult = await executeQuery(fetchCartItemsSql, [request.cartSessionId]);
    return response.json({ success: true, data: cartQueryResult.rows });
  } catch (cartFetchError) {
    console.error('Error fetching cart items:', cartFetchError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// POST /api/cart/add - Add item to cart
cartRouter.post('/add', async (request, response) => {
  const { menu_item_id: menuItemId, dressing_id: dressingId, quantity = 1, item_notes: itemNotes = '' } = request.body;

  if (!menuItemId) {
    return response.status(400).json({ success: false, message: 'ไม่พบรหัสสินค้า' });
  }
  if (quantity < 1 || quantity > 99) {
    return response.status(400).json({ success: false, message: 'จำนวนสินค้าไม่ถูกต้อง' });
  }
  if (itemNotes && itemNotes.length > 200) {
    return response.status(400).json({ success: false, message: 'หมายเหตุยาวเกินไป (สูงสุด 200 ตัวอักษร)' });
  }

  try {
    const activeDressingId = dressingId || null;

    const checkExistingItemSql = `
      SELECT id, quantity FROM cart_items 
      WHERE session_id = $1 AND menu_item_id = $2 
      ${activeDressingId ? 'AND dressing_id = $3' : 'AND dressing_id IS NULL'}
      AND item_notes = $${activeDressingId ? 4 : 3}
    `;
    const checkParams = activeDressingId ? [request.cartSessionId, menuItemId, activeDressingId, itemNotes] : [request.cartSessionId, menuItemId, itemNotes];
    const checkResult = await executeQuery(checkExistingItemSql, checkParams);

    if (checkResult.rows.length > 0) {
      const existingCartItemRecord = checkResult.rows[0];
      const updatedQuantity = existingCartItemRecord.quantity + quantity;
      await executeQuery('UPDATE cart_items SET quantity = $1, item_notes = $2 WHERE id = $3', [updatedQuantity, itemNotes, existingCartItemRecord.id]);
    } else {
      await executeQuery(
        `INSERT INTO cart_items (session_id, menu_item_id, dressing_id, quantity, item_notes) 
         VALUES ($1, $2, $3, $4, $5)`,
        [request.cartSessionId, menuItemId, activeDressingId, quantity, itemNotes]
      );
    }
    
    return response.json({ success: true });
  } catch (addToCartError) {
    console.error('Error adding item to cart:', addToCartError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// PUT /api/cart/update/:id - Update item quantity
cartRouter.put('/update/:id', async (request, response) => {
  const { quantity: newQuantity } = request.body;
  const { id: cartItemId } = request.params;

  if (newQuantity !== undefined && (newQuantity < 0 || newQuantity > 99)) {
    return response.status(400).json({ success: false, message: 'จำนวนสินค้าไม่ถูกต้อง' });
  }

  try {
    if (newQuantity <= 0) {
      await executeQuery('DELETE FROM cart_items WHERE id = $1 AND session_id = $2', [cartItemId, request.cartSessionId]);
    } else {
      await executeQuery('UPDATE cart_items SET quantity = $1 WHERE id = $2 AND session_id = $3', [newQuantity, cartItemId, request.cartSessionId]);
    }
    return response.json({ success: true });
  } catch (updateCartError) {
    console.error('Error updating cart item:', updateCartError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// DELETE /api/cart/remove/:id - Remove item
cartRouter.delete('/remove/:id', async (request, response) => {
  try {
    await executeQuery('DELETE FROM cart_items WHERE id = $1 AND session_id = $2', [request.params.id, request.cartSessionId]);
    return response.json({ success: true });
  } catch (removeFromCartError) {
    console.error('Error removing item from cart:', removeFromCartError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// DELETE /api/cart/clear - Clear cart
cartRouter.delete('/clear', async (request, response) => {
  try {
    await executeQuery('DELETE FROM cart_items WHERE session_id = $1', [request.cartSessionId]);
    return response.json({ success: true });
  } catch (clearCartError) {
    console.error('Error clearing cart:', clearCartError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

export default cartRouter;
