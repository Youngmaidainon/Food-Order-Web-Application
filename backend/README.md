<div align="center">
  <h1>⚙️ ระบบบริการส่วนหลังบ้าน (Backend API) - ร้านสปริงโรลออนไลน์</h1>
  <p><strong>พัฒนาด้วย Node.js + Express.js ตามสถาปัตยกรรมแบบ Feature-First, ระบบตรวจสอบสิทธิ์ด้วยเซสชัน, การจำกัดอัตราคำขอ (Rate Limiting), ระบบ Connection Pool และการสตรีมข้อมูลแบบเรียลไทม์ (SSE)</strong></p>
</div>

---

## 🧩 สถาปัตยกรรมระดับซอร์สโค้ด (Feature-First Architecture)

```
backend/src/
├── admin/                  # การตรวจสอบสิทธิ์แอดมิน, แดชบอร์ดสถิติ และรายงาน
├── cart/                   # เซสชันตะกร้าสินค้าและการจัดการรายการสินค้า
├── config/                 # การตั้งค่าระบบส่วนกลาง + ตรวจสอบความถูกต้องตั้งแต่เริ่มบูต (Fail-Fast)
├── cron/                   # ระบบ Cron งานบำรุงรักษา (ล้างเซสชันที่หมดอายุ)
├── dressings/              # จัดการข้อมูลน้ำสลัด (CRUD)
├── menu/                   # จัดการข้อมูลเมนูอาหารและหมวดหมู่ (CRUD)
├── orders/                 # วงจรออเดอร์, การสตรีมข้อมูล SSE และการติดตามสถานะ
├── shared/                 # ฟังก์ชันและโมดูลส่วนกลางของระบบ
│   ├── errors.js           # โครงสร้างคลาส Error แบบกำหนดประเภท (มาตรฐาน RFC 9457)
│   ├── logger.js           # ระบบบันทึก Log รูปแบบ JSON เชิงโครงสร้างด้วย Pino
│   ├── sse.js              # ตัวจัดการช่องทางสตรีมข้อมูลแบบเรียลไทม์ (SSE Manager)
│   └── middleware/         # มิดเดิลแวร์ errorHandler.js และ requestContext.js
├── store/                  # สถานะร้านค้า, ลำดับคิว และข้อความประกาศ
├── discord.js              # การแจ้งเตือนและจัดการข้อความผ่าน Discord Webhook
└── index.js                # การตั้งค่า Express App, มิดเดิลแวร์ และการประกาศ Route
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
