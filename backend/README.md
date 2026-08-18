<div align="center">
  <h1>⚙️ ระบบบริการส่วนหลังบ้าน (Backend API Architecture)</h1>
  <p><strong>พัฒนาด้วย Node.js + Express.js ตามสถาปัตยกรรมแบบ Feature-First, ระบบตรวจสอบสิทธิ์ด้วยคุกกี้เซสชันปลอดภัย, การจำกัดอัตราคำขอ (Rate Limiting), ระบบ Connection Pool และสถาปัตยกรรม Smart Cache (HTTP 304 ETag)</strong></p>
</div>

---

## 🧩 สถาปัตยกรรมระดับซอร์สโค้ด (Feature-First Architecture)

```
backend/
├── Dockerfile                      # คำสั่งสร้าง Docker Image สำหรับรันเซิร์ฟเวอร์แบบ Production
├── package.json                    # รายการไลบรารีและคำสั่งสคริปต์ (Scripts)
├── render.yaml                     # ไฟล์คอนฟิก Deploy แบบ Infrastructure-as-Code บน Render
├── server.js                       # จุดเริ่มต้นบูตเซิร์ฟเวอร์, ตรวจสอบ Database Pool และ Auto-Migration
└── src/
    ├── discord.js                  # ระบบส่ง Webhook แจ้งเตือนและจัดการข้อความใน Discord
    ├── index.js                    # จุดรวม Express App, Middlewares, Rate Limiting และ Routes
    ├── admin/                      # ฟีเจอร์: การจัดการระบบแอดมินหลังบ้าน
    │   ├── admin_controller.js     # ตัวควบคุม Route หลักของแอดมิน (/api/admin)
    │   ├── analytics_controller.js # คำนวณและส่งคืนสถิติยอดขาย (Dashboard Analytics)
    │   ├── auth_controller.js      # จัดการ Login, Logout และตรวจสอบเซสชันแอดมิน
    │   ├── categories_controller.js# จัดการเพิ่ม ลบ แก้ไข หมวดหมู่อาหาร (CRUD)
    │   ├── dressings_controller.js # จัดการเพิ่ม ลบ แก้ไข รายการน้ำสลัด (CRUD)
    │   ├── menu_controller.js      # จัดการเพิ่ม ลบ แก้ไข รายการเมนูอาหาร (CRUD)
    │   └── orders_controller.js    # จัดการเปลี่ยนสถานะออเดอร์และรายงานสรุปยอด
    ├── cart/                       # ฟีเจอร์: ตะกร้าสินค้าของลูกค้า
    │   ├── cart_controller.js      # ตัวควบคุมรับคำขอดึงและอัปเดตตะกร้าสินค้า (/api/cart)
    │   ├── cart_middleware.js      # มิดเดิลแวร์ตรวจจับและสร้างเซสชันตะกร้าสินค้าอัตโนมัติ
    │   ├── cart_repository.js      # คำสั่ง SQL จัดการตาราง cart_sessions และ cart_items
    │   └── cart_service.js         # ตรรกะทางธุรกิจ (Business Logic) ตะกร้าสินค้า
    ├── config/                     # ฟีเจอร์: การตั้งค่าและการเชื่อมต่อฐานข้อมูล
    │   ├── config.js               # Centralized Config พร้อมระบบตรวจสอบ Fail-Fast
    │   └── database.js             # ตัวจัดการ Connection Pool เชื่อมต่อ PostgreSQL (pg.Pool)
    ├── cron/                       # ฟีเจอร์: งานบำรุงรักษาระบบอัตโนมัติ
    │   ├── cron_controller.js      # ตัวควบคุม Endpoint สำหรับรับคำขอจาก Cron Job (/internal/cron)
    │   ├── cron_repository.js      # คำสั่ง SQL ล้างเซสชันและข้อมูลที่หมดอายุ
    │   └── cron_service.js         # ตรรกะการทำความสะอาดฐานข้อมูลประจำวัน
    ├── dressings/                  # ฟีเจอร์: การดึงข้อมูลน้ำสลัดฝั่งลูกค้า
    │   ├── dressings_controller.js # ตัวควบคุมรับคำขอดึงรายการน้ำสลัดที่เปิดให้บริการ (/api/dressings)
    │   ├── dressings_repository.js # คำสั่ง SQL ดึงข้อมูลจากตาราง dressings
    │   └── dressings_service.js    # ตรรกะการตรวจสอบสถานะน้ำสลัด
    ├── menu/                       # ฟีเจอร์: การดึงข้อมูลเมนูอาหารฝั่งลูกค้า
    │   ├── menu_controller.js      # ตัวควบคุมรับคำขอดึงรายการเมนูและหมวดหมู่ (/api/menu)
    │   ├── menu_repository.js      # คำสั่ง SQL ดึงข้อมูลจากตาราง menu_items และ categories
    │   └── menu_service.js         # ตรรกะการจัดกลุ่มเมนูตามหมวดหมู่
    ├── orders/                     # ฟีเจอร์: คำสั่งซื้อและการติดตามสถานะ
    │   ├── orders_controller.js    # ตัวควบคุมรับคำสั่งซื้อและค้นหาสถานะออเดอร์ (/api/orders)
    │   ├── orders_repository.js    # คำสั่ง SQL จัดการตาราง orders และ order_items
    │   └── orders_service.js       # ตรรกะการสร้างออเดอร์, คิว, และแจ้งเตือน Discord
    ├── shared/                     # ส่วนประกอบและมิดเดิลแวร์ที่ใช้ร่วมกันทั่วทั้งระบบ
    │   ├── errors.js               # โครงสร้างคลาส Error เฉพาะทาง (มาตรฐาน RFC 9457)
    │   ├── logger.js               # ระบบ Structured JSON Logger ด้วย Pino
    │   ├── middleware/             # มิดเดิลแวร์ส่วนกลาง
    │   │   ├── auth.js             # ตรวจสอบความถูกต้องของคุกกี้เซสชันแอดมิน
    │   │   ├── errorHandler.js     # มิดเดิลแวร์ดักจับข้อผิดพลาดและจัดรูปแบบ Response
    │   │   ├── requestContext.js   # มิดเดิลแวร์แนบ Request ID และบันทึก Log คำขอ
    │   │   └── validate.js         # มิดเดิลแวร์ตรวจสอบความถูกต้องของข้อมูล (Validation)
    │   └── validators/             # สคีมาตรวจสอบโครงสร้างข้อมูลนำเข้า
    │       └── index.js            # กำหนดกฎเกณฑ์ความถูกต้องของข้อมูลแต่ละคำขอ
    └── store/                      # ฟีเจอร์: สถานะร้านค้าและคิวคำสั่งซื้อ
        ├── store_controller.js     # ตัวควบคุมรับคำขอดึงและอัปเดตสถานะร้านค้า (/api/store)
        ├── store_repository.js     # คำสั่ง SQL จัดการตาราง store_status และ sequence คิว
        └── store_service.js        # ตรรกะเปิด/ปิดร้าน, รีเซ็ตคิว และคำนวณยอดขายประจำวัน
```

