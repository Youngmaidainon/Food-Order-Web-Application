<div align="center">
  <h1>🗄️ โครงสร้างฐานข้อมูล (Database Schema) - ร้านสปริงโรลออนไลน์</h1>
  <p><strong>ระบบฐานข้อมูล PostgreSQL ออกแบบตามหลักความถูกต้องของข้อมูล (Relational Integrity), Custom ENUMs, Foreign Key Cascades และดัชนี (Indexes) ประสิทธิภาพสูง</strong></p>
</div>

---

## 🏗️ โครงสร้างตารางและความสัมพันธ์ (Schema Design)

| ตาราง (Table) | คอลัมน์หลัก / Foreign Key | คำอธิบาย |
|---|---|---|
| `categories` | `id (PK)`, `name` | หมวดหมู่อาหาร |
| `menu_items` | `id (PK)`, `category_id (FK)`, `name`, `price`, `is_available` | รายการอาหารและราคา |
| `dressings` | `id (PK)`, `name`, `is_available` | รายการน้ำสลัด |
| `orders` | `id (PK)`, `order_number (UK)`, `customer_name`, `status`, `delivery_type` | คำสั่งซื้อและข้อมูลลูกค้า |
| `order_items` | `id (PK)`, `order_id (FK)`, `menu_item_id (FK)`, `dressing_id (FK)`, `quantity` | รายการอาหารในคำสั่งซื้อ |
| `cart_sessions` | `session_id (PK, UUID)`, `created_at`, `last_accessed_at` | เซสชันตะกร้าสินค้า |
| `cart_items` | `id (PK)`, `session_id (FK)`, `menu_item_id (FK)`, `dressing_id (FK)`, `quantity`, `item_notes` | รายการสินค้าในตะกร้า |
| `store_status` | `id (PK)`, `is_open`, `current_sequence`, `restaurant_name`, `announcement_message` | สถานะร้าน, ลำดับคิว, ชื่อร้าน, ข้อความประกาศ |
| `admin_users` | `id (PK)`, `username (UK)`, `password_hash`, `password_rotated_at` | บัญชีผู้ดูแลระบบ (แอดมิน) |
| `admin_sessions` | `session_id (PK, UUID)`, `admin_id (FK)`, `expires_at` | เซสชันการเข้าสู่ระบบของแอดมิน |
| `daily_reports` | `id (PK)`, `discord_message_id`, `created_at` | ประวัติการส่งรายงานสรุปยอดเข้า Discord |

---

## 🛡️ กลไกความสมบูรณ์ของข้อมูลและประสิทธิภาพ (Data Integrity & Optimization)

1. **ความปลอดภัยของประเภทข้อมูลด้วย ENUM (Type-Safety ENUMs)**
   - `delivery_type_enum`: `'รับเองที่ร้าน'`, `'จัดส่ง'`
   - `order_status_enum`: `'รอดำเนินการ'`, `'รับออเดอร์แล้ว'`, `'กำลังเตรียมอาหาร'`, `'พร้อมรับอาหาร'`, `'รับอาหารแล้ว'`, `'กำลังจัดส่ง'`, `'จัดส่งแล้ว'`, `'ยกเลิก'`
   - ป้องกันการบันทึกค่าสถานะที่ผิดพลาดในระดับฐานข้อมูล

2. **ข้อกำหนดความไม่ซ้ำซ้อนแบบผสม (Composite Unique Constraint) บน `cart_items`**
   - `UNIQUE(session_id, menu_item_id, dressing_id)`: ป้องกันแถวซ้ำซ้อน และบังคับให้อัปเดตจำนวน (`quantity`) แทนการสร้างแถวใหม่

3. **ข้อกำหนด Foreign Key และการลบแบบต่อเนื่อง (Cascades)**
   - `orders` -> `order_items` กำหนด `ON DELETE CASCADE` เพื่อล้างรายการอาหารที่เกี่ยวข้องอัตโนมัติเมื่อลบออเดอร์

4. **ดัชนีเพื่อเพิ่มความเร็วในการค้นหา (Optimized Indexes)**
   - `idx_orders_status` บน `orders(status)`: เร่งความเร็วในการกรองสถานะออเดอร์ในหน้าแอดมิน
   - `idx_orders_created_at` บน `orders(created_at)`: เร่งความเร็วในการจัดเรียงออเดอร์ล่าสุด
   - `idx_order_items_order_id`: เร่งความเร็วในการทำคำสั่ง JOIN รายการอาหาร
   - `idx_cart_sessions_last_active` และ `idx_admin_sessions_expires_at`: เร่งความเร็วให้ระบบ Cron ล้างเซสชันที่หมดอายุ

---

## 🚀 ความเข้ากันได้กับ Neon Serverless PostgreSQL

สคริปต์ `database/schema.sql` และระบบใน `backend/server.js` สามารถนำไปรันบน **Neon.tech** ได้ทันที:
- รองรับการเชื่อมต่อแบบปลอดภัย SSL (`sslmode=require`)
- รองรับระบบ Connection Pooling (PgBouncer)
- มีข้อมูลเริ่มต้น (Seed Data) พร้อมใช้งานทันที (ผู้ใช้แอดมิน, หมวดหมู่, เมนูอาหาร และน้ำสลัด)
