<div align="center">
  <h1>🌯 ร้านสปริงโรลออนไลน์ (Spring Roll Online Store)</h1>
  <p><strong>ระบบสั่งอาหารออนไลน์แบบ Full-Stack ครบวงจร พร้อมหน้าร้านลูกค้า และระบบแอดมินจัดการออเดอร์/สถิติยอดขาย</strong></p>

  <img src="https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20Tailwind-61DAFB?style=flat-square&logo=react&logoColor=black" alt="Frontend" />
  <img src="https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20Feature--First-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Backend" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="Database" />
  <img src="https://img.shields.io/badge/Container-Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Cloud%20%26%20Deploy-Render%20%7C%20Vercel%20%7C%20Neon-000000?style=flat-square&logo=vercel&logoColor=white" alt="Cloud & Deploy" />
  <img src="https://img.shields.io/badge/Integration-Discord%20Webhook-5865F2?style=flat-square&logo=discord&logoColor=white" alt="Discord" />
</div>

<br />

> [!NOTE]  
> โปรเจกต์นี้พัฒนาตามหลักการ **Separation of Concerns (SoC)**, **Feature-First Architecture** และ **OWASP Security Best Practices** พร้อมรองรับการรันทั้งแบบ **Docker Compose** ในเครื่อง หรือ Deploy ขึ้นระบบ Cloud ระดับ Production / Free Tier

---

## 📐 สถาปัตยกรรมระบบ (System Architecture)

1. **Client (Frontend)**: React 18 + Vite + Tailwind CSS สไตล์ Glassmorphism รองรับ Responsive ทั้งมือถือและเดสก์ท็อป พร้อมระบบ CartContext (Optimistic UI + Debounced sync) และ TrackingModal ติดตามสถานะออเดอร์ Real-time
2. **Application Server (Backend)**: Express.js จัดโครงสร้างแบบ **Feature-First** (`admin`, `cart`, `dressings`, `menu`, `orders`, `store`, `cron`), มี **Centralized Config (Fail-Fast)**, **Typed AppError Hierarchy**, **Structured JSON Logging (Pino)**, และระบบ **Auto-Migration** รันคำสั่ง SQL ตั้งค่าฐานข้อมูลอัตโนมัติเมื่อเริ่มเซิร์ฟเวอร์
3. **Database**: PostgreSQL พร้อม Custom ENUM Types, Foreign Key Cascades, และ Composite Unique Constraints สำหรับควบคุมความถูกต้องของข้อมูล
4. **Discord Webhook Automation**: ส่งใบออเดอร์แจ้งเตือนทันทีเมื่อมีคำสั่งซื้อใหม่ พร้อมระบบแก้ไขและลบข้อความเก่าอัตโนมัติเมื่อลูกค้ายกเลิกออเดอร์
5. **Background Maintenance & Keep-Alive**: รองรับ Endpoint `/api/health` สำหรับ Health Check และ `/internal/cron/maintenance` สำหรับล้าง Session ขยะที่หมดอายุ

---

## 🛡️ ความปลอดภัยและการเพิ่มประสิทธิภาพ (Security & Optimization)

### 🔒 ด้านความปลอดภัย (Cyber Security)
- **Typed Error Hierarchy & Problem Details**: ดักจับ Error ทั่วระบบด้วย `globalErrorHandler` และส่งข้อความตอบกลับตามมาตรฐาน RFC 9457 โดยไม่เปิดเผย Stack Trace ไปยัง Client
- **Session-Based Authentication**: ตรวจสอบสิทธิ์แอดมินด้วย `HttpOnly`, `SameSite` Cookies ป้องกันการโจมตีแบบ XSS
- **Strict Rate Limiting**:
  - `POST /api/admin/login` -> จำกัด 5 ครั้ง / 15 นาที (ป้องกัน Brute Force)
  - `POST /internal/cron` -> จำกัด 20 ครั้ง / 15 นาที พร้อมตรวจสอบ `CRON_SECRET`
  - `/api/*` ทั่วไป -> จำกัด 300 ครั้ง / 15 นาที (ป้องกัน DoS / Scraper)
- **Security Headers & Strict CORS**: ติดตั้ง `Helmet` ป้องกัน Header ทั่วไป และจำกัด `CORS` อนุญาตเฉพาะ Whitelist Origins ใน Production
- **Parameterized SQL Queries**: คำสั่ง SQL ทุกจุดใช้ Parameterized Query (`$1, $2, ...`) ป้องกัน SQL Injection 100%
- **HTTPS Redirection**: บังคับ Redirect เป็น HTTPS อัตโนมัติเมื่อรันในสภาพแวดล้อม Production

### 🚀 ด้านการเพิ่มประสิทธิภาพ (Optimization)
- **Optimistic UI & Debounced Requests**: อัปเดต UI ทันที และหน่วงเวลา 500ms ก่อนส่งอัปเดตจำนวนสินค้าลงตะกร้าไปยังเซิร์ฟเวอร์
- **Database Connection Pooling**: จัดการ Connection Pool ผ่าน `pg.Pool` รองรับโหลดพร้อมกันได้สูง
- **Non-blocking Polling**: ระบบติดตามสถานะออเดอร์ฝั่งลูกค้า Polling อย่างเหมาะสม ไม่ส่งคำขอซ้ำซ้อน

---

## 🚀 การติดตั้งและเปิดใช้งานระบบ (Getting Started)

### วิธีที่ 1: รันด้วย Docker Compose (Local Development)

1. คัดลอกและตั้งค่า Environment Variable:
   ```bash
   cp .env.example .env
   ```
2. รัน Build และเปิด Containers:
   ```bash
   docker compose up -d --build
   ```