---

## 🌐 รายการ API Endpoints ทั้งหมด (Complete API Reference)

### 1. หมวดหมู่ทั่วไปและการตรวจสอบสถานะ (General & Health)
| Method | Endpoint | คำอธิบาย | การตรวจสอบสิทธิ์ | Request Body | Response ตัวอย่าง |
|---|---|---|---|---|---|
| `GET` | `/api/health` | ตรวจสอบสถานะการทำงานของระบบ (Health Check) | สาธารณะ | - | `{"status":"ok","timestamp":"..."}` |

### 2. เมนูอาหารและน้ำสลัด (Menu & Dressings)
| Method | Endpoint | คำอธิบาย | การตรวจสอบสิทธิ์ | Request Body |
|---|---|---|---|---|
| `GET` | `/api/menu` | ดึงรายการเมนูอาหารทั้งหมดที่เปิดจำหน่าย | สาธารณะ | - |
| `GET` | `/api/dressings` | ดึงรายการน้ำสลัดทั้งหมดที่เปิดให้บริการ | สาธารณะ | - |

### 3. สถานะร้านค้า (Store Status)
| Method | Endpoint | คำอธิบาย | การตรวจสอบสิทธิ์ | Request Body |
|---|---|---|---|---|
| `GET` | `/api/store/status` | ดึงสถานะเปิด/ปิดร้าน, ชื่อร้าน, ข้อความประกาศ | สาธารณะ | - |

