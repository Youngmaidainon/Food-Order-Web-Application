<div align="center">
  <h1>🌯 ร้านสปริงโรลออนไลน์ (Spring Roll Online Store)</h1>
  <p><strong>Full-stack food ordering platform. Storefront, admin order management, sales analytics, SSE real-time tracking, Discord alerts.</strong></p>

  <img src="https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20Tailwind-61DAFB?style=flat-square&logo=react&logoColor=black" alt="Frontend" />
  <img src="https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20Feature--First-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Backend" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="Database" />
  <img src="https://img.shields.io/badge/Container-Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Cloud%20%26%20Deploy-Render%20%7C%20Vercel%20%7C%20Neon-000000?style=flat-square&logo=vercel&logoColor=white" alt="Cloud & Deploy" />
  <img src="https://img.shields.io/badge/Integration-Discord%20Webhook-5865F2?style=flat-square&logo=discord&logoColor=white" alt="Discord" />
</div>

<br />

> [!NOTE]  
> Build with **Separation of Concerns (SoC)**, **Feature-First Architecture**, and **OWASP Security Practices**. Run via **Docker Compose** locally or deploy to cloud free tier.

---

## 📐 สถาปัตยกรรมระบบ (System Architecture)

1. **Client (Frontend)**: React 18 + Vite + Tailwind CSS. Glassmorphism UI, responsive mobile/tablet/desktop, `CartContext` (optimistic UI + debounce), `TrackingModal` (real-time SSE stream + audio alerts).
2. **Application Server (Backend)**: Express.js **Feature-First** structure (`admin`, `cart`, `dressings`, `menu`, `orders`, `store`, `cron`), centralized fail-fast config, RFC 9457 typed errors, structured JSON logging (Pino), auto-migrations on boot.
3. **Database**: PostgreSQL with custom ENUMs, foreign key cascades, composite unique constraints, performance indexes.
4. **Discord Webhook Automation**: Instant order notifications, automated message updates, auto-deletion on cancellation, daily revenue reports.
5. **Background Maintenance**: `/api/health` health check, `/internal/cron/maintenance` daily session cleanup.

---

## 🛡️ ความปลอดภัยและการเพิ่มประสิทธิภาพ (Security & Optimization)

### 🔒 ด้านความปลอดภัย (Cyber Security)
- **RFC 9457 Problem Details**: Centralized `globalErrorHandler`, stack traces hidden in production.
- **Session Auth**: Admin auth via `HttpOnly`, `SameSite` secure cookies (anti-XSS).
- **Strict Rate Limits**:
  - `POST /api/admin/login`: 5 req / 15m (anti-bruteforce)
  - `POST /internal/cron/*`: 20 req / 15m + `CRON_SECRET` validation
  - `/api/*`: 300 req / 15m (anti-DoS)
- **Security Headers & CORS**: `Helmet` headers + strict `CORS_ORIGIN` whitelist in production.
- **Parameterized SQL**: 100% parameter queries (`$1, $2, ...`), zero SQL injection.
- **HTTPS Enforcement**: Auto HTTPS redirection on production.

### 🚀 ด้านการเพิ่มประสิทธิภาพ (Optimization)
- **Optimistic UI & Debounced Sync**: Instant local state updates, 500ms sync delay for cart changes.
- **Connection Pooling**: `pg.Pool` connection management.
- **Real-time SSE**: Low-overhead event streaming for live order status changes.

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
   - **Storefront**: `http://localhost`
   - **Admin Portal**: `http://localhost/admin`
   - **Backend API**: `http://localhost:8000/api`
   - **Health Check**: `http://localhost:8000/api/health`

### การทดสอบแบบ Public ด้วย Cloudflare Tunnel (ทดสอบ Webhook 100%)

1. รัน Docker Compose: `docker compose up -d --build`
2. รัน Tunnel ชี้ไปที่ Frontend (Port 80):
   ```bash
   npx cloudflared tunnel --url http://localhost
   ```
3. ใช้ URL `https://xxxx.trycloudflare.com` ทดสอบบนอุปกรณ์จริงหรือเชื่อม Discord Webhook

---

### วิธีที่ 2: Deploy ฟรีผ่าน Cloud (Neon + Render + Vercel + cron-job.org)

| ส่วนประกอบ | แพลตฟอร์ม | หน้าที่ |
|---|---|---|
| **Database** | **Neon.tech** | PostgreSQL Serverless (Free Tier) |
| **Backend** | **Render.com** | Node.js Web Service (Free Tier) |
| **Frontend** | **Vercel.com** | React SPA + API Rewrites Proxy (Free Tier) |
| **Keep-Alive & Cron** | **cron-job.org** | Health check ping + daily maintenance |

#### 1. สร้าง Database บน Neon
- สร้างโปรเจกต์บน [Neon.tech](https://neon.tech)
- คัดลอก `DATABASE_URL` (`sslmode=require`)

#### 2. Deploy Backend บน Render
- สร้าง Web Service บน [Render.com](https://render.com) ชี้ไปที่โฟลเดอร์ `backend`
- ตั้งค่า Environment Variables:
  - `DATABASE_URL`: Connection string จาก Neon
  - `NODE_ENV`: `production`
  - `JWT_SECRET`: Secret key สำหรับ JWT
  - `CORS_ORIGIN`: URL Frontend Vercel (เช่น `https://your-app.vercel.app`)
  - `CRON_SECRET`: Secret token สำหรับ Cron
  - `DISCORD_WEBHOOK_URL`: (Optional) Discord Webhook URL

#### 3. Deploy Frontend บน Vercel
- สร้างโปรเจกต์บน [Vercel.com](https://vercel.com) ผูกกับโฟลเดอร์ `frontend`
- แก้ไข `frontend/vercel.json` ปรับ URL destination ไปที่ Render backend
- Deploy รับ Domain หน้าร้าน

#### 4. ตั้งค่า cron-job.org (ป้องกัน Render Sleep)
- สร้าง Job GET `https://your-backend.onrender.com/api/health` ทุก **10-14 นาที**
- สร้าง Job POST `https://your-backend.onrender.com/internal/cron/maintenance` รายวันพร้อม header `Authorization: Bearer <CRON_SECRET>`

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
│   │   ├── orders/           # Feature: Order Lifecycle, SSE, Tracking
│   │   ├── shared/           # Error Handler, AppError, Logger, SSE
│   │   └── store/            # Feature: Store Status, Sequence, Announcement
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
│   │   ├── utils/            # Audio generator
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