3. เข้าใช้งานระบบ:
   - **หน้าร้าน (Storefront)**: `http://localhost`
   - **หน้าจัดการแอดมิน (Admin)**: `http://localhost/admin`
   - **Backend API**: `http://localhost:8000/api`
   - **Health Check**: `http://localhost:8000/api/health`

### การทดสอบแบบ Public ด้วย Cloudflare Tunnel (ทดสอบ Webhook 100%)
สำหรับทดสอบระบบเสมือน Production จริง รวมถึงให้ Discord/External services ยิงกลับมาได้:
1. รัน Docker Compose ปกติ: `docker compose up -d`
2. เปิด Tunnel ชี้ไปที่ Frontend (Port 80):
   ```bash
   npx cloudflared tunnel --url http://localhost
   ```
3. นำ URL ที่ได้จาก Cloudflared (เช่น `https://xxxx.trycloudflare.com`) ไปเปิดทดสอบบนมือถือ หรือตั้งค่า Webhook ได้เลย!
   (ระบบ CORS ถูกตั้งให้เปิดรับทุก Origin ชั่วคราวเมื่อรันแบบ Development)

---

### วิธีที่ 2: Deploy ฟรีผ่าน Cloud (Neon + Render + Vercel + cron-job.org)

| ส่วนประกอบ | แพลตฟอร์ม | หน้าที่ |
|---|---|---|
| **Database** | **Neon.tech** | PostgreSQL Serverless (Free Tier) |
| **Backend** | **Render.com** | Node.js Web Service (Free Tier) |
| **Frontend** | **Vercel.com** | React SPA + API Rewrites Proxy (Free Tier) |
| **Keep-Alive & Cron** | **cron-job.org** | ยิง Ping กันเซิร์ฟเวอร์หลับ และรันงาน Maintenance รายวัน |

#### 1. สร้าง Database บน Neon
- สมัครและสร้างโปรเจกต์บน [Neon.tech](https://neon.tech)
- คัดลอก `DATABASE_URL` (Connection String ที่มี `sslmode=require`)

#### 2. Deploy Backend บน Render
- นำโค้ดขึ้น GitHub และสร้าง **Web Service** บน [Render.com](https://render.com)
- เลือกเชื่อมต่อกับโฟลเดอร์ `backend` (หรือใช้ `render.yaml`)
- ตั้งค่า Environment Variables สำคัญ:
  - `DATABASE_URL`: URL จาก Neon
  - `NODE_ENV`: `production`
  - `JWT_SECRET`: รหัสลับสำหรับ JWT
  - `CORS_ORIGIN`: URL ของ Frontend บน Vercel เช่น `https://your-app.vercel.app`
  - `CRON_SECRET`: รหัสลับสำหรับ Cron endpoint
  - `DISCORD_WEBHOOK_URL`: (ไม่บังคับ) Webhook สำหรับรับการแจ้งเตือน

#### 3. Deploy Frontend บน Vercel
- สร้างโปรเจกต์บน [Vercel.com](https://vercel.com) ผูกกับโฟลเดอร์ `frontend`
- **สำคัญ:** เข้าไปแก้ไขไฟล์ `frontend/vercel.json` โดยเปลี่ยน `https://your-backend-url.onrender.com` ให้เป็น URL จริงของ Render Backend ที่เพิ่งสร้างเสร็จ
- กด Deploy จะได้ Domain หน้าร้านค้าทันที

#### 4. ตั้งค่า cron-job.org (ป้องกัน Render Sleep)
- สร้าง Job ยิง HTTP GET ไปที่ `https://your-backend.onrender.com/api/health` ทุก **10-14 นาที**
- สร้าง Job รายวันยิง HTTP POST ไปที่ `https://your-backend.onrender.com/internal/cron/maintenance` พร้อม Header `Authorization: Bearer <CRON_SECRET>`

---

## 📁 โครงสร้างโปรเจกต์ (Repository Structure)

```
Food Order System/
├── backend/                  # Node.js Express Backend
│   ├── src/
│   │   ├── admin/            # Feature: Admin Auth, Dashboard, Reports
│   │   ├── cart/             # Feature: Shopping Cart & Session
│   │   ├── config/           # Centralized Config & Fail-fast
│   │   ├── cron/             # Feature: Maintenance & Cleanup
│   │   ├── dressings/        # Feature: Salad Dressings Management
│   │   ├── menu/             # Feature: Menu Items & Categories
│   │   ├── orders/           # Feature: Order Creation & Tracking
│   │   ├── shared/           # Error Handler, AppError, Logger, Middleware
│   │   └── store/            # Feature: Store Status & Sequence
│   ├── Dockerfile
│   ├── render.yaml           # Render Infrastructure-as-Code
│   ├── server.js             # Bootstrap & Auto-migration
│   └── package.json
├── frontend/                 # React 18 + Vite Frontend
│   ├── src/
│   │   ├── api/              # API Client fetch wrapper
│   │   ├── components/       # UI Components (Cart, Menu, Admin, Modals)
│   │   ├── context/          # State Management (Auth, Cart, Toast, Alert)
│   │   ├── pages/            # App Pages (CustomerApp, Admin Pages)
│   │   └── index.css         # Tailwind & Custom Glassmorphism Theme
│   ├── vercel.json           # Vercel Deployment & API Proxy Config
│   ├── Dockerfile
│   └── package.json
├── database/                 # PostgreSQL Database
│   ├── schema.sql            # Table definitions, ENUMs, Indexes, Seed data
│   └── README.md
├── docker-compose.yml        # Full-stack Container Orchestration
└── README.md
```
