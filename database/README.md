<div align="center">
  <h1>🗄️ โครงสร้างฐานข้อมูล (Database Architecture & Schema)</h1>
  <p><strong>ระบบฐานข้อมูล PostgreSQL 17+ ออกแบบตามหลัก Relational Integrity, Custom ENUMs, Foreign Key Cascades, B-Tree Indexes สำหรับ High-Frequency Polling และระบบ Auto-Migration</strong></p>
</div>

---

## 📊 แผนภาพความสัมพันธ์ของข้อมูล (Entity-Relationship Diagram)

```mermaid
erDiagram
    categories ||--o{ menu_items : "contains (1:N)"
    orders ||--|{ order_items : "has (1:N)"
    menu_items ||--o{ order_items : "referenced in (1:N)"
    dressings ||--o{ order_items : "selected in (1:N)"
    
    cart_sessions ||--o{ cart_items : "holds (1:N)"
    menu_items ||--o{ cart_items : "added to (1:N)"
    dressings ||--o{ cart_items : "chosen for (1:N)"

    admin_users ||--o{ admin_sessions : "authenticates (1:N)"

    categories {
        int id PK
        varchar name
        int display_order
    }

    menu_items {
        int id PK
        int category_id FK
        varchar name
        text description
        int price
        text image_url
        boolean is_available
        timestamp created_at
    }

    dressings {
        int id PK
        varchar name
        boolean is_available
    }

    orders {
        int id PK
        varchar order_number UK
        varchar customer_name
        varchar customer_phone
        delivery_type_enum delivery_type
        text address
        order_status_enum status
        int total_amount
        text cancel_reason
        text canceled_by
        varchar discord_message_id
        varchar discord_cancel_message_id
        int sequence_number
        varchar ip_address
        varchar session_id
        order_status_enum previous_status
        timestamp cancelled_at
        timestamp deleted_at
        timestamp created_at
    }

    order_items {
        int id PK
        int order_id FK
        int menu_item_id FK
        int dressing_id FK
        int quantity
        int unit_price
        text item_notes
    }

    store_status {
        int id PK
        boolean is_open
        text announcement_message
        varchar restaurant_name
        varchar hero_title
        varchar hero_subtitle
        int current_sequence
    }

    admin_users {
        int id PK
        varchar username UK
        text password_hash
        timestamp password_rotated_at
        timestamp created_at
    }

    admin_sessions {
        uuid session_id PK
        int admin_id FK
        timestamp expires_at
        timestamp created_at
    }

    cart_sessions {
        uuid session_id PK
        timestamp created_at
        timestamp last_accessed_at
    }

    cart_items {
        int id PK
        uuid session_id FK
        int menu_item_id FK
        int dressing_id FK
        int quantity
        text item_notes
        timestamp created_at
    }

    daily_reports {
        int id PK
        varchar discord_message_id
        timestamp created_at
    }
```

---

## 📑 รายละเอียดโครงสร้างตาราง (Tables & Columns Specification)

### 1. `categories` (หมวดหมู่อาหาร)
* `id` (`SERIAL PRIMARY KEY`): รหัสหมวดหมู่
* `name` (`VARCHAR(100) NOT NULL`): ชื่อหมวดหมู่ (เช่น *สปริงโรล*, *สปริงโรลอโวคาโด้*)
* `display_order` (`INT DEFAULT 0`): ลำดับแสดงผลบนหน้าเว็บ

### 2. `menu_items` (รายการเมนูอาหาร)
* `id` (`SERIAL PRIMARY KEY`): รหัสเมนู
* `category_id` (`INT REFERENCES categories(id) ON DELETE SET NULL`): หมวดหมู่
* `name` (`VARCHAR(150) NOT NULL`): ชื่อเมนูอาหาร (เช่น *สปริงโรลแซลม่อน*)
* `description` (`TEXT`): รายละเอียดเมนู
* `price` (`INT NOT NULL`): ราคาจำหน่าย (บาท)
* `image_url` (`TEXT`): ไอคอนอีโมจิหรือ URL รูปภาพ
* `is_available` (`BOOLEAN DEFAULT TRUE`): สถานะเปิด/ปิดจำหน่าย
* `created_at` (`TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`): เวลาสร้าง

### 3. `dressings` (รายการน้ำสลัด)
* `id` (`SERIAL PRIMARY KEY`): รหัสน้ำสลัด (`0` = ไม่รับน้ำสลัด)
* `name` (`VARCHAR(100) NOT NULL`): ชือน้ำสลัด (เช่น *สลัดครีมซีฟู๊ด*)
* `is_available` (`BOOLEAN DEFAULT TRUE`): สถานะพร้อมให้บริการ

