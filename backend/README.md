<div align="center">
  <h1>⚙️ ระบบบริการส่วนหลังบ้าน (Backend API) - ร้านสปริงโรลออนไลน์</h1>
  <p><strong>พัฒนาด้วย Node.js + Express.js ตามสถาปัตยกรรมแบบ Feature-First, ระบบตรวจสอบสิทธิ์ด้วยเซสชัน, การจำกัดอัตราคำขอ (Rate Limiting), ระบบ Connection Pool และการสตรีมข้อมูลแบบเรียลไทม์ (SSE)</strong></p>
</div>

---

## 🧩 สถาปัตยกรรมระดับซอร์สโค้ด (Feature-First Architecture)

```
backend/
├── Dockerfile                      # คำสั่งสร้าง Docker Image สำหรับรันเซิร์ฟเวอร์
├── package.json                    # รายการไลบรารีและ Dependencies
├── render.yaml                     # ไฟล์คอนฟิก Deploy แบบ Infrastructure-as-Code บน Render
├── server.js                       # จุดเริ่มต้นบูตเซิร์ฟเวอร์, ตรวจสอบ Database และ Auto-Migration
└── src/
    ├── discord.js                  # ระบบเชื่อมต่อและส่ง Webhook แจ้งเตือนเข้า Discord
    ├── index.js                    # จุดรวม Express App, Middlewares, Rate Limiting และ Routes
    ├── admin/                      # ฟีเจอร์: การจัดการระบบแอดมินหลังบ้าน
    │   ├── admin_controller.js     # ตัวควบคุม Route หลักของแอดมิน
    │   ├── analytics_controller.js # คำนวณและส่งคืนสถิติยอดขาย (Dashboard Analytics)
    │   ├── auth_controller.js      # จัดการ Login, Logout และตรวจสอบเซสชันแอดมิน
    │   ├── categories_controller.js# จัดการเพิ่ม ลบ แก้ไข หมวดหมู่อาหาร
    │   ├── dressings_controller.js # จัดการเพิ่ม ลบ แก้ไข รายการน้ำสลัด
    │   ├── events_controller.js    # สตรีม SSE สำหรับแจ้งเตือนออเดอร์ใหม่เข้าแอดมิน
    │   ├── menu_controller.js      # จัดการเพิ่ม ลบ แก้ไข รายการเมนูอาหาร
    │   └── orders_controller.js    # จัดการเปลี่ยนสถานะออเดอร์และรายงานสรุปยอด
    ├── cart/                       # ฟีเจอร์: ตะกร้าสินค้าของลูกค้า
    │   ├── cart_controller.js      # ตัวควบคุมรับคำขอดึงและอัปเดตตะกร้าสินค้า
    │   ├── cart_middleware.js      # มิดเดิลแวร์ตรวจจับและสร้างเซสชันตะกร้าสินค้า
    │   ├── cart_repository.js      # คำสั่ง SQL จัดการตาราง cart_sessions และ cart_items
    │   └── cart_service.js         # ตรรกะทางธุรกิจ (Business Logic) ตะกร้าสินค้า
    ├── config/                     # ฟีเจอร์: การตั้งค่าและการเชื่อมต่อฐานข้อมูล
    │   ├── config.js               # Centralized Config พร้อมระบบตรวจสอบ Fail-Fast
    │   └── database.js             # ตัวจัดการ Connection Pool เชื่อมต่อ PostgreSQL
    ├── cron/                       # ฟีเจอร์: งานบำรุงรักษาระบบอัตโนมัติ
    │   ├── cron_controller.js      # ตัวควบคุม Endpoint สำหรับรับคำขอจาก Cron Job
    │   ├── cron_repository.js      # คำสั่ง SQL ล้างเซสชันและข้อมูลที่หมดอายุ
    │   └── cron_service.js         # ตรรกะการทำความสะอาดฐานข้อมูลประจำวัน
    ├── dressings/                  # ฟีเจอร์: การดึงข้อมูลน้ำสลัดฝั่งลูกค้า
    │   ├── dressings_controller.js # ตัวควบคุมรับคำขอดึงรายการน้ำสลัดที่เปิดให้บริการ
    │   ├── dressings_repository.js # คำสั่ง SQL ดึงข้อมูลจากตาราง dressings
    │   └── dressings_service.js    # ตรรกะการตรวจสอบสถานะน้ำสลัด
    ├── menu/                       # ฟีเจอร์: การดึงข้อมูลเมนูอาหารฝั่งลูกค้า
    │   ├── menu_controller.js      # ตัวควบคุมรับคำขอดึงรายการเมนูและหมวดหมู่
    │   ├── menu_repository.js      # คำสั่ง SQL ดึงข้อมูลจากตาราง menu_items และ categories
    │   └── menu_service.js         # ตรรกะการจัดกลุ่มเมนูตามหมวดหมู่
    ├── orders/                     # ฟีเจอร์: คำสั่งซื้อและการติดตามสถานะ
    │   ├── events_controller.js    # สตรีม SSE อัปเดตสถานะออเดอร์แบบเรียลไทม์ส่งตรงถึงลูกค้า
    │   ├── orders_controller.js    # ตัวควบคุมรับคำสั่งซื้อและค้นหาสถานะออเดอร์
    │   ├── orders_repository.js    # คำสั่ง SQL จัดการตาราง orders และ order_items
    │   └── orders_service.js       # ตรรกะการสร้างออเดอร์, คิว, และแจ้งเตือน Discord
    ├── shared/                     # ส่วนประกอบและมิดเดิลแวร์ที่ใช้ร่วมกันทั่วทั้งระบบ
    │   ├── errors.js               # โครงสร้างคลาส Error เฉพาะทาง (มาตรฐาน RFC 9457)
    │   ├── logger.js               # ระบบ Structured JSON Logger ด้วย Pino
    │   ├── sse.js                  # SSE Manager จัดการการเชื่อมต่อและบรอดแคสต์ข้อมูล
    │   ├── middleware/             # มิดเดิลแวร์ส่วนกลาง
    │   │   ├── auth.js             # ตรวจสอบความถูกต้องของคุกกี้เซสชันแอดมิน
    │   │   ├── errorHandler.js     # มิดเดิลแวร์ดักจับข้อผิดพลาดและจัดรูปแบบ Response
    │   │   ├── requestContext.js   # มิดเดิลแวร์แนบ Request ID และบันทึก Log คำขอ
    │   │   └── validate.js         # มิดเดิลแวร์ตรวจสอบความถูกต้องของข้อมูล (Validation)
    │   └── validators/             # สคีมาตรวจสอบโครงสร้างข้อมูลนำเข้า
    │       └── index.js            # กำหนดกฎเกณฑ์ความถูกต้องของข้อมูลแต่ละคำขอ
    └── store/                      # ฟีเจอร์: สถานะร้านค้าและคิวคำสั่งซื้อ
        ├── store_controller.js     # ตัวควบคุมรับคำขอดึงและอัปเดตสถานะร้านค้า
        ├── store_repository.js     # คำสั่ง SQL จัดการตาราง store_status และ sequence คิว
        └── store_service.js        # ตรรกะเปิด/ปิดร้าน, รีเซ็ตคิว และคำนวณยอดขายประจำวัน
```

