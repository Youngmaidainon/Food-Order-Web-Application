import { executeQuery } from '../shared/database/database.js';

export class CartRepository {
  async ensureSessionExists(cartSessionId) {
    const sessionQueryResult = await executeQuery('SELECT session_id FROM cart_sessions WHERE session_id = $1', [cartSessionId]);
    return sessionQueryResult.rows.length > 0;
  }

  async createSession(cartSessionId) {
    await executeQuery('INSERT INTO cart_sessions (session_id) VALUES ($1)', [cartSessionId]);
  }

  async fetchCartItems(cartSessionId) {
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
    const cartQueryResult = await executeQuery(fetchCartItemsSql, [cartSessionId]);
    return cartQueryResult.rows;
  }

  async getExistingItem(cartSessionId, menuItemId, activeDressingId, itemNotes) {
    const checkExistingItemSql = `
      SELECT id, quantity FROM cart_items 
      WHERE session_id = $1 AND menu_item_id = $2 
      ${activeDressingId ? 'AND dressing_id = $3' : 'AND dressing_id IS NULL'}
      AND item_notes = $${activeDressingId ? 4 : 3}
    `;
    const checkParams = activeDressingId ? [cartSessionId, menuItemId, activeDressingId, itemNotes] : [cartSessionId, menuItemId, itemNotes];
    const checkResult = await executeQuery(checkExistingItemSql, checkParams);
    return checkResult.rows.length > 0 ? checkResult.rows[0] : null;
  }

  async updateItemQuantity(cartItemId, newQuantity, itemNotes) {
    if (itemNotes !== undefined) {
       await executeQuery('UPDATE cart_items SET quantity = $1, item_notes = $2 WHERE id = $3', [newQuantity, itemNotes, cartItemId]);
    } else {
       await executeQuery('UPDATE cart_items SET quantity = $1 WHERE id = $2', [newQuantity, cartItemId]);
    }
  }

  async updateItemQuantityWithSession(cartItemId, newQuantity, cartSessionId) {
    await executeQuery('UPDATE cart_items SET quantity = $1 WHERE id = $2 AND session_id = $3', [newQuantity, cartItemId, cartSessionId]);
  }

  async addItem(cartSessionId, menuItemId, activeDressingId, quantity, itemNotes) {
    await executeQuery(
      `INSERT INTO cart_items (session_id, menu_item_id, dressing_id, quantity, item_notes) 
       VALUES ($1, $2, $3, $4, $5)`,
      [cartSessionId, menuItemId, activeDressingId, quantity, itemNotes]
    );
  }

  async removeItem(cartItemId, cartSessionId) {
    await executeQuery('DELETE FROM cart_items WHERE id = $1 AND session_id = $2', [cartItemId, cartSessionId]);
  }

  async clearCart(cartSessionId) {
    await executeQuery('DELETE FROM cart_items WHERE session_id = $1', [cartSessionId]);
  }
}