### 4. `orders` (คำสั่งซื้อของลูกค้า)
* `id` (`SERIAL PRIMARY KEY`): รหัสออเดอร์ภายใน
* `order_number` (`VARCHAR(50) UNIQUE NOT NULL`): รหัสออเดอร์แสดงลูกค้า (`ORD-YYYYMMDD-XXX`)
* `customer_name` (`VARCHAR(100) NOT NULL`): ชื่อลูกค้า (สูงสุด 50 ตัวอักษร)
* `customer_phone` (`VARCHAR(20) NOT NULL`): เบอร์โทรศัพท์ลูกค้า (9-10 หลัก)
* `delivery_type` (`delivery_type_enum NOT NULL`): `รับเองที่ร้าน` หรือ `จัดส่ง`
* `address` (`TEXT`): ที่อยู่จัดส่ง (จำเป็นเมื่อเลือก `จัดส่ง`)
* `status` (`order_status_enum NOT NULL DEFAULT 'รอดำเนินการ'`): สถานะออเดอร์
* `total_amount` (`INT NOT NULL`): ยอดเงินรวมทั้งสิ้น (บาท)
* `cancel_reason` (`TEXT DEFAULT NULL`): เหตุผลการยกเลิก (1-20 ตัวอักษร)
* `canceled_by` (`TEXT DEFAULT NULL`): ผู้ยกเลิก (`ลูกค้า` / `ร้านค้า`)
* `discord_message_id` (`VARCHAR(255) DEFAULT NULL`): Message ID แจ้งเตือนใน Discord
* `discord_cancel_message_id` (`VARCHAR(255) DEFAULT NULL`): Message ID แจ้งเตือนยกเลิก
* `sequence_number` (`INT NOT NULL`): ลำดับคิวประจำวัน (1, 2, 3...)
* `ip_address` (`VARCHAR(45) DEFAULT NULL`): IP Address ลูกค้า
* `session_id` (`VARCHAR(255) DEFAULT NULL`): Cart Session ID สำหรับตรวจสอบสิทธิ์
* `previous_status` (`order_status_enum DEFAULT NULL`): สถานะก่อนหน้าก่อนถูกยกเลิก
* `cancelled_at` (`TIMESTAMP WITH TIME ZONE DEFAULT NULL`): เวลายกเลิก
* `deleted_at` (`TIMESTAMP WITH TIME ZONE DEFAULT NULL`): เวลา Soft Delete
* `created_at` (`TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`): เวลาสั่งซื้อ

### 5. `order_items` (รายการอาหารในคำสั่งซื้อ)
* `id` (`SERIAL PRIMARY KEY`): รหัสรายการ
* `order_id` (`INT REFERENCES orders(id) ON DELETE CASCADE`): รหัสออเดอร์
* `menu_item_id` (`INT REFERENCES menu_items(id) ON DELETE CASCADE`): รหัสเมนู
* `quantity` (`INT NOT NULL CHECK (quantity > 0)`): จำนวนชิ้น
* `unit_price` (`INT NOT NULL`): ราคาต่อหน่วย ณ เวลาสั่งซื้อ
* `dressing_id` (`INT REFERENCES dressings(id) ON DELETE SET NULL`): รหัสน้ำสลัด
* `item_notes` (`TEXT`): หมายเหตุพิเศษ (เช่น ไม่ใส่ผักชี, แยกน้ำสลัด)

### 6. `store_status` (สถานะร้านค้าและลำดับคิว)
* `id` (`SERIAL PRIMARY KEY`): แถวเดียว (`id = 1`)
* `is_open` (`BOOLEAN DEFAULT TRUE`): เปิด/ปิดรับออเดอร์
* `announcement_message` (`TEXT DEFAULT ''`): ข้อความประกาศหน้าร้าน
* `restaurant_name` (`VARCHAR(100) DEFAULT 'ร้านสปริงโรลออนไลน์'`): ชื่อร้านค้า
* `hero_title` (`VARCHAR(150) DEFAULT '🥗 เมนูเพื่อสุขภาพสดใหม่'`): หัวข้อ Hero หน้าร้าน
* `hero_subtitle` (`VARCHAR(255) DEFAULT 'ผักสดกรอบ สะอาด อร่อยเต็มคำ — ทำสดใหม่ทุกออเดอร์'`): คำบรรยาย Hero
* `current_sequence` (`INT DEFAULT 0`): ลำดับคิวล่าสุดประจำวัน