### 4. ตะกร้าสินค้า (Cart Sessions)
| Method | Endpoint | คำอธิบาย | การตรวจสอบสิทธิ์ | Request Body ตัวอย่าง |
|---|---|---|---|---|
| `GET` | `/api/cart` | ดึงรายการสินค้าในตะกร้าของเซสชันปัจจุบัน | Cart Session Cookie | - |
| `POST` | `/api/cart/items` | เพิ่มสินค้าลงในตะกร้า | Cart Session Cookie | `{"menu_item_id":1,"dressing_id":2,"quantity":1}` |
| `PATCH` | `/api/cart/items/:id` | แก้ไขจำนวนหรือหมายเหตุสินค้าในตะกร้า | Cart Session Cookie | `{"quantity":2,"item_notes":"ไม่ใส่ผักชี"}` |
| `DELETE` | `/api/cart/items/:id` | ลบสินค้าออกจากตะกร้า | Cart Session Cookie | - |
| `DELETE` | `/api/cart` | ล้างสินค้าทั้งหมดในตะกร้า | Cart Session Cookie | - |

### 5. คำสั่งซื้อและการติดตามสถานะ (Orders & Tracking)
| Method | Endpoint | คำอธิบาย | การตรวจสอบสิทธิ์ | Request Body ตัวอย่าง |
|---|---|---|---|---|
| `POST` | `/api/orders` | สร้างคำสั่งซื้อใหม่ | สาธารณะ | `{"customer_name":"สมชาย","customer_phone":"0812345678","delivery_type":"รับเองที่ร้าน","items":[...]}` |
| `GET` | `/api/orders/track/:order_number` | ค้นหาและดูสถานะคำสั่งซื้อ (Smart Polling 4s) | สาธารณะ (Masked PII) | - |
| `PATCH` | `/api/orders/:id/status` | ลูกค้ายกเลิกคำสั่งซื้อของตนเอง | สาธารณะ | `{"status":"ยกเลิก","cancel_reason":"ติดธุระด่วน"}` |

### 6. ระบบผู้ดูแลระบบ (Admin Portal Endpoints)
| Method | Endpoint | คำอธิบาย | การตรวจสอบสิทธิ์ |
|---|---|---|---|
| `POST` | `/api/admin/login` | เข้าสู่ระบบผู้ดูแลระบบ | Rate Limited (5 ครั้ง / 15 นาที) |
| `POST` | `/api/admin/logout` | ออกจากระบบผู้ดูแลระบบและลบเซสชัน | คุกกี้แอดมิน |
| `GET` | `/api/admin/me` | ตรวจสอบข้อมูลผู้ดูแลระบบปัจจุบัน | คุกกี้แอดมิน |
| `GET` | `/api/admin/analytics` | ดึงสถิติยอดขายวันนี้/เดือนนี้/ทั้งหมด (Smart Polling 15s) | คุกกี้แอดมิน |
| `GET` | `/api/admin/orders` | ดึงรายการคำสั่งซื้อทั้งหมด (Smart Polling 4s) | คุกกี้แอดมิน |
| `PATCH` | `/api/admin/orders/:id/status` | อัปเดตสถานะคำสั่งซื้อ (เช่น กำลังเตรียม, จัดส่งแล้ว) | คุกกี้แอดมิน |
| `PATCH` | `/api/admin/store/status` | เปิด/ปิดร้านค้า, แก้ไขชื่อร้าน และข้อความประกาศ | คุกกี้แอดมิน |
| `POST` | `/api/admin/store/reset-queue` | สรุปรายงานยอดขาย ส่งเข้า Discord และรีเซ็ตคิว | คุกกี้แอดมิน |
| `POST` | `/api/admin/menu` | เพิ่มรายการเมนูอาหารใหม่ | คุกกี้แอดมิน |
| `PUT` | `/api/admin/menu/:id` | แก้ไขข้อมูลเมนูอาหาร | คุกกี้แอดมิน |
| `DELETE` | `/api/admin/menu/:id` | ลบรายการเมนูอาหาร | คุกกี้แอดมิน |
| `POST` | `/api/admin/dressings` | เพิ่มรายการน้ำสลัดใหม่ | คุกกี้แอดมิน |
| `PUT` | `/api/admin/dressings/:id` | แก้ไขข้อมูลน้ำสลัด | คุกกี้แอดมิน |
| `DELETE` | `/api/admin/dressings/:id` | ลบรายการน้ำสลัด | คุกกี้แอดมิน |

