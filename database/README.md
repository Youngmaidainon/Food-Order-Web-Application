<div align="center">
  <h1>🗄️ Database Schema & Architecture - ร้านสปริงโรลออนไลน์</h1>
  <p><strong>PostgreSQL schema. Relational integrity, custom ENUMs, foreign key cascades, high-perf indexes.</strong></p>
</div>

---

## 🏗️ โครงสร้างตารางและความสัมพันธ์ (Schema Design)

| ตาราง (Table) | คอลัมน์หลัก / Foreign Key | คำอธิบาย |
|---|---|---|
| `categories` | `id (PK)`, `name` | หมวดหมู่อาหาร |
| `menu_items` | `id (PK)`, `category_id (FK)`, `name`, `price`, `is_available` | เมนูอาหาร |
| `dressings` | `id (PK)`, `name`, `is_available` | น้ำสลัด |
| `orders` | `id (PK)`, `order_number (UK)`, `customer_name`, `status`, `delivery_type` | คำสั่งซื้อ |
| `order_items` | `id (PK)`, `order_id (FK)`, `menu_item_id (FK)`, `dressing_id (FK)`, `quantity` | รายการในออเดอร์ |
| `cart_sessions` | `session_id (PK, UUID)`, `created_at`, `last_accessed_at` | เซสชันตะกร้า |
| `cart_items` | `id (PK)`, `session_id (FK)`, `menu_item_id (FK)`, `dressing_id (FK)`, `quantity`, `item_notes` | สินค้าในตะกร้า |
| `store_status` | `id (PK)`, `is_open`, `current_sequence`, `restaurant_name`, `announcement_message` | สถานะร้าน, คิว, ชื่อร้าน, ประกาศ |
| `admin_users` | `id (PK)`, `username (UK)`, `password_hash`, `password_rotated_at` | แอดมิน |
| `admin_sessions` | `session_id (PK, UUID)`, `admin_id (FK)`, `expires_at` | เซสชันแอดมิน |
| `daily_reports` | `id (PK)`, `discord_message_id`, `created_at` | ประวัติส่งรายงาน Discord |

---

## 🛡️ กลไกความสมบูรณ์ของข้อมูล (Data Integrity & Optimization)

1. **Type-Safety ENUMs**
   - `delivery_type_enum`: `'รับเองที่ร้าน'`, `'จัดส่ง'`
   - `order_status_enum`: `'รอดำเนินการ'`, `'รับออเดอร์แล้ว'`, `'กำลังเตรียมอาหาร'`, `'พร้อมรับอาหาร'`, `'รับอาหารแล้ว'`, `'กำลังจัดส่ง'`, `'จัดส่งแล้ว'`, `'ยกเลิก'`
   - ป้องกันค่าสถานะผิดพลาดระดับ DB

2. **Composite Unique Constraint on `cart_items`**
   - `UNIQUE(session_id, menu_item_id, dressing_id)`: ป้องกันแถวซ้ำ บังคับอัปเดต `quantity`

3. **Foreign Key Constraints & Cascades**
   - `orders` -> `order_items` ใช้ `ON DELETE CASCADE` ล้างข้อมูลอัตโนมัติ

4. **Optimized Indexes**
   - `idx_orders_status` on `orders(status)`: เร่ง filter ออเดอร์แอดมิน
   - `idx_orders_created_at` on `orders(created_at)`: เร่ง sort ออเดอร์ล่าสุด
   - `idx_order_items_order_id`: เร่ง JOIN รายการอาหาร
   - `idx_cart_sessions_last_active` + `idx_admin_sessions_expires_at`: เร่ง cron cleanup session หมดอายุ

---

## 🚀 ความเข้ากันได้กับ Neon Serverless PostgreSQL

สคริปต์ `database/schema.sql` และ `backend/server.js` รันบน **Neon.tech** ได้ทันที:
- SSL connection (`sslmode=require`)
- Connection Pooling (PgBouncer)
- Seed Data พร้อมใช้ (admin user, categories, menu items, dressings)