### 7. `admin_users` (บัญชีผู้ดูแลระบบ)
* `id` (`SERIAL PRIMARY KEY`): รหัสผู้ดูแลระบบ
* `username` (`VARCHAR(50) UNIQUE NOT NULL`): ชื่อผู้ใช้งานแอดมิน
* `password_hash` (`TEXT NOT NULL`): รหัสผ่านเข้ารหัสด้วย bcrypt (Salt Rounds 12)
* `password_rotated_at` (`TIMESTAMP WITH TIME ZONE DEFAULT NULL`): เวลาเปลี่ยนรหัสผ่านล่าสุด
* `created_at` (`TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`): เวลาสร้างบัญชี

### 8. `admin_sessions` (เซสชันแอดมิน)
* `session_id` (`UUID PRIMARY KEY`): รหัสเซสชันแบบ UUIDv4
* `admin_id` (`INT REFERENCES admin_users(id) ON DELETE CASCADE`): รหัสแอดมินเจ้าของเซสชัน
* `expires_at` (`TIMESTAMP WITH TIME ZONE NOT NULL`): เวลาหมดอายุ (24 ชั่วโมง)
* `created_at` (`TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`): เวลาสร้างเซสชัน

### 9. `cart_sessions` (เซสชันตะกร้าลูกค้า)
* `session_id` (`UUID PRIMARY KEY`): รหัสเซสชันตะกร้าแบบ UUIDv4
* `created_at` (`TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`): เวลาสร้าง
* `last_accessed_at` (`TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`): เวลาใช้งานล่าสุด

### 10. `cart_items` (สินค้าในตะกร้า)
* `id` (`SERIAL PRIMARY KEY`): รหัสรายการ
* `session_id` (`UUID REFERENCES cart_sessions(session_id) ON DELETE CASCADE`): รหัสเซสชันตะกร้า
* `menu_item_id` (`INT REFERENCES menu_items(id) ON DELETE CASCADE`): รหัสเมนู
* `dressing_id` (`INT REFERENCES dressings(id) ON DELETE SET NULL`): รหัสน้ำสลัด
* `quantity` (`INT NOT NULL DEFAULT 1 CHECK (quantity > 0)`): จำนวนชิ้น
* `item_notes` (`TEXT`): หมายเหตุรายการ
* `created_at` (`TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`): เวลาเพิ่มลงตะกร้า

### 11. `daily_reports` (ประวัติรายงานสรุปยอด Discord)
* `id` (`SERIAL PRIMARY KEY`): รหัสบันทึกรายงาน
* `discord_message_id` (`VARCHAR(255) NOT NULL`): Message ID ใน Discord
* `created_at` (`TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`): เวลาที่ส่งรายงาน

---

## 🔒 ความสัมพันธ์และการ Cascade (Foreign Key Actions)

| ตารางต้นทาง (Child) | คอลัมน์ (FK) | ตารางปลายทาง (Parent) | พฤติกรรมเมื่อ Parent ถูกลบ (ON DELETE) |
|---|---|---|---|
| `menu_items` | `category_id` | `categories(id)` | `SET NULL` (คงเมนูไว้ ปลดหมวดหมู่) |
| `order_items` | `order_id` | `orders(id)` | `CASCADE` (ลบรายการอาหารตามออเดอร์) |
| `order_items` | `menu_item_id` | `menu_items(id)` | `CASCADE` *(ป้องกันการลบที่ Application Level)* |
| `order_items` | `dressing_id` | `dressings(id)` | `SET NULL` (คงรายการอาหาร ปลดน้ำสลัด) |
| `cart_items` | `session_id` | `cart_sessions(session_id)` | `CASCADE` (ล้างไอเทมเมื่อตะกร้าหมดอายุ) |
| `cart_items` | `menu_item_id` | `menu_items(id)` | `CASCADE` (ลบออกจากตะกร้าอัตโนมัติ) |
| `cart_items` | `dressing_id` | `dressings(id)` | `SET NULL` |
| `admin_sessions` | `admin_id` | `admin_users(id)` | `CASCADE` (ลบเซสชันเมื่อบัญชีถูกลบ) |

---

## 🔒 Custom PostgreSQL ENUMs

1. **`delivery_type_enum`**
   * `'รับเองที่ร้าน'`: ลูกค้ารับอาหารที่หน้าร้าน
   * `'จัดส่ง'`: ส่งเดลิเวอรี่ตามที่อยู่