### 7. ระบบ Cron Job ภายใน (Internal Cron)
| Method | Endpoint | คำอธิบาย | การตรวจสอบสิทธิ์ |
|---|---|---|---|
| `POST` | `/internal/cron/maintenance` | ล้างเซสชันตะกร้าและเซสชันแอดมินที่หมดอายุ | Header: `Authorization: Bearer <CRON_SECRET>` |

---

## 🛡️ ชั้นความปลอดภัยและการจัดการข้อผิดพลาด (Security & Error Standards)

1. **การตั้งค่าส่วนกลางพร้อมระบบ Fail-Fast (`src/config/config.js`)**
   - ตรวจสอบความถูกต้องของ Environment Variables สำคัญทั้งหมด (`DATABASE_URL`, `JWT_SECRET`, `CRON_SECRET`) ตั้งแต่เริ่มบูตเซิร์ฟเวอร์ และหยุดการทำงานทันทีหากพบว่าค่าสำคัญขาดหายไป

2. **โครงสร้างคลาส Error เฉพาะทาง (มาตรฐาน RFC 9457 Problem Details)**
   - คลาสข้อผิดพลาดเฉพาะทางใน `src/shared/errors.js`:
     - `NotFoundError` (404)
     - `ValidationError` (400)
     - `UnauthorizedError` (401)
     - `ForbiddenError` (403)
     - `ConflictError` (409)
   - `globalErrorHandler` จัดรูปแบบการตอบกลับเป็น JSON มาตรฐาน พร้อมซ่อน Stack Trace เมื่อทำงานบน Production

3. **ระบบบันทึก Log เชิงโครงสร้างแบบ JSON (`src/shared/logger.js` และ `requestContext.js`)**
   - สร้าง `requestId` แบบ UUIDv4 แนบไปกับทุกคำขอ เพื่อให้สามารถตรวจสอบประวัติ Log ย้อนหลังได้อย่างแม่นยำ

4. **การป้องกันการโจมตีและการจำกัดอัตราคำขอ (Rate Limiting & Security Headers)**
   - `Helmet`: ป้องกัน Clickjacking, XSS, MIME Sniffing และกำหนดนโยบายความปลอดภัย
   - `CORS`: กำหนด Whitelist เฉพาะโดเมนที่ระบุใน `CORS_ORIGIN`
   - `Admin Login Rate Limiter`: จำกัด 5 ครั้ง / 15 นาที ป้องกัน Brute-Force Password
   - `Track Order Rate Limiter`: จำกัด 300 ครั้ง / 15 นาที รองรับการ Polling สถานะออเดอร์
   - `Store Status Rate Limiter`: จำกัด 300 ครั้ง / 15 นาที รองรับการ Polling สถานะร้าน
   - `General API Rate Limiter`: จำกัด 600 ครั้ง / 15 นาที ป้องกัน DoS และ Scraper

