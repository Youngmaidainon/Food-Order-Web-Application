import { z } from 'zod';

// กำหนดขอบเขตความปลอดภัยสำหรับข้อมูลฝั่งขาเข้า (Trust Boundary)
export const adminLoginSchema = z.object({
  username: z.string().trim().min(1, 'กรุณากรอก Username'),
  password: z.string().trim().min(1, 'กรุณากรอก Password'),
});

const orderItemSchema = z.object({
  menu_item_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
  dressing_id: z.number().int().positive().nullable().optional(),
  item_notes: z.string().max(200).optional(),
});

// กำหนด Schema โครงสร้างการสั่งอาหาร เพื่อป้องกัน Payload ผิดปกติ (Payload Injection)
export const createOrderSchema = z.object({
  customer_name: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(50, 'ชื่อผู้สั่งซื้อยาวเกินไป (สูงสุด 50 ตัวอักษร)'),
  customer_phone: z.string().trim().min(9, 'เบอร์โทรศัพท์สั้นเกินไป').max(10, 'เบอร์โทรศัพท์ยาวเกินไป'),
  delivery_type: z.enum(['รับเองที่ร้าน', 'จัดส่ง'], { errorMap: () => ({ message: 'รูปแบบการรับสินค้าไม่ถูกต้อง' }) }),
  address: z.string().max(200, 'ที่อยู่ยาวเกินไป (สูงสุด 200 ตัวอักษร)').nullable().optional().transform(val => val || ''),
  items: z.array(orderItemSchema).min(1, 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ')
}).refine(data => {
  if (data.delivery_type === 'จัดส่ง' && (!data.address || data.address.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'กรุณาระบุที่อยู่สำหรับบริการจัดส่ง',
  path: ['address']
});

export const cancelOrderSchema = z.object({
  status: z.literal('ยกเลิก', { errorMap: () => ({ message: 'ลูกค้าสามารถทำการยกเลิกออเดอร์ได้เท่านั้น' }) }),
  cancel_reason: z.string().trim().min(1, 'กรุณาระบุเหตุผลการยกเลิก 1-20 ตัวอักษร').max(20, 'กรุณาระบุเหตุผลการยกเลิก 1-20 ตัวอักษร'),
});

export const cartItemAddSchema = z.object({
  menu_item_id: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
  dressing_id: z.number().int().positive().nullable().optional(),
  item_notes: z.string().max(200).optional(),
});

export const cartItemUpdateSchema = z.object({
  quantity: z.number().int().positive(),
});
