import { executeQuery } from '../config/database.js';

// Orders database operations
export class OrdersRepository {
  // Check active pending order by phone or session
  async getActiveOrderCountByPhoneOrSession(client, phone, sessionId) {
    let query;
    let params;
    if (sessionId) {
      query = `SELECT order_number FROM orders 
         WHERE (customer_phone = $1 OR session_id = $2) 
         AND status IN ('รอดำเนินการ', 'รับออเดอร์แล้ว', 'กำลังเตรียมอาหาร', 'พร้อมรับอาหาร', 'กำลังจัดส่ง') 
         AND deleted_at IS NULL LIMIT 1`;
      params = [phone, sessionId];
    } else {
      query = `SELECT order_number FROM orders 
         WHERE customer_phone = $1 
         AND status IN ('รอดำเนินการ', 'รับออเดอร์แล้ว', 'กำลังเตรียมอาหาร', 'พร้อมรับอาหาร', 'กำลังจัดส่ง') 
         AND deleted_at IS NULL LIMIT 1`;
      params = [phone];
    }
    const result = await client.query(query, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Fetch menu items by IDs
  async getMenuItemsByIds(client, ids) {
    const result = await client.query(
      'SELECT id, name, price, is_available FROM menu_items WHERE id = ANY($1::int[])',
      [ids]
    );
    return result.rows;
  }

  // Fetch dressings by IDs
  async getDressingsByIds(client, ids) {
    const result = await client.query(
      'SELECT id, name, is_available FROM dressings WHERE id = ANY($1::int[])',
      [ids]
    );
    return result.rows;
  }

  // Increment order queue sequence
  async getAndIncrementSequence(client) {
    const seqResult = await client.query('SELECT current_sequence FROM store_status WHERE id = 1 FOR UPDATE');
    const newSequence = (seqResult.rows[0].current_sequence || 0) + 1;
    await client.query('UPDATE store_status SET current_sequence = $1 WHERE id = 1', [newSequence]);
    return newSequence;
  }

  // Insert new order
  async createOrder(client, orderData) {
    const { orderNumber, sequence, customerName, customerPhone, deliveryType, address, totalAmount, ip, sessionId } = orderData;
    const result = await client.query(
      `INSERT INTO orders (order_number, sequence_number, customer_name, customer_phone, delivery_type, address, status, total_amount, ip_address, session_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'รอดำเนินการ', $7, $8, $9)
       RETURNING id, order_number, sequence_number, customer_name, customer_phone, delivery_type, address, status, FLOOR(total_amount)::INT as total_amount, created_at`,
      [orderNumber, sequence, customerName, customerPhone, deliveryType, address, totalAmount, ip, sessionId]
    );
    return result.rows[0];
  }

  // Insert order item rows
  async createOrderItems(client, itemsParams, valuesQuery) {
    const result = await client.query(
      `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, dressing_id, item_notes)
       VALUES ${valuesQuery}
       RETURNING id, menu_item_id, quantity, FLOOR(unit_price)::INT as unit_price, dressing_id, item_notes`,
      itemsParams
    );
    return result.rows;
  }

  // Update order Discord message ID
  async updateOrderDiscordMessageId(orderId, messageId) {
    await executeQuery('UPDATE orders SET discord_message_id = $1 WHERE id = $2', [messageId, orderId]);
  }

  // Update order Discord cancel message ID
  async updateOrderDiscordCancelMessageId(orderId, messageId) {
    await executeQuery('UPDATE orders SET discord_cancel_message_id = $1 WHERE id = $2', [messageId, orderId]);
  }

  // Fetch order by order number
  async getOrderByNumber(orderNumber) {
    const result = await executeQuery(
      'SELECT id, order_number, sequence_number, customer_name, customer_phone, delivery_type, address, status, cancel_reason, canceled_by, FLOOR(total_amount)::INT as total_amount, session_id, created_at FROM orders WHERE order_number = $1 AND deleted_at IS NULL',
      [orderNumber]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Fetch items for specific order
  async getOrderItemsByOrderId(clientOrPool, orderId) {
    const query = `SELECT 
        orderItem.id, 
        orderItem.menu_item_id, 
        menuItem.name as menu_item_name, 
        orderItem.quantity, 
        FLOOR(orderItem.unit_price)::INT as unit_price, 
        orderItem.dressing_id, 
        COALESCE(dressing.name, 'ไม่รับน้ำสลัด') as dressing_name,
        orderItem.item_notes
       FROM order_items orderItem
       LEFT JOIN menu_items menuItem ON orderItem.menu_item_id = menuItem.id
       LEFT JOIN dressings dressing ON orderItem.dressing_id = dressing.id
       WHERE orderItem.order_id = $1
       ORDER BY orderItem.id ASC`;
    
    let result;
    if (clientOrPool && typeof clientOrPool.query === 'function') {
       result = await clientOrPool.query(query, [orderId]);
    } else {
       result = await executeQuery(query, [orderId]);
    }
    return result.rows;
  }

  // Lock order row for update
  async getOrderByIdForUpdate(client, orderId) {
    const result = await client.query('SELECT id, status, order_number, discord_message_id, session_id FROM orders WHERE id = $1 AND deleted_at IS NULL FOR UPDATE', [orderId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Cancel order in DB
  async cancelOrder(client, orderId, previousStatus, cancelReason, canceledBy) {
    await client.query(
      'UPDATE orders SET status = $1, previous_status = $2, cancelled_at = NOW(), cancel_reason = $3, canceled_by = $4 WHERE id = $5',
      ['ยกเลิก', previousStatus, cancelReason, canceledBy, orderId]
    );
  }
}