---

## 🤖 ระบบ Smart Cache และการแจ้งเตือน Discord (Smart Cache & Discord Engine)

### 1. สถาปัตยกรรม Smart Cache (HTTP 304 Not Modified & ETag)
- เปิดใช้งาน `ETag` (`app.set('etag', 'strong')`)
- เมื่อเบราว์เซอร์ส่งคำขอ Polling พร้อม `If-None-Match: <etag>` หากข้อมูลในฐานข้อมูลยังไม่มีการเปลี่ยนแปลง Express จะส่งกลับสถานะ `304 Not Modified` ทันทีโดยไม่ต้องส่ง Body ซ้ำ
- ลดทราฟฟิกเครือข่ายและประหยัดซีพียูเซิร์ฟเวอร์อย่างมีนัยสำคัญ

### 2. Discord Webhook Notifications (`src/discord.js`)
- **แจ้งเตือนออเดอร์ใหม่**: ส่งการ์ด Embed แสดงรายการอาหาร, น้ำสลัด, ยอดเงิน, รูปแบบการจัดส่ง และเบอร์โทร
- **แจ้งเตือนการยกเลิกออเดอร์**: แก้ไขข้อความเดิมพร้อมสั่งลบข้อความเก่าภายใน 5 วินาที และส่งการ์ดแจ้งเตือนการยกเลิกใหม่เพื่อป้องกันครัวทำซ้ำ
- **รายงานสรุปยอดขายประจำวัน**: สรุปยอดขายรวม, จำนวนออเดอร์สำเร็จ/ยกเลิก และเมนูขายดีประจำวัน ส่งเข้า Discord ทันทีเมื่อปิดร้าน

---

## 🚀 การตั้งค่า Environment Variables (`backend/.env`)

| ตัวแปร (Variable) | ตัวอย่างค่า (Example) | ความสำคัญ | คำอธิบาย |
|---|---|---|---|
| `PORT` | `8000` | ตัวเลือก (Optional) | พอร์ตที่เซิร์ฟเวอร์เปิดรับคำขอ (ค่าเริ่มต้น: 8000) |
| `NODE_ENV` | `production` | สำคัญ (Required) | โหมดการทำงาน (`development` หรือ `production`) |
| `DATABASE_URL` | `postgres://user:pass@host/db?sslmode=require` | สำคัญมาก (Required) | Connection String ฐานข้อมูล PostgreSQL |
| `JWT_SECRET` | `your_super_secret_jwt_key_here` | สำคัญมาก (Required) | กุญแจลับสำหรับลงนาม JWT Session |
| `CRON_SECRET` | `your_super_secret_cron_token_here` | สำคัญมาก (Required) | โทเค็นความปลอดภัยสำหรับ Endpoint บำรุงรักษาระบบ |
| `CORS_ORIGIN` | `https://your-app.vercel.app,http://localhost:5173` | สำคัญมาก (Required) | โดเมน Frontend ที่อนุญาตให้เชื่อมต่อ (คั่นด้วยจุลภาค) |
| `ADMIN_INIT_USERNAME` | `admin` | ตัวเลือก (Optional) | ชื่อผู้ใช้งานแอดมินเริ่มต้น |
| `ADMIN_INIT_PASSWORD` | `adminpassword` | ตัวเลือก (Optional) | รหัสผ่านแอดมินเริ่มต้น |
| `DISCORD_WEBHOOK_URL` | `https://discord.com/api/webhooks/...` | ตัวเลือก (Optional) | Webhook แจ้งเตือนออเดอร์ใหม่ |
| `DISCORD_CANCEL_WEBHOOK_URL`| `https://discord.com/api/webhooks/...` | ตัวเลือก (Optional) | Webhook แจ้งเตือนยกเลิกออเดอร์ |
| `DISCORD_REPORT_WEBHOOK_URL`| `https://discord.com/api/webhooks/...` | ตัวเลือก (Optional) | Webhook ส่งสรุปยอดขายประจำวัน |

