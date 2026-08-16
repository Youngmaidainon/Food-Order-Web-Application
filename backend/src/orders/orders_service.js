import { ValidationError, AppError } from '../shared/errors.js';
import { getDatabaseClient } from '../shared/database/database.js';
import { storeService } from '../store/store_controller.js';
import { sendDiscordOrderNotification, deleteDiscordOrderNotification, sendDiscordCancelNotification } from '../discord.js';

export class OrdersService {
  constructor(ordersRepository) {
    this.ordersRepository = ordersRepository;
  }

  generateUniqueOrderNumber() {
    const currentDateString = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomFourDigitNumber = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${currentDateString}-${randomFourDigitNumber}`;
  }

  async createOrder(data, ip, cartSessionId) {
    // แยกส่วนประกอบของข้อมูล (Destructuring)
    const { customer_name: customerName, customer_phone: customerPhone, delivery_type: deliveryType, address: deliveryAddress, items: orderItemsList } = data;

    if (!customerName || !customerPhone || !deliveryType || !orderItemsList || !Array.isArray(orderItemsList) || orderItemsList.length === 0) {
      throw new ValidationError('กรุณากรอกข้อมูลและเลือกสินค้าให้ครบถ้วน');
    }

    if (customerName.length > 50) throw new ValidationError('ชื่อผู้สั่งซื้อยาวเกินไป (สูงสุด 50 ตัวอักษร)');
    if (customerPhone.length > 10) throw new ValidationError('เบอร์โทรศัพท์ยาวเกินไป');

    if (deliveryType === 'จัดส่ง') {
      if (!deliveryAddress || deliveryAddress.trim() === '') throw new ValidationError('กรุณาระบุที่อยู่สำหรับบริการจัดส่ง');
      if (deliveryAddress.length > 200) throw new ValidationError('ที่อยู่ยาวเกินไป (สูงสุด 200 ตัวอักษร)');
    }

    if (!['รับเองที่ร้าน', 'จัดส่ง'].includes(deliveryType)) {
      throw new ValidationError('รูปแบบการรับสินค้าไม่ถูกต้อง');
    }

    const databaseClient = await getDatabaseClient();

    try {
      // เช็คว่าร้านเปิดอยู่หรือไม่ (Business Rule: เปิดรับออเดอร์)
      const isStoreCurrentlyOpen = await storeService.checkStoreIsOpen(databaseClient);
      if (!isStoreCurrentlyOpen) {
        throw new ValidationError('ขออภัย ขณะนี้ร้านปิดรับออเดอร์');
      }

      const activeOrderCheck = await this.ordersRepository.getActiveOrderCountByPhoneOrSession(databaseClient, customerPhone.trim(), cartSessionId);
      if (activeOrderCheck) {
        // Business Rule: ห้ามสั่งออเดอร์ซ้อนกันถ้าอันเดิมยังไม่เสร็จ (Anti Spam)
        throw new AppError(`คุณมีออเดอร์ที่กำลังดำเนินการอยู่ (รหัส: ${activeOrderCheck.order_number}) กรุณารอให้ออเดอร์ปัจจุบันเสร็จสิ้นก่อนสั่งใหม่`, 'TOO_MANY_REQUESTS', 429);
      }

      // เริ่มต้น Transaction (ป้องกัน Data Inconsistency หากระหว่างบันทึกข้อมูลมีข้อผิดพลาด)
      await databaseClient.query('BEGIN');

      let calculatedTotalAmount = 0;
      const validatedOrderItems = [];
      const generatedOrderNumber = this.generateUniqueOrderNumber();

      const menuItemIds = [...new Set(orderItemsList.map(i => i.menu_item_id))];
      const dressingIds = [...new Set(orderItemsList.map(i => i.dressing_id).filter(id => id))];

      const menuItems = await this.ordersRepository.getMenuItemsByIds(databaseClient, menuItemIds);
      const menuItemsMap = new Map(menuItems.map(item => [Number(item.id), item]));

      let dressingsMap = new Map();
      if (dressingIds.length > 0) {
        const dressings = await this.ordersRepository.getDressingsByIds(databaseClient, dressingIds);
        dressingsMap = new Map(dressings.map(item => [Number(item.id), item]));
      }

      for (const item of orderItemsList) {
        const menuItemRecord = menuItemsMap.get(Number(item.menu_item_id));
        if (!menuItemRecord) throw new ValidationError(`ไม่พบสินค้ารหัส ${item.menu_item_id}`);
        if (!menuItemRecord.is_available) throw new ValidationError(`สินค้า "${menuItemRecord.name}" ไม่พร้อมจำหน่าย`);

        let selectedDressingId = null;
        let selectedDressingName = 'ไม่รับน้ำสลัด';
        if (item.dressing_id) {
          const dressingRecord = dressingsMap.get(Number(item.dressing_id));
          if (dressingRecord) {
            if (!dressingRecord.is_available) throw new ValidationError(`น้ำสลัด "${dressingRecord.name}" ไม่พร้อมจำหน่าย`);
            selectedDressingId = dressingRecord.id;
            selectedDressingName = dressingRecord.name;
          }
        }

        const itemUnitPrice = parseFloat(menuItemRecord.price);
        calculatedTotalAmount += itemUnitPrice * item.quantity;

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

      const newSequence = await this.ordersRepository.getAndIncrementSequence(databaseClient);

      const createdOrderRecord = await this.ordersRepository.createOrder(databaseClient, {
        orderNumber: generatedOrderNumber,
        sequence: newSequence,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryType,
        address: deliveryAddress ? deliveryAddress.trim() : '',
        totalAmount: calculatedTotalAmount,
        ip: ip || '0.0.0.0',
        sessionId: cartSessionId
      });

      const values = [];
      const params = [];
      validatedOrderItems.forEach((validatedItem, index) => {
        const offset = index * 6;
        values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
        params.push(createdOrderRecord.id, validatedItem.menu_item_id, validatedItem.quantity, validatedItem.unit_price, validatedItem.dressing_id, validatedItem.item_notes);
      });

      const insertedOrderItemsList = await this.ordersRepository.createOrderItems(databaseClient, params, values.join(', '));

      const completeOrderItemsList = insertedOrderItemsList.map((row, index) => ({
        ...row,
        menu_item_name: validatedOrderItems[index].name,
        dressing_name: validatedOrderItems[index].dressing_name
      }));

      await databaseClient.query('COMMIT');

      const completeOrderPayload = {
        ...createdOrderRecord,
        items: completeOrderItemsList
      };

      const messageId = await sendDiscordOrderNotification(completeOrderPayload);
      if (messageId) {
        await this.ordersRepository.updateOrderDiscordMessageId(createdOrderRecord.id, messageId);
      }

      return completeOrderPayload;
    } catch (error) {
      // ยกเลิกการเปลี่ยนแปลงทั้งหมดใน Transaction หากมี Error เกิดขึ้น (Rollback)
      await databaseClient.query('ROLLBACK');
      throw error;
    } finally {
      databaseClient.release();
    }
  }

  async trackOrder(orderNumber) {
    const orderRecord = await this.ordersRepository.getOrderByNumber(orderNumber);
    if (!orderRecord) throw new AppError('ไม่พบรหัสคำสั่งซื้อนี้', 'NOT_FOUND', 404);

    const items = await this.ordersRepository.getOrderItemsByOrderId(this.ordersRepository, orderRecord.id);
    orderRecord.items = items;
    return orderRecord;
  }

  async cancelOrderCustomer(orderId, targetStatus, cancelReason, cartSessionId) {
    if (targetStatus !== 'ยกเลิก') throw new ValidationError('ลูกค้าสามารถทำการยกเลิกออเดอร์ได้เท่านั้น');
    if (!cancelReason || cancelReason.trim().length < 1 || cancelReason.trim().length > 20) {
      throw new ValidationError('กรุณาระบุเหตุผลการยกเลิก 1-20 ตัวอักษร');
    }

    const databaseClient = await getDatabaseClient();
    try {
      await databaseClient.query('BEGIN');

      const currentOrderRecord = await this.ordersRepository.getOrderByIdForUpdate(databaseClient, orderId);
      if (!currentOrderRecord) throw new ValidationError('ไม่พบออเดอร์ที่ต้องการยกเลิก');
      
      // ป้องกัน IDOR: ตรวจสอบว่า session_id ตรงกับคนที่สั่งหรือไม่
      if (currentOrderRecord.session_id !== cartSessionId) {
        throw new AppError('ไม่มีสิทธิ์เข้าถึงออเดอร์นี้', 'FORBIDDEN', 403);
      }

      if (currentOrderRecord.status !== 'รอดำเนินการ') {
        throw new ValidationError(`ไม่สามารถยกเลิกออเดอร์ได้ เนื่องจากสถานะปัจจุบันคือ "${currentOrderRecord.status}"`);
      }

      const items = await this.ordersRepository.getOrderItemsByOrderId(databaseClient, currentOrderRecord.id);
      currentOrderRecord.items = items;
      currentOrderRecord.cancel_reason = cancelReason.trim();

      await this.ordersRepository.cancelOrder(databaseClient, orderId, currentOrderRecord.status, cancelReason.trim(), 'customer');
      await databaseClient.query('COMMIT');

      const updatedOrderPayload = { id: parseInt(orderId, 10), order_number: currentOrderRecord.order_number, status: 'ยกเลิก' };

      if (currentOrderRecord.discord_message_id) {
        deleteDiscordOrderNotification(currentOrderRecord.discord_message_id, currentOrderRecord, 'ลูกค้า');
      }
      const cancelMessageId = await sendDiscordCancelNotification(currentOrderRecord, 'ลูกค้า');
      if (cancelMessageId) {
        await this.ordersRepository.updateOrderDiscordCancelMessageId(orderId, cancelMessageId);
      }

      return updatedOrderPayload;
    } catch (error) {
      await databaseClient.query('ROLLBACK');
      throw error;
    } finally {
      databaseClient.release();
    }
  }
}
