<div align="center">
  <h1>⚙️ ระบบบริการส่วนหลังบ้าน (Backend API Architecture)</h1>
  <p><strong>พัฒนาด้วย Node.js (ESM) + Express.js สถาปัตยกรรม Feature-First ระบบตรวจสอบสิทธิ์เซสชันคุกกี้ Rate Limiting, Database Connection Pool, Zod Validation และ Smart Cache (HTTP 304 ETag)</strong></p>
</div>

---

## 🧩 สถาปัตยกรรมซอร์สโค้ด (Feature-First Architecture)

```
backend/
├── Dockerfile                      # คำสั่งสร้าง Docker Image สำหรับ Production
├── package.json                    # รายการไลบรารีและ Scripts
├── server.js                       # บูตเซิร์ฟเวอร์, ตรวจ Database Pool & Auto-Migration
└── src/
    ├── discord.js                  # ระบบส่ง Webhook แจ้งเตือน (#orders, #cancels, #reports)
    ├── index.js                    # Express App, Security Middlewares, Rate Limiting, Routes
    ├── admin/                      # ฟีเจอร์: การจัดการระบบแอดมินหลังบ้าน
    │   ├── admin_controller.js     # Router รวมของแอดมิน (/api/admin)
    │   ├── analytics_controller.js # คำนวณสถิติยอดขายรอบปัจจุบัน/วัน/เดือน/รวม (Dashboard Analytics)
    │   ├── auth_controller.js      # จัดการ Login, Logout และตรวจสอบเซสชันแอดมิน
    │   ├── categories_controller.js# CRUD หมวดหมู่อาหาร
    │   ├── dressings_controller.js # CRUD รายการน้ำสลัด
    │   ├── menu_controller.js      # CRUD รายการเมนูอาหาร
    │   └── orders_controller.js    # จัดการเปลี่ยนสถานะออเดอร์ (Workflow), Soft Delete
    ├── cart/                       # ฟีเจอร์: ตะกร้าสินค้าของลูกค้า
    │   ├── cart_controller.js      # Router ตะกร้าสินค้า (/api/cart)
    │   ├── cart_middleware.js      # ตรวจจับและสร้าง Guest Session ตะกร้าสินค้าอัตโนมัติ
    │   ├── cart_repository.js      # คำสั่ง SQL ตาราง cart_sessions และ cart_items
    │   └── cart_service.js         # ตรรกะทางธุรกิจตะกร้าสินค้า
    ├── config/                     # ฟีเจอร์: การตั้งค่าและการเชื่อมต่อฐานข้อมูล
    │   ├── config.js               # Centralized Config พร้อมระบบ Fail-Fast
    │   └── database.js             # pg.Pool พร้อม Dynamic SSL และ Helper คิวรี่
    ├── dressings/                  # ฟีเจอร์: ข้อมูลน้ำสลัดฝั่งลูกค้า
    │   ├── dressings_controller.js # Router ดึงน้ำสลัดที่พร้อมให้บริการ (/api/dressings)
    │   ├── dressings_repository.js # คำสั่ง SQL ตาราง dressings
    │   └── dressings_service.js    # ตรรกะตรวจสอบสถานะน้ำสลัด
    ├── menu/                       # ฟีเจอร์: ข้อมูลเมนูอาหารฝั่งลูกค้า
    │   ├── menu_controller.js      # Router ดึงเมนูและหมวดหมู่ (/api/menu)
    │   ├── menu_repository.js      # คำสั่ง SQL ตาราง menu_items และ categories
    │   └── menu_service.js         # ตรรกะจัดกลุ่มเมนูตามหมวดหมู่
    ├── orders/                     # ฟีเจอร์: คำสั่งซื้อและการติดตามสถานะ
    │   ├── orders_controller.js    # Router รับคำสั่งซื้อและค้นหาสถานะ (/api/orders)
    │   ├── orders_repository.js    # คำสั่ง SQL ตาราง orders และ order_items
    │   └── orders_service.js       # ตรรกะสร้างออเดอร์, คิว, Anti-Spam, แจ้งเตือน Discord
    ├── shared/                     # มิดเดิลแวร์และโมดูลส่วนกลาง
    │   ├── errors.js               # โครงสร้าง Error คลาส (RFC 9457 Problem Details)
    │   ├── logger.js               # Structured JSON Logger (Pino)
    │   ├── middleware/             # auth.js, errorHandler.js, requestContext.js, validate.js
    │   └── validators/             # index.js (Zod Validation Schemas)
    └── store/                      # ฟีเจอร์: สถานะร้านค้าและคิวคำสั่งซื้อ
        ├── store_controller.js     # Router สถานะร้านค้า (/api/store)
        ├── store_repository.js     # คำสั่ง SQL ตาราง store_status และ sequence คิว
        └── store_service.js        # ตรรกะเปิด/ปิดร้าน, รีเซ็ตคิว, สรุปยอดขาย
```

