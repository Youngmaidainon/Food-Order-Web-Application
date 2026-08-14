<div align="center">
  <h1>⚙️ Backend API - ร้านสปริงโรลออนไลน์</h1>
  <p>ซอร์สโค้ดฝั่ง Backend พัฒนาด้วย <strong>Node.js + Express.js</strong> ออกแบบตามสถาปัตยกรรม <strong>Feature-First Architecture</strong>, ระบบตรวจสอบสิทธิ์, Rate Limiting และ Database Connection Pooling</p>
</div>

---

## 🧩 สถาปัตยกรรมระดับซอร์สโค้ด (Feature-First Architecture)

โค้ดใน `backend/src` ถูกจัดกลุ่มตามฟีเจอร์ทางธุรกิจ (Feature-First) แทนการแยกตามโฟลเดอร์เทคนิคแบบเดิม เพื่อให้บำรุงรักษาง่ายและลดความซับซ้อน:

```
backend/src/
├── admin/                  # จัดการสิทธิ์แอดมิน, สถิติยอดขาย (Dashboard), และรายงานรายวัน
├── cart/                   # ตรรกะตะกร้าสินค้า (Cart Session, เพิ่ม/ลด/ลบรายการ)
├── config/                 # Centralized Configuration + Fail-fast startup validation
├── cron/                   # Internal Maintenance Cron (ล้าง Session หมดอายุ)
├── dressings/              # CRUD รายการน้ำสลัด
├── menu/                   # CRUD รายการอาหารและหมวดหมู่ (Categories)
├── orders/                 # สร้างออเดอร์, ติดตามสถานะ, อัปเดตสถานะการจัดส่ง
├── shared/                 # โครงสร้างร่วมของระบบ
│   ├── errors.js           # Typed AppError hierarchy (RFC 9457 standard)
│   ├── logger.js           # Structured JSON Logging ด้วย Pino
│   └── middleware/         # errorHandler.js, requestContext.js
├── store/                  # สถานะร้านค้า (เปิด/ปิด), ลำดับคิว (Sequence)
├── discord.js              # ระบบเชื่อมต่อ Discord Webhook สำหรับแจ้งเตือน
└── index.js                # Express App pipeline, Middlewares, Routes declaration
```

---

## 🛡️ ชั้นความปลอดภัยและการจัดการข้อผิดพลาด (Security & Error Handling)

1. **Centralized Fail-Fast Config (`src/config/config.js`)**
   - ตรวจสอบความถูกต้องของ Environment Variables ตั้งแต่เริ่มบูต หากตัวแปรสำคัญขาดหาย (เช่น `JWT_SECRET` ในโหมด Production) จะแจ้งเตือนและหยุดการทำงานทันที (Fail-Fast)
2. **Typed Error Hierarchy (`src/shared/errors.js`)**
   - มีคลาส Error เฉพาะทาง เช่น `NotFoundError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError` สืบทอดจาก `AppError`
   - `globalErrorHandler` ส่งคืน Response ตามมาตรฐาน **RFC 9457 Problem Details** พร้อมซ่อน Stack Trace ใน Production
3. **Structured JSON Logging (`src/logger.js` & `src/shared/middleware/requestContext.js`)**
   - สร้าง Request ID กำกับทุกคำขอ เพื่อความสะดวกในการติดตาม Log แบบ End-to-End
4. **Rate Limiting & Security Headers (`src/index.js`)**
   - `Helmet` ป้องกัน Header ทั่วไป
   - `CORS` อนุญาตเฉพาะ Domain ที่อยู่ใน `CORS_ORIGIN` (เมื่ออยู่ในโหมด Production)
   - ป้องกัน Brute Force ใน Endpoint `/api/admin/login` (จำกัด 5 ครั้ง / 15 นาที) และคำขอทั่วไป (300 ครั้ง / 15 นาที)

---

## 🤖 ระบบแจ้งเตือนผ่าน Discord Webhook (`discord.js`)

- **Real-time Order Alerts**: ส่งการแจ้งเตือนคำสั่งซื้อใหม่เข้าห้อง Discord ทันทีพร้อมปุ่ม/สถานะ
- **State Synchronization & Auto-Deletion**: เมื่อลูกค้ายกเลิกคำสั่งซื้อ Backend จะทำการแก้ไขข้อความเดิม และสั่งลบข้อความเก่าภายใน 5 วินาที พร้อมส่งข้อความแจ้งเตือนการยกเลิกใหม่เพื่อป้องกันความสับสน
- **Daily Sales Report**: สรุปยอดขาย ออเดอร์ทั้งหมด และเมนูขายดีประจำวัน

---

## 🚀 การจัดการ Environment Variables

สร้างไฟล์ `.env` ที่โฟลเดอร์ `backend/` โดยอ้างอิงจาก `.env.example`:

```env
PORT=8000
NODE_ENV=production

# Database Connection (Neon Serverless PostgreSQL หรือ Local)
DATABASE_URL=postgres://user:password@host/database?sslmode=require

# Security Keys
JWT_SECRET=your_super_secret_jwt_key
CRON_SECRET=your_super_secret_cron_token

# CORS Allowed Origins (คั่นด้วยจุลภาค)
CORS_ORIGIN=https://your-app.vercel.app,http://localhost:5173

# Admin Setup (ค่าเริ่มต้นสำหรับการ Hash รหัสครั้งแรก)
ADMIN_INIT_USERNAME=admin
ADMIN_INIT_PASSWORD=adminpassword

# Discord Notifications (ใส่ URL Webhook)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_CANCEL_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_REPORT_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

---

## 🌐 Endpoints สำคัญของระบบ (Key API Endpoints)

| Method | Endpoint | คำอธิบาย | การตรวจสอบสิทธิ์ |
|---|---|---|---|
| `GET` | `/api/health` | ตรวจสอบสถานะการทำงาน (Health Check) | Public |
| `GET` | `/api/menu` | ดึงรายการอาหารทั้งหมด | Public |
| `GET` | `/api/dressings` | ดึงรายการน้ำสลัด | Public |
| `POST` | `/api/orders` | สั่งซื้อสินค้า | Public |
| `GET` | `/api/orders/track/:order_number` | ติดตามสถานะออเดอร์ | Public |
| `POST` | `/api/admin/login` | เข้าสู่ระบบแอดมิน | Rate Limited |
| `GET` | `/api/admin/analytics` | สถิติยอดขายและเมนูขายดี | Admin Cookie |
| `PUT` | `/api/store/status` | เปิด/ปิดร้านค้า | Admin Cookie |
| `POST` | `/internal/cron/maintenance` | ล้าง Session ขยะรายวัน | Bearer CRON_SECRET |
