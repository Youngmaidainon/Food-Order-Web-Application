<div align="center">
  <h1>🗄️ Database Schema & Architecture - ร้านสปริงโรลออนไลน์</h1>
  <p>โครงสร้างฐานข้อมูล <strong>PostgreSQL</strong> ออกแบบตามหลัก Relational Integrity พร้อมการใช้ <strong>Custom ENUMs, Constraints, Cascades</strong> และ Indexes สำหรับ High-Performance Queries</p>
</div>

---

## 🏗️ โครงสร้างตารางและความสัมพันธ์ (Schema Design)

```mermaid
erDiagram
    categories ||--o{ menu_items : contains
    menu_items ||--o{ order_items : ordered_in
    menu_items ||--o{ cart_items : added_in
    dressings ||--o{ order_items : selected_in
    dressings ||--o{ cart_items : selected_in
    orders ||--|{ order_items : contains
    cart_sessions ||--o{ cart_items : holds
    admin_users ||--o{ admin_sessions : owns

    categories {
        serial id PK
        varchar name
    }
    menu_items {
        serial id PK
        int category_id FK
        varchar name
        text description
        numeric price
        varchar image_url
        boolean is_available
    }
    dressings {
        serial id PK
        varchar name
        boolean is_available
    }
    orders {
        serial id PK
        varchar order_number UK
        varchar customer_name
        varchar customer_phone
        delivery_type_enum delivery_type
        text delivery_address
        numeric total_amount
        order_status_enum status
        varchar discord_message_id
        varchar discord_cancel_message_id
        timestamp created_at
    }
    order_items {
        serial id PK
        int order_id FK
        int menu_item_id FK
        int dressing_id FK
        int quantity
        numeric price_per_unit
    }
    cart_sessions {
        uuid id PK
        timestamp created_at
        timestamp last_active
    }
    cart_items {
        serial id PK
        uuid session_id FK
        int menu_item_id FK
        int dressing_id FK
        int quantity
    }
    store_status {
        int id PK
        boolean is_open
        int current_sequence
        varchar restaurant_name
    }
    admin_users {
        serial id PK
        varchar username UK
        varchar password_hash
        timestamp created_at
        timestamp password_rotated_at
    }
    admin_sessions {
        uuid id PK
        int admin_id FK
        timestamp expires_at
        timestamp created_at
    }
    daily_reports {
        serial id PK
        date report_date UK
        varchar discord_message_id
        timestamp created_at
    }
```

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