---

## 🛡️ ชั้นความปลอดภัยและการจัดการข้อผิดพลาด (Security & Error Handling)

1. **การตั้งค่าส่วนกลางพร้อมระบบ Fail-Fast (`src/config/config.js`)**
   - ตรวจสอบความถูกต้องของค่า Environment Variables ตั้งแต่เริ่มบูต และหยุดการทำงานทันทีหากพบว่าค่าสำคัญขาดหายไป

2. **โครงสร้างคลาส Error แบบกำหนดประเภท (`src/shared/errors.js`)**
   - คลาสข้อผิดพลาดเฉพาะทาง: `NotFoundError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`
   - ตัวจัดการ `globalErrorHandler` ส่งคืนข้อมูลตามมาตรฐาน RFC 9457 Problem Details พร้อมซ่อน Stack Trace เมื่อทำงานบน Production

3. **ระบบบันทึก Log เชิงโครงสร้างแบบ JSON (`src/shared/logger.js` และ `requestContext.js`)**
   - สร้างและแนบ `requestId` ไปกับทุกคำขอ เพื่อให้สามารถติดตาม Log ได้แบบ End-to-End

4. **การจำกัดอัตราคำขอและ Header ความปลอดภัย (`src/index.js`)**
   - มิดเดิลแวร์ `Helmet` ป้องกัน Header ทั่วไป
   - ระบบ `CORS` อนุญาตเฉพาะโดเมนที่ระบุใน `CORS_ORIGIN`
   - การจำกัดอัตราคำขอ (Rate Limits): ป้องกันการสุ่มรหัสผ่านที่ `/api/admin/login` (จำกัด 5 ครั้ง / 15 นาที) และ API ทั่วไป (จำกัด 300 ครั้ง / 15 นาที)

