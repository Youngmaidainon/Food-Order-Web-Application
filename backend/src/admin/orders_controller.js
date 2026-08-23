import express from 'express';
import { executeQuery, getDatabaseClient } from '../config/database.js';
import { authenticateAdminSession } from '../shared/middleware/auth.js';
import { deleteDiscordOrderNotification, sendDiscordCancelNotification } from '../discord.js';

const ordersRouter = express.Router();

// GET /api/admin/orders - ดึงข้อมูลออเดอร์ทั้งหมดพร้อมไอเทม (มี Filter สถานะ และ Sort)
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
        FLOOR(customerOrder.total_amount)::INT as total_amount, 
        customerOrder.created_at,
        (
          SELECT COALESCE(JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', orderItem.id,
              'menu_item_id', orderItem.menu_item_id,
              'menu_item_name', menuItem.name,
              'quantity', orderItem.quantity,
              'unit_price', FLOOR(orderItem.unit_price)::INT,
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

    const validSortDirections = ['asc', 'desc'];
    const sanitizedSortDirection = validSortDirections.includes(sortDirection.toLowerCase()) ? sortDirection.toUpperCase() : 'DESC';
    fetchOrdersSql += ` ORDER BY customerOrder.created_at ${sanitizedSortDirection} LIMIT $${queryParameters.length + 1} OFFSET $${queryParameters.length + 2}`;
    queryParameters.push(limitNum, offset);

    const [ordersQueryResult, countQueryResult] = await Promise.all([
      executeQuery(fetchOrdersSql, queryParameters),
      executeQuery(countSql, countParameters)
    ]);

    const totalOrdersCount = parseInt(countQueryResult.rows[0].total, 10);
    const totalPagesCount = Math.ceil(totalOrdersCount / limitNum);

    return response.json({
      success: true,
      data: ordersQueryResult.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalOrdersCount,
        totalPages: totalPagesCount
      }
    });
  } catch (fetchOrdersError) {
    console.error('Error fetching admin orders:', fetchOrdersError.message);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์' });
  }
});

// PATCH /api/admin/orders/:id/status - อัปเดตสถานะคำสั่งซื้อตาม Workflow
ordersRouter.patch('/:id/status', authenticateAdminSession, async (request, response) => {
  const databaseClient = await getDatabaseClient();
  try {
    const { id: orderId } = request.params;
    const { status: newTargetStatus, cancel_reason: cancellationReasonText } = request.body;

    const allowedOrderStatuses = ['รอดำเนินการ', 'รับออเดอร์แล้ว', 'กำลังเตรียมอาหาร', 'พร้อมรับอาหาร', 'กำลังจัดส่ง', 'รับอาหารแล้ว', 'จัดส่งแล้ว', 'ยกเลิก'];
    if (!allowedOrderStatuses.includes(newTargetStatus)) {
      return response.status(400).json({ success: false, message: 'สถานะไม่ถูกต้อง' });
    }

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

    let cancelOrderDetails = null;

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
          FLOOR(orderItem.unit_price)::INT as unit_price, 
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
      cancelOrderDetails = currentOrderRecord;
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

    // Async Non-blocking Discord Notification for Cancellation
    if (cancelOrderDetails) {
      if (cancelOrderDetails.discord_message_id) {
        deleteDiscordOrderNotification(cancelOrderDetails.discord_message_id, cancelOrderDetails, 'ร้านค้า');
      }
      sendDiscordCancelNotification(cancelOrderDetails, 'ร้านค้า').then(async (cancelMessageId) => {
        if (cancelMessageId) {
          try {
            await executeQuery('UPDATE orders SET discord_cancel_message_id = $1 WHERE id = $2', [cancelMessageId, orderId]);
          } catch (err) {
            console.error('Error updating discord cancel message id:', err);
          }
        }
      }).catch(err => {
        console.error('Error sending async Discord cancel notification:', err);
      });
    }

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

// DELETE /api/admin/orders/:id - Soft delete ออเดอร์ (ย้ายไปประวัติที่ถูกลบ)
ordersRouter.delete('/:id', authenticateAdminSession, async (request, response) => {
  try {
    const { id: orderId } = request.params;
    const deleteOrderQueryResult = await executeQuery('UPDATE orders SET deleted_at = NOW() WHERE id = $1 RETURNING id', [orderId]);
    if (deleteOrderQueryResult.rows.length === 0) {
      return response.status(404).json({ success: false, message: 'ไม่พบออเดอร์' });
    }
    return response.json({ success: true, message: 'ลบออเดอร์เรียบร้อยแล้ว' });
  } catch (deleteOrderError) {
    console.error('Error soft-deleting order:', deleteOrderError.message);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบออเดอร์' });
  }
});

export { ordersRouter };
export default ordersRouter;