2. **`order_status_enum`**
   * `'รอดำเนินการ'`: ออเดอร์ใหม่ รอร้านยืนยัน
   * `'รับออเดอร์แล้ว'`: ร้านยืนยันคิวแล้ว
   * `'กำลังเตรียมอาหาร'`: ครัวกำลังปรุงอาหาร
   * `'พร้อมรับอาหาร'`: ปรุงเสร็จแล้ว รอลูกค้ามารับ (Pickup Flow)
   * `'รับอาหารแล้ว'`: ลูกค้ารับอาหารเรียบร้อย (Pickup Flow - จบงาน)
   * `'กำลังจัดส่ง'`: ไรเดอร์กำลังนำส่ง (Delivery Flow)
   * `'จัดส่งแล้ว'`: ส่งมอบอาหารถึงมือแล้ว (Delivery Flow - จบงาน)
   * `'ยกเลิก'`: ออเดอร์ถูกยกเลิก (โดยลูกค้าหรือทางร้าน)

---

## ⚡ ดัชนีเพิ่มประสิทธิภาพ (B-Tree Indexes for Smart Polling)

ออกแบบครอบคลุม High-Frequency Polling (4s) และ Transaction คิวรี่ทั้งหมด:

```sql
-- 1. กรองสถานะออเดอร์หน้าแอดมิน (Admin Polling 4s)
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 2. เรียงลำดับออเดอร์ล่าสุด (ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 3. ตรวจสอบสถานะ Soft Delete ได้อย่างรวดเร็ว
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON orders(deleted_at);

-- 4. เร่งความเร็วการ JOIN รายการอาหารในออเดอร์
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 5. เร่งความเร็ว Cron Job ล้างตะกร้าที่หมดอายุ
CREATE INDEX IF NOT EXISTS idx_cart_sessions_last_active ON cart_sessions(last_accessed_at);

-- 6. เร่งความเร็ว Cron Job ล้างเซสชันแอดมินที่หมดอายุ
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- 7. Composite Index กรองสถานะพร้อมเรียงลำดับเวลา (หัวใจหลักของ Kitchen Kanban Polling)
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

-- 8. Partial Index กรองออเดอร์ของเซสชันที่ยังไม่ลบ (Customer Auto-Track Polling)
CREATE INDEX IF NOT EXISTS idx_orders_session_active ON orders(session_id) WHERE deleted_at IS NULL;

-- 9. Composite Index ป้องกันการสแกนตารางแบบ Full Scan เมื่อ JOIN
CREATE INDEX IF NOT EXISTS idx_order_items_composite ON order_items(order_id, menu_item_id);
```

---

## 🌱 ข้อมูลเริ่มต้นในระบบ (Default Seed Data)

1. **หมวดหมู่ (Categories)**:
   * `1`: สปริงโรล (`display_order: 1`)
   * `2`: สปริงโรลอโวคาโด้ (`display_order: 2`)

2. **เมนูอาหาร (Menu Items - 8 รายการ)**:
   * `1`: สปริงโรลแซลม่อน (🐟, 40 บาท)
   * `2`: สปริงโรลอโวคาโด้+แซลม่อน (🐟🥑, 40 บาท)
   * `3`: สปริงโรลกุ้ง (🦐, 35 บาท)
   * `4`: สปริงโรลอโวคาโด้+กุ้ง (🦐🥑, 35 บาท)
   * `5`: สปริงโรลอกไก่ (🐣, 35 บาท)
   * `6`: สปริงโรลอโวคาโด้+อกไก่ (🐣🥑, 35 บาท)
   * `7`: สปริงโรลปูอัด (🦀, 35 บาท)
   * `8`: สปริงโรลอโวคาโด้+ปูอัด (🦀🥑, 35 บาท)

3. **น้ำสลัด (Dressings - 5 ตัวเลือก)**:
   * `0`: ไม่รับน้ำสลัด (Default Fallback)
   * `1`: สลัดครีม
   * `2`: สลัดครีมซีฟู๊ด
   * `3`: ซีซาร์สลัด
   * `4`: สลัดเทาซันไอแลนด์

4. **สถานะร้านค้า (Store Status)**:
   * `is_open: true`, `announcement_message: 'เปิดรับออเดอร์ค่า 💖'`, `restaurant_name: 'ร้านสปริงโรลออนไลน์'`

---

## 🚀 การจัดการฐานข้อมูล & Auto-Migration

1. **Auto-Migration (`backend/server.js`)**:
   * ตอน Backend บูต ทดสอบการเชื่อมต่อ (`SELECT NOW()`)
   * รัน [schema.sql](schema.sql) อัตโนมัติ สร้างตาราง, ENUMs, Indexes, Seed Data และอัปเดต Sequences (`setval`) ทันทีหากยังไม่มี
   * สร้าง/อัปเดตรหัสผ่านเริ่มต้นของ `admin` จาก `.env`

2. **รันแมนนวลผ่าน Docker / psql**:
   ```bash
   docker compose exec db psql -U springroll -d springroll_db -f /docker-entrypoint-initdb.d/schema.sql
   ```