---

## 🤖 ระบบแจ้งเตือนผ่าน Discord Webhook (`discord.js`)

- **การแจ้งเตือนออเดอร์แบบเรียลไทม์**: ส่งใบรายการคำสั่งซื้อใหม่เข้าห้อง Discord ทันที
- **การซิงค์สถานะและการลบข้อความอัตโนมัติ**: เมื่อลูกค้ายกเลิกคำสั่งซื้อ ระบบจะแก้ไขข้อความเดิมและสั่งลบข้อความเก่าภายใน 5 วินาที พร้อมส่งแจ้งเตือนการยกเลิกใหม่เพื่อป้องกันความสับสน
- **รายงานสรุปยอดขายประจำวัน**: ส่งสรุปยอดขาย จำนวนออเดอร์ และเมนูขายดีเข้า Discord อัตโนมัติเมื่อทำการปิดร้าน

---

## 🚀 การจัดการ Environment Variables

สร้างไฟล์ `backend/.env` โดยคัดลอกและอ้างอิงจาก `.env.example`:

```env
PORT=8000
NODE_ENV=production

# Database Connection (Neon Serverless PostgreSQL หรือ ฐานข้อมูล Local)
DATABASE_URL=postgres://user:password@host/database?sslmode=require

# Security Keys (กุญแจความปลอดภัย)
JWT_SECRET=your_super_secret_jwt_key
CRON_SECRET=your_super_secret_cron_token

# CORS Allowed Origins (โดเมนที่อนุญาต คั่นด้วยเครื่องหมายจุลภาค)
CORS_ORIGIN=https://your-app.vercel.app,http://localhost:5173

# Admin Setup (บัญชีแอดมินเริ่มต้น)
ADMIN_INIT_USERNAME=admin
ADMIN_INIT_PASSWORD=adminpassword

# Discord Notifications (Webhook URL สำหรับแจ้งเตือน)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_CANCEL_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_REPORT_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

---

## 🌐 Endpoints สำคัญของระบบ (Key API Endpoints)

| Method | Endpoint | คำอธิบาย | การตรวจสอบสิทธิ์ |
|---|---|---|---|
| `GET` | `/api/health` | ตรวจสอบสถานะการทำงานของระบบ (Health Check) | สาธารณะ (Public) |
| `GET` | `/api/menu` | ดึงรายการอาหารทั้งหมด | สาธารณะ (Public) |
| `GET` | `/api/dressings` | ดึงรายการน้ำสลัด | สาธารณะ (Public) |
| `POST` | `/api/orders` | สั่งซื้อสินค้า | สาธารณะ (Public) |
| `GET` | `/api/orders/track/:order_number` | ติดตามสถานะออเดอร์ | สาธารณะ (Public) |
| `GET` | `/api/orders/events/:order_number` | ช่องทางสตรีมข้อมูลสถานะออเดอร์แบบเรียลไทม์ (SSE) | สาธารณะ (Public) |
| `POST` | `/api/admin/login` | เข้าสู่ระบบแอดมิน | มีการจำกัดอัตราคำขอ (Rate Limited) |
| `GET` | `/api/admin/analytics` | ดึงข้อมูลสถิติยอดขายและเมนูยอดนิยม | คุกกี้แอดมิน (Admin Cookie) |
| `PATCH` | `/api/admin/store/status` | เปิด/ปิดร้านค้า และแก้ไขข้อความประกาศ | คุกกี้แอดมิน (Admin Cookie) |
| `POST` | `/internal/cron/maintenance` | ล้างข้อมูลเซสชันที่หมดอายุ | ต้องมี Bearer CRON_SECRET |