---

## 🌐 รายการ API Endpoints ทั้งหมด (Complete API Reference)

### 1. หมวดทั่วไปและตรวจสอบสถานะ (General & Health)
| Method | Endpoint | คำอธิบาย | สิทธิ์ | Rate Limit |
|---|---|---|---|---|
| `GET` / `HEAD` | `/api/health` | ตรวจสอบสถานะเซิร์ฟเวอร์ (Health Check & Keep-Alive) | สาธารณะ | ไม่จำกัด (Skip) |
| `HEAD` | `/` | Root Health Check สำหรับ Uptime Monitor | สาธารณะ | ไม่จำกัด (Skip) |

### 2. เมนูอาหารและน้ำสลัด (Menu & Dressings)
| Method | Endpoint | คำอธิบาย | สิทธิ์ | Response ตัวอย่าง |
|---|---|---|---|---|
| `GET` | `/api/menu` | ดึงรายการเมนูอาหารที่เปิดจำหน่าย จัดกลุ่มตามหมวดหมู่ | สาธารณะ | `{"success":true,"data":[{"id":1,"name":"สปริงโรลแซลม่อน","price":40,...}]}` |
| `GET` | `/api/dressings` | ดึงรายการน้ำสลัดที่เปิดให้บริการ | สาธารณะ | `{"success":true,"data":[{"id":0,"name":"ไม่รับน้ำสลัด"},...]}` |

### 3. สถานะร้านค้า (Store Status)
| Method | Endpoint | คำอธิบาย | สิทธิ์ | Rate Limit |
|---|---|---|---|---|
| `GET` | `/api/store/status` | ดึงสถานะเปิด/ปิดร้าน, ชื่อร้าน, ข้อความประกาศ, คิวล่าสุด | สาธารณะ | 300 / 15 นาที |

### 4. ตะกร้าสินค้า (Cart Sessions - Rate Limit: 150 / 15 นาที)
| Method | Endpoint | คำอธิบาย | Cookie | Request Body ตัวอย่าง |
|---|---|---|---|---|
| `GET` | `/api/cart` | ดึงรายการสินค้าในตะกร้า | Cart Session | - |
| `POST` | `/api/cart/add` | เพิ่มสินค้าลงตะกร้า | Cart Session | `{"menu_item_id":1,"dressing_id":2,"quantity":1,"item_notes":""}` |
| `PUT` | `/api/cart/update/:id` | ปรับปรุงจำนวนสินค้าในตะกร้า | Cart Session | `{"quantity":2}` |
| `DELETE` | `/api/cart/remove/:id` | ลบสินค้า 1 รายการออกจากตะกร้า | Cart Session | - |
| `DELETE` | `/api/cart/clear` | ล้างสินค้าทั้งหมดในตะกร้า | Cart Session | - |

### 5. คำสั่งซื้อและการติดตามสถานะ (Orders & Tracking)
| Method | Endpoint | คำอธิบาย | Rate Limit | Request Body ตัวอย่าง |
|---|---|---|---|---|
| `POST` | `/api/orders` | สร้างคำสั่งซื้อใหม่ (Anti-Spam 1 ออเดอร์/เบอร์) | 10 / 15 นาที | `{"customer_name":"สมชาย","customer_phone":"0812345678","delivery_type":"รับเองที่ร้าน","items":[{"menu_item_id":1,"dressing_id":0,"quantity":2}]}` |
| `GET` | `/api/orders/track/:order_number` | ดูสถานะออเดอร์ (Smart Polling 4s, PII Masked) | 300 / 15 นาที | - |
| `PATCH` | `/api/orders/:id/status` | ลูกค้ายกเลิกออเดอร์ตนเอง (เฉพาะสถานะ `รอดำเนินการ`) | 5 / 15 นาที | `{"status":"ยกเลิก","cancel_reason":"ติดธุระด่วน"}` |

