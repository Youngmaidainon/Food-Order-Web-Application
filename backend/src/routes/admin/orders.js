import express from 'express';
import { executeQuery, getDatabaseClient } from '../../config/database.js';
import { authenticateAdminSession } from '../../middleware/auth.js';
import { deleteDiscordOrderNotification, sendDiscordCancelNotification } from '../../discord.js';

const ordersRouter = express.Router();

// GET /api/admin/orders - Get all orders with items, optional status filter & sort (asc/desc)
ordersRouter.get('/', authenticateAdminSession, async (request, response) => {
  try {
    const { status: filterStatus, sort: sortDirection = 'desc', page = '1', limit = '50' } = request.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const offset = (pageNum - 1) * limitNum;

    let fetchOrdersSql = `
      SELECT 
        customerOrder.id, 
        customerOrder.order_number,
        customerOrder.sequence_number,
        customerOrder.customer_name, 
        customerOrder.customer_phone, 
        customerOrder.delivery_type, 
        customerOrder.address, 
        customerOrder.status, 
        customerOrder.cancel_reason,
        customerOrder.canceled_by,
        customerOrder.total_amount, 
        customerOrder.created_at,
        (
          SELECT COALESCE(JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', orderItem.id,
              'menu_item_id', orderItem.menu_item_id,
              'menu_item_name', menuItem.name,
              'quantity', orderItem.quantity,
              'unit_price', orderItem.unit_price,
              'dressing_id', orderItem.dressing_id,
              'dressing_name', COALESCE(dressing.name, 'ไม่รับน้ำสลัด'),
              'item_notes', orderItem.item_notes
            ) ORDER BY orderItem.id ASC
          ), '[]')
          FROM order_items orderItem
          LEFT JOIN menu_items menuItem ON orderItem.menu_item_id = menuItem.id
          LEFT JOIN dressings dressing ON orderItem.dressing_id = dressing.id
          WHERE orderItem.order_id = customerOrder.id
        ) as items
      FROM orders customerOrder
      WHERE customerOrder.deleted_at IS NULL AND customerOrder.status != 'ยกเลิก'
    `;
    
    let countSql = `SELECT COUNT(*) as total FROM orders customerOrder WHERE customerOrder.deleted_at IS NULL AND customerOrder.status != 'ยกเลิก'`;
    const queryParameters = [];
    const countParameters = [];

    if (filterStatus && filterStatus !== 'ทั้งหมด') {
      fetchOrdersSql += ' AND customerOrder.status = $1';
      countSql += ' AND customerOrder.status = $1';
      queryParameters.push(filterStatus);
      countParameters.push(filterStatus);
    }

    const orderSortingDirection = sortDirection === 'asc' ? 'ASC' : 'DESC';
    fetchOrdersSql += ` ORDER BY customerOrder.created_at ${orderSortingDirection}`;
    
    queryParameters.push(limitNum);
    queryParameters.push(offset);
    fetchOrdersSql += ` LIMIT $${queryParameters.length - 1} OFFSET $${queryParameters.length}`;

    const [adminOrdersQueryResult, countResult] = await Promise.all([
      executeQuery(fetchOrdersSql, queryParameters),
      executeQuery(countSql, countParameters)
    ]);
    
    const totalCount = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(totalCount / limitNum);

    return response.json({ 
      success: true, 
      data: adminOrdersQueryResult.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: totalPages
      }
    });
  } catch (fetchOrdersError) {
    console.error('Error fetching admin orders:', fetchOrdersError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});


// PATCH /api/admin/orders/:id/status - Update order status
ordersRouter.patch('/:id/status', authenticateAdminSession, async (request, response) => {
  const { id: orderId } = request.params;
  const { status: newTargetStatus, cancel_reason: cancelReason, reason: legacyReason } = request.body;
  const cancellationReasonText = cancelReason || legacyReason || null;

  const validOrderStatuses = ['รอดำเนินการ', 'รับออเดอร์แล้ว', 'กำลังเตรียมอาหาร', 'พร้อมรับอาหาร', 'รับอาหารแล้ว', 'กำลังจัดส่ง', 'จัดส่งแล้ว', 'ยกเลิก'];
  if (!validOrderStatuses.includes(newTargetStatus)) {
    return response.status(400).json({ success: false, message: 'สถานะออเดอร์ไม่ถูกต้อง' });
  }

  const databaseClient = await getDatabaseClient();

  try {
    await databaseClient.query('BEGIN');

    const orderQueryResult = await databaseClient.query('SELECT id, status, order_number, delivery_type, discord_message_id FROM orders WHERE id = $1 AND deleted_at IS NULL FOR UPDATE', [orderId]);
    if (orderQueryResult.rows.length === 0) {
      throw new Error('ไม่พบออเดอร์ที่ระบุ');
    }

    const { status: previousStatus, delivery_type: deliveryType } = orderQueryResult.rows[0];

    if (previousStatus === newTargetStatus) {
      await databaseClient.query('ROLLBACK');
      return response.json({ success: true, message: 'สถานะไม่มีการเปลี่ยนแปลง' });
    }

    if (newTargetStatus === 'ยกเลิก') {
      if (!cancellationReasonText || cancellationReasonText.trim().length < 1 || cancellationReasonText.trim().length > 20) {
        throw new Error('กรุณาระบุเหตุผลการยกเลิก 1-20 ตัวอักษร');
      }
      await databaseClient.query('UPDATE orders SET status = $1, cancel_reason = COALESCE($2, cancel_reason), canceled_by = $3, previous_status = $4, cancelled_at = NOW() WHERE id = $5', [newTargetStatus, cancellationReasonText.trim(), 'admin', previousStatus, orderId]);
      
      const currentOrderRecord = orderQueryResult.rows[0];
      const orderItemsQueryResult = await databaseClient.query(
        `SELECT 
          orderItem.id, 
          orderItem.menu_item_id, 
          menuItem.name as menu_item_name, 
          orderItem.quantity, 
          orderItem.unit_price, 
          orderItem.dressing_id, 
          COALESCE(dressing.name, 'ไม่รับน้ำสลัด') as dressing_name, 
          orderItem.item_notes
         FROM order_items orderItem
         LEFT JOIN menu_items menuItem ON orderItem.menu_item_id = menuItem.id
         LEFT JOIN dressings dressing ON orderItem.dressing_id = dressing.id
         WHERE orderItem.order_id = $1`,
        [currentOrderRecord.id]
      );
      currentOrderRecord.items = orderItemsQueryResult.rows;
      currentOrderRecord.cancel_reason = cancellationReasonText.trim();
      
      if (currentOrderRecord.discord_message_id) {
        deleteDiscordOrderNotification(currentOrderRecord.discord_message_id, currentOrderRecord, 'ร้านค้า');
      }
      const cancelMessageId = await sendDiscordCancelNotification(currentOrderRecord, 'ร้านค้า');
      if (cancelMessageId) {
        await databaseClient.query('UPDATE orders SET discord_cancel_message_id = $1 WHERE id = $2', [cancelMessageId, orderId]);
      }
    } else {
      const pickupFlow = ['รอดำเนินการ', 'รับออเดอร์แล้ว', 'กำลังเตรียมอาหาร', 'พร้อมรับอาหาร', 'รับอาหารแล้ว'];
      const deliveryFlow = ['รอดำเนินการ', 'รับออเดอร์แล้ว', 'กำลังเตรียมอาหาร', 'กำลังจัดส่ง', 'จัดส่งแล้ว'];
      const flow = deliveryType === 'รับเองที่ร้าน' ? pickupFlow : deliveryFlow;
      
      const currentIndex = flow.indexOf(previousStatus);
      const targetIndex = flow.indexOf(newTargetStatus);
      
      if (targetIndex === -1) throw new Error(`สถานะ "${newTargetStatus}" ไม่รองรับสำหรับออเดอร์ประเภท ${deliveryType}`);
      if (targetIndex <= currentIndex) throw new Error('ไม่สามารถย้อนกลับหรือเปลี่ยนเป็นสถานะเดิมได้');
      if (targetIndex > currentIndex + 1) throw new Error('ไม่สามารถข้ามขั้นตอนได้');

      await databaseClient.query('UPDATE orders SET status = $1 WHERE id = $2', [newTargetStatus, orderId]);
    }

    await databaseClient.query('COMMIT');

    const updatedOrderPayload = { id: parseInt(orderId, 10), order_number: orderQueryResult.rows[0].order_number, status: newTargetStatus, previousStatus };

    return response.json({ success: true, message: `อัปเดตสถานะออเดอร์เป็น "${newTargetStatus}" เรียบร้อยแล้ว`, data: updatedOrderPayload });
  } catch (updateOrderStatusError) {
    await databaseClient.query('ROLLBACK');
    console.error('Error updating order status:', updateOrderStatusError.message);
    return response.status(400).json({ success: false, message: updateOrderStatusError.message });
  } finally {
    databaseClient.release();
  }
});


// POST /api/admin/orders/reset-queue - Reset order queue sequence
ordersRouter.post('/reset-queue', authenticateAdminSession, async (request, response) => {
  const databaseClient = await getDatabaseClient();
  try {
    await databaseClient.query('BEGIN');
    await databaseClient.query('TRUNCATE TABLE order_items, orders RESTART IDENTITY CASCADE');
    await databaseClient.query('UPDATE store_status SET current_sequence = 0 WHERE id = 1');
    await databaseClient.query('COMMIT');

    return response.json({
      success: true,
      message: 'รีเซ็ตลำดับคิวเรียบร้อยแล้ว! คิวถัดไปจะเริ่มต้นที่ คิวที่ #1'
    });
  } catch (resetQueueError) {
    await databaseClient.query('ROLLBACK');
    console.error('Error resetting queue:', resetQueueError);
    return response.status(500).json({ success: false, message: `เกิดข้อผิดพลาดในการรีเซ็ตคิว: ${resetQueueError.message}` });
  } finally {
    databaseClient.release();
  }
});

export default ordersRouter;
