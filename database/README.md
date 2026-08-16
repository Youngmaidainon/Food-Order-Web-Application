<div align="center">
  <h1>🗄️ Database Schema & Architecture - ร้านสปริงโรลออนไลน์</h1>
  <p>โครงสร้างฐานข้อมูล <strong>PostgreSQL</strong> ออกแบบตามหลัก Relational Integrity พร้อมการใช้ <strong>Custom ENUMs, Constraints, Cascades</strong> และ Indexes สำหรับ High-Performance Queries</p>
</div>

---

## 🏗️ โครงสร้างตารางและความสัมพันธ์ (Schema Design)

| ตาราง (Table) | คอลัมน์หลัก / Foreign Key | คำอธิบาย |
|---|---|---|
| `categories` | `id (PK)`, `name` | หมวดหมู่อาหาร |
| `menu_items` | `id (PK)`, `category_id (FK)`, `name`, `price`, `is_available` | รายการเมนูอาหาร |
| `dressings` | `id (PK)`, `name`, `is_available` | ตัวเลือกน้ำสลัด |
| `orders` | `id (PK)`, `order_number (UK)`, `customer_name`, `status`, `delivery_type` | ข้อมูลคำสั่งซื้อ |
| `order_items` | `id (PK)`, `order_id (FK)`, `menu_item_id (FK)`, `dressing_id (FK)`, `quantity` | รายการอาหารในคำสั่งซื้อ |
| `cart_sessions` | `session_id (PK, UUID)`, `created_at`, `last_accessed_at` | เซสชันตะกร้าสินค้า |
| `cart_items` | `id (PK)`, `session_id (FK)`, `menu_item_id (FK)`, `dressing_id (FK)`, `quantity`, `item_notes` | รายการสินค้าในตะกร้า |
| `store_status` | `id (PK)`, `is_open`, `current_sequence`, `restaurant_name` | สถานะเปิด/ปิดร้านและคิว |
| `admin_users` | `id (PK)`, `username (UK)`, `password_hash`, `password_rotated_at` | บัญชีผู้ดูแลระบบ |
| `admin_sessions` | `session_id (PK, UUID)`, `admin_id (FK)`, `expires_at` | เซสชันการเข้าสู่ระบบแอดมิน |
| `daily_reports` | `id (PK)`, `discord_message_id`, `created_at` | บันทึกประวัติการส่งรายงานรายวัน |

---

## 🛡️ กลไกความสมบูรณ์ของข้อมูล (Data Integrity & Optimization)

1. **Type-Safety ด้วย `ENUM`**
   - `delivery_type_enum`: `'รับเองที่ร้าน'`, `'จัดส่ง'`
   - `order_status_enum`: `'รอดำเนินการ'`, `'รับออเดอร์แล้ว'`, `'กำลังเตรียมอาหาร'`, `'พร้อมรับอาหาร'`, `'รับอาหารแล้ว'`, `'กำลังจัดส่ง'`, `'จัดส่งแล้ว'`, `'ยกเลิก'`
   - ป้องกัน Application Layer บันทึกค่าสถานะที่ไม่ถูกต้องลงฐานข้อมูล
2. **Composite Unique Constraint บน `cart_items`**
   - คำสั่ง `UNIQUE(session_id, menu_item_id, dressing_id)` ป้องกันการแทรกแถวซ้ำซ้อน และบังคับให้อัปเดตจำนวนสินค้า (`quantity`) แทนการสร้างรายการใหม่
3. **Foreign Key Constraints & Cascading Deletes**
   - ความสัมพันธ์ระหว่าง `orders` และ `order_items` ใช้ `ON DELETE CASCADE` ช่วยทำความสะอาดข้อมูลรายการอาหารเมื่อออเดอร์ถูกลบ
4. **Optimized Indexes**
   - `idx_orders_status` บน `orders(status)` เพื่อเร่งความเร็วในการ Filter ออเดอร์ของหน้าจัดการแอดมิน
   - `idx_orders_created_at` บน `orders(created_at)` สำหรับการจัดเรียงออเดอร์ล่าสุด
   - `idx_order_items_order_id` เพื่อความรวดเร็วในการทำ JOIN ตารางรายการอาหาร
   - `idx_cart_sessions_last_active` และ `idx_admin_sessions_expires_at` ช่วยให้คำสั่ง Cron Maintenance ลบ Session เก่าได้อย่างรวดเร็ว

---

## 🚀 ความเข้ากันได้กับ Neon Serverless PostgreSQL

สคริปต์ `database/schema.sql` และคำสั่งใน `backend/server.js` สามารถนำไปรันบน **Neon.tech** ได้ทันที:
- รองรับ SSL Connection (`sslmode=require`)
- รองรับ Connection Pooling (PgBouncer)
- มี Seed Data พื้นฐาน (Admin user, หมวดหมู่, เมนูอาหาร, และรายการน้ำสลัด) พร้อมใช้งานทันที
