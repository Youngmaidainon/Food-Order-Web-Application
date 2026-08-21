import { executeQuery } from '../config/database.js';

export class StoreRepository {
  async getStoreStatus(databaseClient = null) {
    const queryExecutor = databaseClient ? (sqlText, sqlParams) => databaseClient.query(sqlText, sqlParams) : executeQuery;
    const statusQueryResult = await queryExecutor(
      `SELECT is_open, announcement_message, restaurant_name, hero_title, hero_subtitle, current_sequence
       FROM store_status ORDER BY id ASC LIMIT 1`
    );
    return statusQueryResult.rows.length > 0 ? statusQueryResult.rows[0] : null;
  }

  async getStoreStatusForUpdate(databaseClient) {
    const statusQueryResult = await databaseClient.query(
      `SELECT is_open FROM store_status WHERE id = 1 FOR UPDATE`
    );
    return statusQueryResult.rows.length > 0 ? statusQueryResult.rows[0] : null;
  }

  async getTodaySales(databaseClient) {
    const res = await databaseClient.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total_sales, COUNT(id) as total_orders
      FROM orders WHERE status IN ('รับอาหารแล้ว', 'จัดส่งแล้ว')
    `);
    return res.rows[0];
  }

  async getCancelledCount(databaseClient) {
    const res = await databaseClient.query(`
      SELECT COUNT(id) as cancelled_count FROM orders WHERE status = 'ยกเลิก'
    `);
    return res.rows[0].cancelled_count;
  }

  async getBestSellers(databaseClient) {
    const res = await databaseClient.query(`
      SELECT menu_items.name as menu_item_name, SUM(order_items.quantity) as total_quantity 
      FROM order_items 
      JOIN orders ON order_items.order_id = orders.id 
      JOIN menu_items ON order_items.menu_item_id = menu_items.id
      WHERE orders.status IN ('รับอาหารแล้ว', 'จัดส่งแล้ว')
      GROUP BY menu_items.name 
      ORDER BY total_quantity DESC
    `);
    return res.rows;
  }

  async getDiscordCancelMessages(databaseClient) {
    const res = await databaseClient.query(`SELECT discord_cancel_message_id FROM orders WHERE discord_cancel_message_id IS NOT NULL`);
    return res.rows.map(r => r.discord_cancel_message_id);
  }

  async getDiscordOrderMessages(databaseClient) {
    const res = await databaseClient.query(`SELECT discord_message_id FROM orders WHERE discord_message_id IS NOT NULL`);
    return res.rows.map(r => r.discord_message_id);
  }

  async clearDailyQueue(databaseClient) {
    await databaseClient.query('DELETE FROM order_items');
    await databaseClient.query('DELETE FROM orders');
  }

  async updateStoreStatus(databaseClient, isOpen, announcementMessage, restaurantName, heroTitle, heroSubtitle, resetSequence) {
    const sequenceUpdate = resetSequence ? ', current_sequence = 0' : '';
    const updateStoreStatusSql = `
      UPDATE store_status 
      SET 
        is_open = COALESCE($1, is_open),
        announcement_message = COALESCE($2, announcement_message),
        restaurant_name = COALESCE($3, restaurant_name),
        hero_title = COALESCE($4, hero_title),
        hero_subtitle = COALESCE($5, hero_subtitle)
        ${sequenceUpdate}
      WHERE id = (SELECT id FROM store_status ORDER BY id ASC LIMIT 1)
      RETURNING *
    `;
    const res = await databaseClient.query(updateStoreStatusSql, [isOpen, announcementMessage, restaurantName, heroTitle, heroSubtitle]);
    return res.rows.length > 0 ? res.rows[0] : null;
  }

  async insertStoreStatus(databaseClient, isOpen, announcementMessage, restaurantName, heroTitle, heroSubtitle) {
    const res = await databaseClient.query(
      `INSERT INTO store_status (is_open, announcement_message, restaurant_name, hero_title, hero_subtitle) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        isOpen !== undefined ? isOpen : true,
        announcementMessage || 'เปิดรับออเดอร์ค่า💖',
        restaurantName || 'ร้านสปริงโรลออนไลน์',
        heroTitle || '🥗 เมนูเพื่อสุขภาพสดใหม่',
        heroSubtitle || 'ผักสดกรอบ สะอาด อร่อยเต็มคำ — ทำสดใหม่ทุกออเดอร์'
      ]
    );
    return res.rows[0];
  }
}
