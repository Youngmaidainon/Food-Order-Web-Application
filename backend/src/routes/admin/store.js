import express from 'express';
import { getDatabaseClient } from '../../config/database.js';
import { applicationConfig } from '../../config/config.js';
import { authenticateAdminSession } from '../../middleware/auth.js';
import { sendDiscordDailySummary } from '../../discord.js';

const storeRouter = express.Router();

// PATCH /api/admin/store/status - อัปเดตสถานะการเปิด/ปิดร้าน
storeRouter.patch('/status', authenticateAdminSession, async (request, response) => {
  const { is_open: isOpen, announcement_message: announcementMessage, restaurant_name: restaurantName } = request.body;
  
  // ตรวจสอบข้อมูลก่อนประมวลผล (Input Validation)
  if (restaurantName && restaurantName.length > 100) {
    return response.status(400).json({ success: false, message: 'ชื่อร้านยาวเกินไป (สูงสุด 100 ตัวอักษร)' });
  }
  if (announcementMessage && announcementMessage.length > 200) {
    return response.status(400).json({ success: false, message: 'ข้อความประกาศยาวเกินไป (สูงสุด 200 ตัวอักษร)' });
  }

  const databaseClient = await getDatabaseClient();
  try {
    await databaseClient.query('BEGIN');
    const existingStatus = await databaseClient.query('SELECT is_open FROM store_status WHERE id = 1');
    const wasOpen = existingStatus.rows.length > 0 ? existingStatus.rows[0].is_open : true;

    // กรณีที่กำลังปิดร้าน
    if (wasOpen && isOpen === false) {
      // 1. รวบรวมสถิติยอดขายประจำวัน
      const todaySalesRes = await databaseClient.query(`
        SELECT COALESCE(SUM(total_amount), 0) as total_sales, COUNT(id) as total_orders
        FROM orders WHERE status IN ('รับอาหารแล้ว', 'จัดส่งแล้ว')
      `);
      
      const cancelledRes = await databaseClient.query(`
        SELECT COUNT(id) as cancelled_count FROM orders WHERE status = 'ยกเลิก'
      `);

      const bestSellersRes = await databaseClient.query(`
        SELECT menu_items.name as menu_item_name, SUM(order_items.quantity) as total_quantity 
        FROM order_items 
        JOIN orders ON order_items.order_id = orders.id 
        JOIN menu_items ON order_items.menu_item_id = menu_items.id
        WHERE orders.status IN ('รับอาหารแล้ว', 'จัดส่งแล้ว')
        GROUP BY menu_items.name 
        ORDER BY total_quantity DESC
      `);

      const totalSales = todaySalesRes.rows[0].total_sales;
      const totalOrders = todaySalesRes.rows[0].total_orders;
      const cancelledCount = cancelledRes.rows[0].cancelled_count;
      const bestSellers = bestSellersRes.rows;

      // ลบข้อความแจ้งเตือนยกเลิกทั้งหมด
      if (applicationConfig.discordCancelWebhookUrl) {
        const cancelMessagesRes = await databaseClient.query(`SELECT discord_cancel_message_id FROM orders WHERE discord_cancel_message_id IS NOT NULL`);
        for (const row of cancelMessagesRes.rows) {
          try {
            await fetch(`${applicationConfig.discordCancelWebhookUrl}/messages/${row.discord_cancel_message_id}`, { method: 'DELETE' });
          } catch (err) {
            console.error('Error deleting cancel message:', err);
          }
        }
      }

      // ลบข้อความแจ้งเตือนออเดอร์ใหม่ทั้งหมด
      if (applicationConfig.discordWebhookUrl) {
        const orderMessagesRes = await databaseClient.query(`SELECT discord_message_id FROM orders WHERE discord_message_id IS NOT NULL`);
        for (const row of orderMessagesRes.rows) {
          try {
            await fetch(`${applicationConfig.discordWebhookUrl}/messages/${row.discord_message_id}`, { method: 'DELETE' });
          } catch (err) {
            console.error('Error deleting new order message:', err);
          }
        }
      }

      // 2. ส่งสรุปยอดขายไปที่ Discord
      await sendDiscordDailySummary(totalSales, bestSellers, cancelledCount, totalOrders);

      // 3. ล้างฐานข้อมูลเพื่อเตรียมพร้อมสำหรับการเปิดร้านครั้งต่อไป
      await databaseClient.query('DELETE FROM order_items');
      await databaseClient.query('DELETE FROM orders');
    }

    // รีเซ็ตคิวเมื่อร้านเปิดหรือปิด
    let sequenceUpdate = '';
    if (isOpen !== undefined && isOpen !== wasOpen) {
      sequenceUpdate = ', current_sequence = 0';
    }

    const updateStoreStatusSql = `
      UPDATE store_status 
      SET 
        is_open = COALESCE($1, is_open),
        announcement_message = COALESCE($2, announcement_message),
        restaurant_name = COALESCE($3, restaurant_name)
        ${sequenceUpdate}
      WHERE id = (SELECT id FROM store_status ORDER BY id ASC LIMIT 1)
      RETURNING *
    `;
    let updateResult = await databaseClient.query(updateStoreStatusSql, [isOpen, announcementMessage, restaurantName]);

    if (updateResult.rows.length === 0) {
      updateResult = await databaseClient.query(
        `INSERT INTO store_status (is_open, announcement_message, restaurant_name) 
         VALUES ($1, $2, $3) RETURNING *`,
        [
          isOpen !== undefined ? isOpen : true,
          announcementMessage || 'เปิดรับออเดอร์ค่า💖',
          restaurantName || 'ร้านสปริงโรลออนไลน์'
        ]
      );
    }
    
    await databaseClient.query('COMMIT');
    return response.json({ success: true, message: 'อัปเดตสถานะร้านเรียบร้อยแล้ว', data: updateResult.rows[0] });
  } catch (updateStoreStatusError) {
    await databaseClient.query('ROLLBACK');
    console.error('Error updating store status:', updateStoreStatusError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะร้าน' });
  } finally {
    databaseClient.release();
  }
});

export default storeRouter;
