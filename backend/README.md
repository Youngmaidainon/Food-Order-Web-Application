<div align="center">
  <h1>⚙️ Backend API - ร้านสปริงโรลออนไลน์</h1>
  <p><strong>Node.js + Express.js backend. Feature-First architecture, session auth, rate limiting, connection pool, SSE streams.</strong></p>
</div>

---

## 🧩 สถาปัตยกรรมระดับซอร์สโค้ด (Feature-First Architecture)

```
backend/src/
├── admin/                  # Admin auth, dashboard analytics, reports
├── cart/                   # Cart session & item mutations
├── config/                 # Centralized config + Fail-fast startup checks
├── cron/                   # Maintenance cron (purge expired sessions)
├── dressings/              # CRUD dressings
├── menu/                   # CRUD menu & categories
├── orders/                 # Order lifecycle, SSE stream, tracking
├── shared/                 # Common kernel
│   ├── errors.js           # Typed AppError hierarchy (RFC 9457)
│   ├── logger.js           # Structured JSON Pino logging
│   ├── sse.js              # Real-time SSE channel manager
│   └── middleware/         # errorHandler.js, requestContext.js
├── store/                  # Store status, queue sequence, announcement
├── discord.js              # Discord webhook alerts & lifecycle management
└── index.js                # Express app setup, middlewares, routes
```

---

## 🛡️ ชั้นความปลอดภัยและการจัดการข้อผิดพลาด (Security & Error Handling)

1. **Centralized Fail-Fast Config (`src/config/config.js`)**
   - ตรวจสอบ env vars ตอนบูต หยุดทำงานทันทีถ้าตัวแปรสำคัญขาดหาย

2. **Typed Error Hierarchy (`src/shared/errors.js`)**
   - คลาสเฉพาะทาง: `NotFoundError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`
   - `globalErrorHandler` ตอบกลับ RFC 9457 Problem Details ซ่อน stack trace บน production

3. **Structured JSON Logging (`src/shared/logger.js` & `requestContext.js`)**
   - แนบ `requestId` ทุก request ติดตาม log end-to-end

4. **Rate Limiting & Security Headers (`src/index.js`)**
   - `Helmet` headers
   - `CORS` whitelist domain ตาม `CORS_ORIGIN`
   - Rate limits: `/api/admin/login` (5 req / 15m), general API (300 req / 15m)

---

## 🤖 ระบบแจ้งเตือนผ่าน Discord Webhook (`discord.js`)

- **Real-time Order Alerts**: ส่งใบออเดอร์เข้า Discord ทันที
- **State Sync & Auto-Deletion**: เมื่อยกเลิกออเดอร์ ลบข้อความเก่าใน 5s ส่งแจ้งเตือนยกเลิกใหม่
- **Daily Sales Report**: ส่งสรุปยอดขาย ออเดอร์ เมนูขายดีเมื่อปิดร้าน

---

## 🚀 การจัดการ Environment Variables

สร้างไฟล์ `backend/.env` อิงจาก `.env.example`:

```env
PORT=8000
NODE_ENV=production

# Database Connection (Neon Serverless PostgreSQL or Local)
DATABASE_URL=postgres://user:password@host/database?sslmode=require

# Security Keys
JWT_SECRET=your_super_secret_jwt_key
CRON_SECRET=your_super_secret_cron_token

# CORS Allowed Origins (comma-separated)
CORS_ORIGIN=https://your-app.vercel.app,http://localhost:5173

# Admin Setup
ADMIN_INIT_USERNAME=admin
ADMIN_INIT_PASSWORD=adminpassword

# Discord Notifications
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_CANCEL_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_REPORT_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

---

## 🌐 Endpoints สำคัญของระบบ (Key API Endpoints)

| Method | Endpoint | คำอธิบาย | การตรวจสอบสิทธิ์ |
|---|---|---|---|
| `GET` | `/api/health` | Health Check | Public |
| `GET` | `/api/menu` | รายการอาหารทั้งหมด | Public |
| `GET` | `/api/dressings` | รายการน้ำสลัด | Public |
| `POST` | `/api/orders` | สั่งซื้อสินค้า | Public |
| `GET` | `/api/orders/track/:order_number` | ติดตามสถานะออเดอร์ | Public |
| `GET` | `/api/orders/events/:order_number` | SSE Real-time stream ออเดอร์ | Public |
| `POST` | `/api/admin/login` | เข้าสู่ระบบแอดมิน | Rate Limited |
| `GET` | `/api/admin/analytics` | สถิติยอดขาย | Admin Cookie |
| `PATCH` | `/api/admin/store/status` | เปิด/ปิดร้านค้า & ประกาศ | Admin Cookie |
| `POST` | `/internal/cron/maintenance` | ล้าง session ขยะ | Bearer CRON_SECRET |
