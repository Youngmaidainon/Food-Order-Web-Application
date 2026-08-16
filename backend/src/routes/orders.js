import express from 'express';
import { getDatabaseClient, executeQuery } from '../config/database.js';
import { checkStoreIsOpen } from './store.js';
import { sendDiscordOrderNotification, deleteDiscordOrderNotification, sendDiscordCancelNotification } from '../discord.js';

const ordersRouter = express.Router();

// ฟังก์ชันช่วยสร้างหมายเลขออเดอร์แบบไม่ซ้ำกัน
const generateUniqueOrderNumber = () => {
  const currentDateString = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomFourDigitNumber = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${currentDateString}-${randomFourDigitNumber}`;
};

// POST /api/orders - สร้างคำสั่งซื้อใหม่
ordersRouter.post('/', async (request, response) => {
  const { customer_name: customerName, customer_phone: customerPhone, delivery_type: deliveryType, address: deliveryAddress, items: orderItemsList } = request.body;

  if (!customerName || !customerPhone || !deliveryType || !orderItemsList || !Array.isArray(orderItemsList) || orderItemsList.length === 0) {
    return response.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลและเลือกสินค้าให้ครบถ้วน' });
  }

  // ตรวจสอบข้อมูลก่อนประมวลผล (Input Validation)
  if (customerName.length > 50) {
    return response.status(400).json({ success: false, message: 'ชื่อผู้สั่งซื้อยาวเกินไป (สูงสุด 50 ตัวอักษร)' });
  }
  if (customerPhone.length > 10) {
    return response.status(400).json({ success: false, message: 'เบอร์โทรศัพท์ยาวเกินไป' });
  }

  if (deliveryType === 'จัดส่ง') {
    if (!deliveryAddress || deliveryAddress.trim() === '') {
      return response.status(400).json({ success: false, message: 'กรุณาระบุที่อยู่สำหรับบริการจัดส่ง' });
    }
    if (deliveryAddress.length > 200) {
      return response.status(400).json({ success: false, message: 'ที่อยู่ยาวเกินไป (สูงสุด 200 ตัวอักษร)' });
    }
  }

  if (!['รับเองที่ร้าน', 'จัดส่ง'].includes(deliveryType)) {
    return response.status(400).json({ success: false, message: 'รูปแบบการรับสินค้าไม่ถูกต้อง' });
  }

  const databaseClient = await getDatabaseClient();

  try {
    const isStoreCurrentlyOpen = await checkStoreIsOpen(databaseClient);
    if (!isStoreCurrentlyOpen) {
      databaseClient.release();
      return response.status(400).json({ success: false, message: 'ขออภัย ขณะนี้ร้านปิดรับออเดอร์' });
    }

    const clientIp = request.ip || '0.0.0.0';
    const cartSessionId = request.cookies?.springroll_cart_session || null;

    // ตรวจสอบการจำกัดอัตรา (Rate Limiting): ป้องกันการสั่งอาหารรัวๆ จากเบอร์โทรหรือเซสชันเดียวกัน
    let activeOrderCheck;
    if (cartSessionId) {
      activeOrderCheck = await databaseClient.query(
        `SELECT order_number FROM orders 
         WHERE (customer_phone = $1 OR session_id = $2) 
         AND status IN ('รอดำเนินการ', 'รับออเดอร์แล้ว', 'กำลังเตรียมอาหาร', 'พร้อมรับอาหาร', 'กำลังจัดส่ง') 
         AND deleted_at IS NULL LIMIT 1`,
        [customerPhone.trim(), cartSessionId]
      );
    } else {
      activeOrderCheck = await databaseClient.query(
        `SELECT order_number FROM orders 
         WHERE customer_phone = $1 
         AND status IN ('รอดำเนินการ', 'รับออเดอร์แล้ว', 'กำลังเตรียมอาหาร', 'พร้อมรับอาหาร', 'กำลังจัดส่ง') 
         AND deleted_at IS NULL LIMIT 1`,
        [customerPhone.trim()]
      );
    }

    if (activeOrderCheck.rows.length > 0) {
      databaseClient.release();
      return response.status(429).json({ success: false, message: `คุณมีออเดอร์ที่กำลังดำเนินการอยู่ (รหัส: ${activeOrderCheck.rows[0].order_number}) กรุณารอให้ออเดอร์ปัจจุบันเสร็จสิ้นก่อนสั่งใหม่` });
    }

    await databaseClient.query('BEGIN');

    let calculatedTotalAmount = 0;
    const validatedOrderItems = [];
    const generatedOrderNumber = generateUniqueOrderNumber();

    const menuItemIds = [...new Set(orderItemsList.map(i => i.menu_item_id))];
    const dressingIds = [...new Set(orderItemsList.map(i => i.dressing_id).filter(id => id))];

    const menuItemsQuery = await databaseClient.query(
      'SELECT id, name, price, is_available FROM menu_items WHERE id = ANY($1::int[])',
      [menuItemIds]
    );
    const menuItemsMap = new Map(menuItemsQuery.rows.map(item => [Number(item.id), item]));

    let dressingsMap = new Map();
    if (dressingIds.length > 0) {
      const dressingsQuery = await databaseClient.query(
        'SELECT id, name, is_available FROM dressings WHERE id = ANY($1::int[])',
        [dressingIds]
      );
      dressingsMap = new Map(dressingsQuery.rows.map(item => [Number(item.id), item]));
    }

    for (const item of orderItemsList) {
      const menuItemRecord = menuItemsMap.get(Number(item.menu_item_id));
      if (!menuItemRecord) {
        throw new Error(`ไม่พบสินค้ารหัส ${item.menu_item_id}`);
      }
      if (!menuItemRecord.is_available) {
        throw new Error(`สินค้า "${menuItemRecord.name}" ไม่พร้อมจำหน่าย`);
      }

      let selectedDressingId = null;
      let selectedDressingName = 'ไม่รับน้ำสลัด';
      if (item.dressing_id) {
        const dressingRecord = dressingsMap.get(Number(item.dressing_id));
        if (dressingRecord) {
          if (!dressingRecord.is_available) {
            throw new Error(`น้ำสลัด "${dressingRecord.name}" ไม่พร้อมจำหน่าย`);
          }
          selectedDressingId = dressingRecord.id;
          selectedDressingName = dressingRecord.name;
        }
      }

      const itemUnitPrice = parseFloat(menuItemRecord.price);
      const itemSubtotalPrice = itemUnitPrice * item.quantity;
      calculatedTotalAmount += itemSubtotalPrice;

      validatedOrderItems.push({
        menu_item_id: menuItemRecord.id,
        name: menuItemRecord.name,
        quantity: item.quantity,
        unit_price: itemUnitPrice,
        dressing_id: selectedDressingId,
        dressing_name: selectedDressingName,
        item_notes: item.item_notes || ''
      });
    }

    const seqResult = await databaseClient.query('SELECT current_sequence FROM store_status WHERE id = 1 FOR UPDATE');
    const newSequence = (seqResult.rows[0].current_sequence || 0) + 1;
    await databaseClient.query('UPDATE store_status SET current_sequence = $1 WHERE id = 1', [newSequence]);

    const newOrderInsertResult = await databaseClient.query(
      `INSERT INTO orders (order_number, sequence_number, customer_name, customer_phone, delivery_type, address, status, total_amount, ip_address, session_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'รอดำเนินการ', $7, $8, $9)
       RETURNING id, order_number, sequence_number, customer_name, customer_phone, delivery_type, address, status, total_amount, created_at`,
      [generatedOrderNumber, newSequence, customerName.trim(), customerPhone.trim(), deliveryType, deliveryAddress ? deliveryAddress.trim() : '', calculatedTotalAmount, clientIp, cartSessionId]
    );

    const createdOrderRecord = newOrderInsertResult.rows[0];

    const values = [];
    const params = [];
    validatedOrderItems.forEach((validatedItem, index) => {
      const offset = index * 6;
      values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
      params.push(createdOrderRecord.id, validatedItem.menu_item_id, validatedItem.quantity, validatedItem.unit_price, validatedItem.dressing_id, validatedItem.item_notes);
    });

    const orderItemInsertResult = await databaseClient.query(
      `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, dressing_id, item_notes)
       VALUES ${values.join(', ')}
       RETURNING id, menu_item_id, quantity, unit_price, dressing_id, item_notes`,
      params
    );

    const insertedOrderItemsList = orderItemInsertResult.rows.map((row, index) => ({
      ...row,
      menu_item_name: validatedOrderItems[index].name,
      dressing_name: validatedOrderItems[index].dressing_name
    }));

    await databaseClient.query('COMMIT');

    const completeOrderPayload = {
      ...createdOrderRecord,
      items: insertedOrderItemsList
    };

    const messageId = await sendDiscordOrderNotification(completeOrderPayload);
    if (messageId) {
      await executeQuery('UPDATE orders SET discord_message_id = $1 WHERE id = $2', [messageId, createdOrderRecord.id]);
    }

    return response.status(201).json({
      success: true,
      message: 'ส่งคำสั่งซื้อเรียบร้อยแล้ว',
      data: completeOrderPayload
    });

  } catch (createOrderError) {
    await databaseClient.query('ROLLBACK');
    console.error('Error creating customer order:', createOrderError.message);
    return response.status(400).json({ success: false, message: createOrderError.message || 'ไม่สามารถสร้างคำสั่งซื้อได้' });
  } finally {
    databaseClient.release();
  }
});

// GET /api/orders/track/:order_number - ติดตามสถานะออเดอร์ด้วยหมายเลขออเดอร์
ordersRouter.get('/track/:order_number', async (request, response) => {
  try {
    const { order_number: targetOrderNumber } = request.params;

    const orderQueryResult = await executeQuery(
      'SELECT id, order_number, sequence_number, customer_name, customer_phone, delivery_type, address, status, cancel_reason, canceled_by, total_amount, created_at FROM orders WHERE order_number = $1 AND deleted_at IS NULL',
      [targetOrderNumber.trim()]
    );

    if (orderQueryResult.rows.length === 0) {
      return response.status(404).json({ success: false, message: 'ไม่พบรหัสคำสั่งซื้อนี้' });
    }

    const orderRecord = orderQueryResult.rows[0];

    const orderItemsQueryResult = await executeQuery(
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
       WHERE orderItem.order_id = $1
       ORDER BY orderItem.id ASC`,
      [orderRecord.id]
    );

    orderRecord.items = orderItemsQueryResult.rows;

    return response.json({ success: true, data: orderRecord });
  } catch (trackOrderError) {
    console.error('Error tracking customer order:', trackOrderError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// PATCH /api/orders/:id/status - ยกเลิกออเดอร์โดยลูกค้า
ordersRouter.patch('/:id/status', async (request, response) => {
  const { id: orderId } = request.params;
  const { status: targetStatus, cancel_reason: cancelReason } = request.body;

  if (targetStatus !== 'ยกเลิก') {
    return response.status(400).json({ success: false, message: 'ลูกค้าสามารถทำการยกเลิกออเดอร์ได้เท่านั้น' });
  }

  if (!cancelReason || cancelReason.trim().length < 1 || cancelReason.trim().length > 20) {
    return response.status(400).json({ success: false, message: 'กรุณาระบุเหตุผลการยกเลิก 1-20 ตัวอักษร' });
  }

  const databaseClient = await getDatabaseClient();

  try {
    await databaseClient.query('BEGIN');

    const orderQueryResult = await databaseClient.query('SELECT id, status, order_number, discord_message_id FROM orders WHERE id = $1 AND deleted_at IS NULL FOR UPDATE', [orderId]);
    if (orderQueryResult.rows.length === 0) {
      throw new Error('ไม่พบออเดอร์ที่ต้องการยกเลิก');
    }

    const currentOrderRecord = orderQueryResult.rows[0];

    if (currentOrderRecord.status !== 'รอดำเนินการ') {
      throw new Error(`ไม่สามารถยกเลิกออเดอร์ได้ เนื่องจากสถานะปัจจุบันคือ "${currentOrderRecord.status}"`);
    }

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
       WHERE orderItem.order_id = $1
       ORDER BY orderItem.id ASC`,
      [currentOrderRecord.id]
    );
    currentOrderRecord.items = orderItemsQueryResult.rows;
    currentOrderRecord.cancel_reason = cancelReason.trim();

    await databaseClient.query(
      'UPDATE orders SET status = $1, previous_status = $2, cancelled_at = NOW(), cancel_reason = $3, canceled_by = $4 WHERE id = $5',
      ['ยกเลิก', currentOrderRecord.status, cancelReason.trim(), 'customer', orderId]
    );

    await databaseClient.query('COMMIT');

    const updatedOrderPayload = { id: parseInt(orderId, 10), order_number: currentOrderRecord.order_number, status: 'ยกเลิก' };

    if (currentOrderRecord.discord_message_id) {
      deleteDiscordOrderNotification(currentOrderRecord.discord_message_id, currentOrderRecord, 'ลูกค้า');
    }
    const cancelMessageId = await sendDiscordCancelNotification(currentOrderRecord, 'ลูกค้า');
    if (cancelMessageId) {
      await executeQuery('UPDATE orders SET discord_cancel_message_id = $1 WHERE id = $2', [cancelMessageId, orderId]);
    }

    return response.json({ success: true, message: 'ยกเลิกออเดอร์เรียบร้อยแล้ว', data: updatedOrderPayload });
  } catch (cancelOrderError) {
    await databaseClient.query('ROLLBACK');
    console.error('Error canceling order by customer:', cancelOrderError.message);
    return response.status(400).json({ success: false, message: cancelOrderError.message });
  } finally {
    databaseClient.release();
  }
});

export default ordersRouter;