### 6. ระบบผู้ดูแลระบบ (Admin Portal Endpoints - สิทธิ์: คุกกี้แอดมิน)
| Method | Endpoint | คำอธิบาย | Rate Limit / หมายเหตุ |
|---|---|---|---|
| `POST` | `/api/admin/login` | เข้าสู่ระบบผู้ดูแลระบบ | 5 / 15 นาที (Brute Force Protection) |
| `POST` | `/api/admin/logout` | ออกจากระบบและลบเซสชัน | คุกกี้แอดมิน |
| `GET` | `/api/admin/me` | ตรวจสอบเซสชันผู้ดูแลระบบปัจจุบัน | คุกกี้แอดมิน |
| `GET` | `/api/admin/analytics` | สถิติยอดขาย Active Batch, วันนี้, เดือนนี้, รวม และ Top 5 | Smart Polling 15s |
| `GET` | `/api/admin/orders` | ดึงรายการออเดอร์ (Query: `status`, `sort`, `page`, `limit`) | Smart Polling 4s |
| `PATCH` | `/api/admin/orders/:id/status` | เปลี่ยนสถานะออเดอร์ตาม Workflow State Machine | บังคับลำดับขั้นตอน |
| `DELETE` | `/api/admin/orders/:id` | Soft Delete ออเดอร์ (`deleted_at = NOW()`) | คุกกี้แอดมิน |
| `PATCH` | `/api/admin/store/status` | เปิด/ปิดร้านค้า, แก้ไขชื่อร้าน, ประกาศ | คุกกี้แอดมิน |
| `POST` | `/api/admin/store/reset-queue` | สรุปยอดขายส่งเข้า Discord (#reports) และรีเซ็ตคิว | คุกกี้แอดมิน |
| `GET` | `/api/admin/categories` | ดึงรายการหมวดหมู่ทั้งหมด | คุกกี้แอดมิน |
| `POST` | `/api/admin/categories` | เพิ่มหมวดหมู่ใหม่ | Request: `{"name":"...","display_order":1}` |
| `PUT` | `/api/admin/categories/:id` | แก้ไขชื่อและลำดับหมวดหมู่ | คุกกี้แอดมิน |
| `DELETE` | `/api/admin/categories/:id` | ลบหมวดหมู่ (ไม่อนุญาตหากมีเมนูอยู่ในหมวด) | คุกกี้แอดมิน |
| `GET` | `/api/admin/menu` | ดึงรายการเมนูอาหารทั้งหมด (รวมที่ปิดจำหน่าย) | คุกกี้แอดมิน |
| `POST` | `/api/admin/menu` | เพิ่มรายการเมนูอาหารใหม่ | Request: `{"name":"...","price":40,...}` |
| `PUT` | `/api/admin/menu/:id` | แก้ไขข้อมูลเมนูอาหาร | คุกกี้แอดมิน |
| `DELETE` | `/api/admin/menu/:id` | ลบเมนูอาหาร (ไม่อนุญาตหากเคยมีประวัติถูกสั่งซื้อ) | คุกกี้แอดมิน |
| `GET` | `/api/admin/dressings` | ดึงรายการน้ำสลัดทั้งหมด | คุกกี้แอดมิน |
| `POST` | `/api/admin/dressings` | เพิ่มรายการน้ำสลัดใหม่ | Request: `{"name":"...","is_available":true}` |
| `PUT` | `/api/admin/dressings/:id` | แก้ไขข้อมูลน้ำสลัด | คุกกี้แอดมิน |
| `DELETE` | `/api/admin/dressings/:id` | ลบน้ำสลัด (ไม่อนุญาตให้ลบ id=0 หรือมีประวัติถูกสั่ง) | คุกกี้แอดมิน |

---

## 🛡️ มาตรฐานความปลอดภัยและข้อผิดพลาด (Security & Error Standards)

1. **Fail-Fast Configuration (`src/config/config.js`)**
   * ตรวจสอบค่าจำเป็น (`DATABASE_URL`, `JWT_SECRET`) เมื่อเริ่มบูต หยุดทันทีหากค่าไม่ครบ

2. **RFC 9457 Problem Details (`src/shared/errors.js`)**
   * คลาส Error เฉพาะทาง: `NotFoundError` (404), `ValidationError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `ConflictError` (409)
   * `globalErrorHandler` ตอบกลับเป็น JSON มาตรฐาน พร้อมซ่อน Stack Trace บน Production

3. **Database Connection Pool Optimization (`src/config/database.js`)**
   * `max: 10`: จำกัดขนาด Pool เหมาะสำหรับ Cloud Database Free Tier (Neon)
   * `idleTimeoutMillis: 30000`: ปิด Connection ที่ไม่ใช้งานใน 30 วินาที
   * `connectionTimeoutMillis: 5000`: ตัดการเชื่อมต่อทันทีหาก DB ไม่ตอบสนองใน 5s (Fail-Fast)
   * Dynamic SSL: เปิด SSL อัตโนมัติเมื่อเชื่อมต่อกับ Cloud Database ภายนอก

4. **Structured JSON Logging (`src/shared/logger.js`, `requestContext.js`)**
   * แนบ `requestId` (UUIDv4) ในทุก Request เพื่อตรวจสอบ Log ย้อนหลังได้แม่นยำ

5. **PII Masking**
   * บน `GET /api/orders/track/:order_number` หากไม่ใช่แอดมินและไม่ใช่เจ้าของเซสชัน ซ่อนฟิลด์ `customer_name`, `customer_phone`, `address` เป็น `'*** ข้อมูลถูกซ่อนเพื่อความปลอดภัย ***'`

---

## 🤖 ระบบ Smart Cache และ Discord Engine

### 1. Smart Cache (HTTP 304 & ETag)
* เปิดใช้ Strong ETag (`app.set('etag', 'strong')`)
* เมื่อไคลเอนต์ Polling ด้วย `If-None-Match: <etag>` หากข้อมูลไม่เปลี่ยน ส่งกลับ `304 Not Modified` ทันทีโดยไม่มี Body
* ประหยัด Bandwidth และลดโหลด CPU ได้มากกว่า 95%

### 2. Discord Webhook Notifications (`src/discord.js`)
* **แจ้งเตือนออเดอร์ใหม่ (`DISCORD_WEBHOOK_URL`)**: การ์ดสีฟ้า Embed รวมรายการอาหาร, น้ำสลัด, โน้ตพิเศษ, ยอดเงิน, รูปแบบจัดส่ง, เบอร์โทร
* **แจ้งเตือนยกเลิกออเดอร์ (`DISCORD_CANCEL_WEBHOOK_URL`)**: แก้ไขข้อความเดิมพร้อมลบใน 5s และส่งการ์ดสีแดงแจ้งเตือนยกเลิกใหม่ ป้องกันครัวทำซ้ำ
* **รายงานสรุปยอดประจำวัน (`DISCORD_REPORT_WEBHOOK_URL`)**: ส่งการ์ดสีเขียวมรกต สรุปยอดขายรวม, จำนวนออเดอร์, เมนูขายดี ส่งเข้า Discord อัตโนมัติเมื่อปิดร้าน

---

## 🚀 ตัวแปรสภาพแวดล้อม (`backend/.env`)

| ตัวแปร (Variable) | ตัวอย่างค่า (Example) | ความสำคัญ | คำอธิบาย |
|---|---|---|---|
| `PORT` | `8000` | ตัวเลือก | พอร์ตเซิร์ฟเวอร์ (ค่าเริ่มต้น: 8000) |
| `NODE_ENV` | `production` | สำคัญ | โหมดทำงาน (`development` / `production`) |
| `DATABASE_URL` | `postgres://user:pass@host/db?sslmode=require` | จำเป็น | Connection String ฐานข้อมูล PostgreSQL |
| `JWT_SECRET` | `your_super_secret_jwt_key_here` | จำเป็น | กุญแจลับลงนาม JWT Session (32 ตัวอักษรขึ้นไป) |
| `CORS_ORIGIN` | `https://your-app.vercel.app,http://localhost:5173` | จำเป็น | โดเมน Frontend ที่อนุญาต (คั่นด้วยจุลภาค) |
| `ALLOW_DYNAMIC_CORS` | `false` | ตัวเลือก | อนุญาตทุก Origin อัตโนมัติ (`true`/`false`) |
| `ADMIN_INIT_USERNAME` | `admin` | ตัวเลือก | ชื่อแอดมินเริ่มต้นสำหรับการล็อกอินครั้งแรก |
| `ADMIN_INIT_PASSWORD` | `YourStrongPassword123` | ตัวเลือก | รหัสผ่านแอดมินเริ่มต้น (จะถูก Hash ด้วย bcrypt ทันที) |
| `DISCORD_WEBHOOK_URL` | `https://discord.com/api/webhooks/...` | ตัวเลือก | Webhook แจ้งเตือนออเดอร์ใหม่ (#orders) |
| `DISCORD_CANCEL_WEBHOOK_URL`| `https://discord.com/api/webhooks/...` | ตัวเลือก | Webhook แจ้งเตือนยกเลิกออเดอร์ (#cancels) |
| `DISCORD_REPORT_WEBHOOK_URL`| `https://discord.com/api/webhooks/...` | ตัวเลือก | Webhook สรุปยอดขายประจำวัน (#reports) |
