<div align="center">
  <h1>🥗 ระบบสั่งอาหารออนไลน์ (Spring Roll Online Store)</h1>
  <p><strong>เว็บแอปพลิเคชันสั่งอาหารออนไลน์สไตล์ Glassmorphism สถาปัตยกรรม Feature-First ซิงค์เรียลไทม์ผ่าน Smart Polling + Smart Cache (HTTP 304 ETag), Optimistic UI, แจ้งเตือน Discord Webhook และรองรับ Cloud Free Tier 100%</strong></p>

  <br />

  <img src="https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20TailwindCSS-00f2fe?style=flat-square&logo=react&logoColor=white" alt="Frontend" />
  <img src="https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-43e97b?style=flat-square&logo=node.js&logoColor=white" alt="Backend" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL%2017%2B-336791?style=flat-square&logo=postgresql&logoColor=white" alt="Database" />
  <img src="https://img.shields.io/badge/Realtime-Smart%20Polling%20%26%20Intelligent%20Cache-ff0844?style=flat-square" alt="Smart Polling & Cache" />
  <img src="https://img.shields.io/badge/Container-Docker%20%7C%20Docker%20Compose-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Cloud%20Hosting-Render%20%7C%20Vercel%20%7C%20Neon-000000?style=flat-square&logo=vercel&logoColor=white" alt="Cloud Hosting" />
  <img src="https://img.shields.io/badge/Integration-Discord%20Webhook-5865F2?style=flat-square&logo=discord&logoColor=white" alt="Discord" />
</div>

<br />

> [!NOTE]  
> พัฒนาตามหลัก **Separation of Concerns (SoC)**, **Feature-First Architecture** และ **OWASP Security Best Practices** รันได้ทั้ง Docker Compose ในเครื่อง หรือ Cloud Production Free Tier

---

## 📐 สถาปัตยกรรมระบบ (System Architecture)

```mermaid
flowchart TD
    classDef client fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc,rx:8px
    classDef proxy fill:#1e293b,stroke:#06b6d4,stroke-width:2px,color:#f8fafc,rx:8px
    classDef backend fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc,rx:8px
    classDef db fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#f8fafc,rx:8px
    classDef ext fill:#2a1b4e,stroke:#c084fc,stroke-width:2px,color:#f8fafc,rx:8px

    subgraph CLIENTS ["🌐 1. ส่วนติดต่อผู้ใช้ (Frontend Clients)"]
        Customer["📱 ลูกค้า (Customer Storefront)<br/>• React 18 & TanStack Query<br/>• Smart Polling & Auto-Tracking"]:::client
        Admin["💻 แอดมิน (Admin Management Portal)<br/>• Smart Polling KDS Kanban (4s)<br/>• Real-time Analytics Dashboard"]:::client
    end

    subgraph GATEWAY ["🛡️ 2. ทางผ่านและกระจายโหลด (Edge & Reverse Proxy)"]
        Proxy["🌐 Vercel Edge / Nginx Server<br/>• จัดการ HTTPS & Static Assets (Cache 1y)<br/>• Reverse Proxy ส่งต่อคำขอ /api"]:::proxy
    end

    subgraph BACKEND ["⚙️ 3. เซิร์ฟเวอร์และตรรกะระบบ (Backend Engine)"]
        API["🚀 Express.js API Core<br/>• สถาปัตยกรรมแบบ Feature-First<br/>• Smart Cache (HTTP 304 ETag)<br/>• เซสชันปลอดภัย & Rate Limiting"]:::backend
        DiscordModule["🤖 Discord Webhook Engine<br/>• แจ้งเตือนออเดอร์ใหม่ & ยกเลิก<br/>• ส่งรายงานสรุปยอดขายอัตโนมัติ"]:::backend
    end

    subgraph STORAGE ["🗄️ 4. แหล่งจัดเก็บข้อมูล (Database Layer)"]
        Database[("🐘 PostgreSQL 17+ Database<br/>• เมนูอาหาร, ออเดอร์, เซสชัน<br/>• B-Tree Indexes & Connection Pool")]:::db
    end

    subgraph EXTERNAL ["☁️ 5. บริการภายนอก (External Cloud Services)"]
        CronBot["⏰ cron-job.org (Keep-Alive)<br/>• ยิง Ping /api/health ทุก 10-12 นาที<br/>• ป้องกัน Render Sleep"]:::ext
        DiscordApp["💬 Discord Channels<br/>• #orders • #cancels • #reports"]:::ext
    end

    Customer -->|"ส่งคำสั่งซื้อ / Polling สถานะ (4s)"| Proxy
    Admin -->|"จัดการออเดอร์ / ดูสถิติ (4s & 15s)"| Proxy
    Proxy -->|"Proxy Pass /api (พร้อม ETag If-None-Match)"| API
    API <-->|"Query & Mutate Data (pg.Pool + Indexes)"| Database
    API -->|"Trigger Webhook Events"| DiscordModule
    DiscordModule ==>|"ส่งการ์ดแจ้งเตือน Embeds"| DiscordApp
    CronBot -.->|"HTTP GET/HEAD Ping ปลุกเซิร์ฟเวอร์"| API
```

---

## 🌟 ฟีเจอร์หลักของระบบ (Key Features)

### 🛍️ หน้าร้านค้าลูกค้า (Customer Storefront)
* **Glassmorphism UI + Fluid Typography**: แสดงผลสวยงาม Responsive บนมือถือ แท็บเล็ต และคอมพิวเตอร์
* **เลือกน้ำสลัดยืดหยุ่น**: จับคู่น้ำสลัดตามใจชอบ หรือเลือก "ไม่รับน้ำสลัด" (`dressing_id: 0`)
* **ตะกร้า Optimistic UI + Debounce (500ms)**: ปรับจำนวนสินค้าทันที ไม่ต้องรอโหลด รวมคำขอลดภาระเซิร์ฟเวอร์
* **Smart Polling Auto-Track (0 คลิก)**: ดึงออเดอร์ล่าสุดของเซสชันขึ้นมาติดตามอัตโนมัติ ซิงค์ทุก 4s และหยุดเมื่อเสร็จสิ้น
* **แอนิเมชันความคืบหน้า 5 สเต็ป**:
  1. `รอดำเนินการ` -> 2. `รับออเดอร์แล้ว` -> 3. `กำลังเตรียมอาหาร` -> 4. `พร้อมรับอาหาร` หรือ `กำลังจัดส่ง` -> 5. `รับอาหารแล้ว` หรือ `จัดส่งแล้ว`
* **Web Audio Context Bell Chime**: เสียงกระดิ่งสังเคราะห์ (Harmonic Sine Wave) แจ้งเตือนเมื่อออเดอร์เปลี่ยนสถานะและสั่งซื้อสำเร็จ
* **E-Receipt Modal**: หน้าต่างสลิปคำสั่งซื้ออิเล็กทรอนิกส์ พร้อมสรุปค่าจัดส่งตามรูปแบบการรับอาหาร

### ⚙️ ระบบผู้ดูแลระบบ (Admin Management Portal)
* **KDS Kanban & Table View (Smart Polling 4s)**: อัปเดตออเดอร์เข้าใหม่ทุก 4s แยกคอลัมน์ตามขั้นตอนครัว พร้อมปุ่มเปลี่ยนสถานะ
* **Analytics Dashboard (Smart Polling 15s)**: สรุปยอดขายรอบปัจจุบัน (Active Batch), วันนี้, เดือนนี้, รวมทั้งหมด, อัตราการยกเลิก และ 5 เมนูขายดี
* **Menu & Category CRUD**: เพิ่ม ลบ แก้ไข รายการอาหาร รูปภาพ ราคา หมวดหมู่ และสวิตช์เปิด/ปิดจำหน่าย
* **Dressing Management**: จัดการเพิ่ม แก้ไข ปิดใช้งานน้ำสลัด (ป้องกันการลบหากมีประวัติการสั่งซื้อ)
* **Store Control & Announcements**: สลับเปิด/ปิดร้าน พิมพ์ข้อความประกาศหน้าร้าน ซิงค์สดไปยังลูกค้าทันที
* **Daily Closing & Reset Queue**: สรุปยอดขายส่งเข้า Discord อัตโนมัติเมื่อปิดร้าน พร้อมรีเซ็ตลำดับคิวประจำวัน

### 🤖 ระบบแจ้งเตือน Discord Webhook อัตโนมัติ
* **#orders (แจ้งเตือนออเดอร์ใหม่)**: การ์ดสีฟ้า แสดงรหัสออเดอร์, คิว, รายการอาหาร, น้ำสลัด, โน้ตพิเศษ, ยอดเงิน, รูปแบบจัดส่ง, เบอร์โทร
* **#cancels (แจ้งเตือนยกเลิกออเดอร์)**: แก้ไขข้อความในห้องเดิมและสั่งลบใน 5s พร้อมส่งการ์ดสีแดงเข้าห้องยกเลิก แจ้งผู้ยกเลิกและเหตุผล ป้องกันครัวทำซ้ำ
* **#reports (รายงานสรุปยอดประจำวัน)**: ส่งการ์ดสีเขียวมรกต สรุปยอดขายรวม, จำนวนออเดอร์, อัตราการยกเลิก และเมนูขายดีประจำวัน เมื่อกดรีเซ็ตคิว

---

## 🚦 กฎเกณฑ์ทางธุรกิจและความปลอดภัย (Business Rules & Security)

### 📌 กฎเกณฑ์ทางธุรกิจ (Business Rules)
* **Anti-Spam / Concurrent Order Guard**: 1 เบอร์โทรศัพท์ หรือ 1 ตะกร้าเซสชัน สั่งได้ทีละ 1 ออเดอร์ (ตอบกลับ `HTTP 429` หากยังมีออเดอร์ดำเนินการอยู่)
* **Store Status Guard**: ไม่อนุญาตให้สร้างออเดอร์ใหม่เมื่อร้านปิด (`is_open = false`)
* **Order Cancellation Rules**:
  * ลูกค้ายกเลิกได้เฉพาะสถานะ `รอดำเนินการ` เท่านั้น และต้องระบุเหตุผล 1-20 ตัวอักษร
  * ป้องกัน IDOR: ตรวจสอบ `session_id` ต้องตรงกับผู้สั่งซื้อเท่านั้น
* **Admin Workflow State Machine**:
  * *รับเองที่ร้าน*: `รอดำเนินการ` -> `รับออเดอร์แล้ว` -> `กำลังเตรียมอาหาร` -> `พร้อมรับอาหาร` -> `รับอาหารแล้ว`
  * *จัดส่ง*: `รอดำเนินการ` -> `รับออเดอร์แล้ว` -> `กำลังเตรียมอาหาร` -> `กำลังจัดส่ง` -> `จัดส่งแล้ว`
  * ไม่อนุญาตให้ข้ามขั้นตอน หรือย้อนกลับสถานะ
* **Data Deletion Safety**:
  * ไม่อนุญาตให้ลบเมนูอาหาร หรือน้ำสลัด หากเคยมีประวัติถูกสั่งซื้อในระบบ (แนะนำให้ปิดจำหน่ายแทน)
  * การลบออเดอร์ในหน้าแอดมินใช้ระบบ **Soft Delete** (`deleted_at = NOW()`)

### 🔒 มาตรฐานความปลอดภัย (Security Standards)
* **RFC 9457 Problem Details**: คลาสข้อผิดพลาดเฉพาะทาง (`NotFoundError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`) ซ่อน Stack Trace ใน Production
* **Secure Cookie Sessions**:
  * `springroll_admin_session`: คุกกี้แอดมิน (UUIDv4, `HttpOnly`, `SameSite`, `Secure` ในโหมด Prod, อายุ 24 ชม.)
  * `springroll_cart_session`: คุกกี้ตะกร้าสินค้าของลูกค้า (UUIDv4, `HttpOnly`, `SameSite`)
* **PII Masking**: ซ่อนข้อมูลส่วนบุคคล (`customer_name`, `customer_phone`, `address`) เป็น `'*** ข้อมูลถูกซ่อนเพื่อความปลอดภัย ***'` บน API ตรวจสอบสถานะ หากไม่ใช่แอดมินและไม่ใช่เจ้าของออเดอร์
* **100% Parameterized SQL**: ใช้ `$1, $2, ...` ทุกจุด ป้องกัน SQL Injection สมบูรณ์
* **Payload Limit**: จำกัดขนาด JSON Body สูงสุด `100kb` ป้องกัน DoS
* **Dynamic CORS Whitelist**: รองรับ `localhost`, `CORS_ORIGIN`, โดเมน `*.vercel.app` อัตโนมัติ หรือเปิด `ALLOW_DYNAMIC_CORS=true`

### ⏱️ การจำกัดอัตราคำขอ (Rate Limiting Breakdown)
| ขอบเขต / Endpoint | โควต้าคำขอ (Quota) | หน้าที่ |
|---|---|---|
| `POST /api/orders` | 10 ครั้ง / 15 นาที | ป้องกันสแปมการสร้างออเดอร์ |
| `PATCH /api/orders/:id/status` | 5 ครั้ง / 15 นาที | ป้องกันสแปมการกดยกเลิกออเดอร์ |
| `POST /api/admin/login` | 5 ครั้ง / 15 นาที | ป้องกัน Brute-Force Password |
| `/api/cart/*` | 150 ครั้ง / 15 นาที | ป้องกันการยิงสแปมตะกร้าสินค้า |
| `GET /api/orders/track/:order_number` | 300 ครั้ง / 15 นาที | รองรับ Customer Smart Polling (4s) |
| `/api/store/*` | 300 ครั้ง / 15 นาที | รองรับ Store Status Polling (5-15s) |
| `/api/*` (General API) | 600 ครั้ง / 15 นาที | ป้องกัน DoS ทั่วไป (ข้ามการจำกัดสำหรับ Health Check) |

---

## 📁 โครงสร้างโปรเจกต์ (Repository Structure)

```
Food-Order-Web-Application/
├── .env.example                    # ตัวอย่าง Environment Variables
├── docker-compose.yml              # ควบคุม Container Orchestration ทั้งระบบ (Full-Stack)
├── LICENSE                         # ใบอนุญาต MIT
├── README.md                       # เอกสารหลักของโปรเจกต์
├── backend/                        # เซิร์ฟเวอร์หลังบ้าน (Node.js + Express)
│   ├── Dockerfile                  # Docker Image สำหรับ Backend
│   ├── package.json                # Dependencies & Scripts ของ Backend
│   ├── README.md                   # คู่มือสถาปัตยกรรมและ API Backend
│   ├── server.js                   # บูตเซิร์ฟเวอร์, ตรวจ Database Pool & Auto-Migration
│   └── src/                        # ซอร์สโค้ดจัดโครงสร้าง Feature-First
│       ├── discord.js              # โมดูล Discord Webhook (#orders, #cancels, #reports)
│       ├── index.js                # รวม Express App, Middlewares, Rate Limiting, Routes
│       ├── admin/                  # ฟีเจอร์: แอดมินหลังบ้าน (CRUD, Analytics, Auth)
│       ├── cart/                   # ฟีเจอร์: ตะกร้าสินค้าและการจัดการเซสชัน
│       ├── config/                 # คอนฟิกส่วนกลาง & Database Pool
│       ├── dressings/              # ฟีเจอร์: น้ำสลัดฝั่งลูกค้า
│       ├── menu/                   # ฟีเจอร์: เมนูอาหารและหมวดหมู่
│       ├── orders/                 # ฟีเจอร์: คำสั่งซื้อและการติดตามสถานะ
│       ├── shared/                 # Error classes, Logger (Pino), Middleware, Validators (Zod)
│       └── store/                  # ฟีเจอร์: สถานะร้านค้า, ลำดับคิว, ประกาศ
├── frontend/                       # ส่วนติดต่อผู้ใช้ (React 18 + Vite)
│   ├── Dockerfile                  # Docker Image สำหรับ Frontend (Nginx)
│   ├── index.html                  # HTML หลักของ React SPA
│   ├── nginx.conf                  # คอนฟิก Nginx Web Server & API Reverse Proxy
│   ├── package.json                # Dependencies & Scripts ของ Frontend
│   ├── postcss.config.js           # คอนฟิก PostCSS
│   ├── README.md                   # คู่มือสถาปัตยกรรมและ UX/UI Frontend
│   ├── tailwind.config.js          # คอนฟิก Tailwind CSS
│   ├── vercel.json                 # คอนฟิก Reverse Proxy & Rewrites บน Vercel
│   ├── vite.config.js              # คอนฟิก Vite
│   └── src/
│       ├── App.jsx                 # คอมโพเนนต์หลัก & Routing
│       ├── index.css               # สไตล์ Glassmorphism, Animations, Fluid Typography
│       ├── main.jsx                # จุดเริ่มต้น React DOM Render
│       ├── api/api.js              # Fetch Wrapper จัดการ Request, Error, Cookies
│       ├── components/             # CartModal, CartSidebar, CheckoutModal, DressingModal, Header, MenuGrid, MobileCartBar, OrderSlipModal, TrackingModal
│       ├── context/                # AdminContext, AlertContext, AuthContext, CartContext, ToastContext
│       ├── hooks/queries.js        # Smart Polling & TanStack React Query Hooks
│       ├── pages/                  # CustomerApp.jsx, AdminApp.jsx & admin tabs
│       └── utils/audio.js          # Web Audio Context Bell Chime
└── database/                       # ฐานข้อมูล PostgreSQL
    ├── README.md                   # คู่มือโครงสร้าง Database, ENUMs, Indexes
    └── schema.sql                  # สคริปต์สร้างตาราง, ENUMs, Foreign Keys, Indexes, Seed Data
```

---

## 🚀 การติดตั้งและเปิดใช้งาน (Getting Started)

### วิธีที่ 1: รันด้วย Docker Compose (Local Development)

1. คัดลอกและตั้งค่า Environment Variables:
   ```bash
   cp .env.example .env
   ```
2. Build และเปิด Containers:
   ```bash
   docker compose up -d --build
   ```
3. เข้าใช้งานระบบ:
   * **หน้าร้านค้าลูกค้า**: `http://localhost`
   * **ระบบจัดการแอดมิน**: `http://localhost/admin`
   * **Backend API**: `http://localhost/api`
   * **Health Check**: `http://localhost/api/health`

### การทดสอบออนไลน์ด้วย Cloudflare Tunnel (ทดสอบ Webhook & อุปกรณ์จริง)

1. รัน Docker Compose: `docker compose up -d --build`
2. เปิด Tunnel ชี้ไปที่พอร์ต Frontend (Port 80):
   ```bash
   npx cloudflared tunnel --url http://localhost
   ```
3. นำ URL ที่ได้ (`https://xxxx.trycloudflare.com`) ไปเปิดทดสอบบนมือถือหรือตั้งค่า Discord Webhook

---

### วิธีที่ 2: Deploy ฟรีผ่าน Cloud 100% (Neon + Render + Vercel + cron-job.org)

| ส่วนประกอบ | แพลตฟอร์ม | แผนบริการ (Tier) | หน้าที่ |
|---|---|---|---|
| 🐘 **Database** | [Neon.tech](https://neon.tech) | Free Tier (0.5 GiB) | PostgreSQL Serverless เก็บเมนู, ออเดอร์, คิว |
| ⚙️ **Backend API** | [Render.com](https://render.com) | Free Web Service | Node.js + Express API, ประมวลผลคำสั่งซื้อ & แจ้งเตือน Discord |
| 🌐 **Frontend** | [Vercel.com](https://vercel.com) | Free Hobby | React 18 SPA + Reverse Proxy ส่งต่อ `/api` ไปยัง Render |
| ⏰ **Keep-Alive** | [cron-job.org](https://cron-job.org) | Free 100% | Ping `/api/health` ทุก 10-12 นาที ป้องกัน Render Sleep |

---

#### 🐘 ขั้นตอนที่ 1: เตรียมฐานข้อมูลบน Neon.tech

1. เข้า [Neon.tech](https://neon.tech) -> **Create Project** -> ตั้งชื่อ `springroll-db` -> เลือก Region `Singapore (ap-southeast-1)`
2. ไปที่ **SQL Editor** -> คัดลอกโค้ดจาก [database/schema.sql](file:///d:/Food-Order-Web-Application/database/schema.sql) ทั้งหมดมาวาง -> กด **Run**
3. ไปที่ **Dashboard** -> คัดลอก **Connection string** (`Pooled connection` พร้อม `?sslmode=require`)
   * *ตัวอย่าง*: `postgres://username:password@ep-xyz.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`

---

#### ⚙️ ขั้นตอนที่ 2: Deploy Backend API บน Render.com

1. เข้า [Render.com](https://render.com) -> **New +** -> **Web Service** -> เลือก Repo `Food-Order-Web-Application`
2. กำหนดค่า Build & Deploy:
   * **Name**: `springroll-backend`
   * **Region**: `Singapore (Southeast Asia)`
   * **Branch**: `main`
   * **Root Directory**: `backend` *(⚠️ ต้องระบุ `backend`)*
   * **Runtime**: `Node`
   * **Build Command**: `npm ci --omit=dev`
   * **Start Command**: `node server.js`
   * **Instance Type**: `Free`
3. เพิ่ม Environment Variables:

   | Key | Value ตัวอย่าง / คำแนะนำ | ความจำเป็น |
   |---|---|---|
   | `NODE_ENV` | `production` | จำเป็น |
   | `DATABASE_URL` | *Connection string จาก Neon* | จำเป็น |
   | `JWT_SECRET` | *สุ่ม 32 ตัวอักษรขึ้นไป* | จำเป็น |
   | `CORS_ORIGIN` | `https://your-app.vercel.app` *(ใส่ `*` ก่อนได้ แล้วแก้เป็นโดเมน Vercel หลัง Deploy)* | จำเป็น |
   | `ADMIN_INIT_USERNAME` | `admin` | ตัวเลือก |
   | `ADMIN_INIT_PASSWORD` | `YourStrongAdminPassword123` | ตัวเลือก |
   | `DISCORD_WEBHOOK_URL` | `https://discord.com/api/webhooks/...` | ตัวเลือก |
   | `DISCORD_CANCEL_WEBHOOK_URL`| `https://discord.com/api/webhooks/...` | ตัวเลือก |
   | `DISCORD_REPORT_WEBHOOK_URL`| `https://discord.com/api/webhooks/...` | ตัวเลือก |

4. กด **Deploy Web Service** -> รอสถานะ `Live` -> ทดสอบเปิด `https://springroll-backend.onrender.com/api/health`

---

#### 🌐 ขั้นตอนที่ 3: Deploy Frontend บน Vercel.com

1. แก้ไข [frontend/vercel.json](file:///d:/Food-Order-Web-Application/frontend/vercel.json) ชี้ `destination` ไปที่ Render URL:
   ```json
   "rewrites": [
     {
       "source": "/api/(.*)",
       "destination": "https://springroll-backend.onrender.com/api/$1"
     },
     {
       "source": "/(.*)",
       "destination": "/index.html"
     }
   ]
   ```
2. Commit และ Push:
   ```bash
   git add frontend/vercel.json
   git commit -m "Update backend API proxy URL in vercel.json"
   git push
   ```
3. เข้า [Vercel.com](https://vercel.com) -> **Add New...** -> **Project** -> Import Repo
4. กำหนดการตั้งค่า:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `frontend` *(⚠️ ต้องเลือก `frontend`)*
   * **Build and Output Settings**: ค่าเริ่มต้น (`npm run build`, output: `dist`)
   * กด **Deploy**
5. นำ Domain ที่ได้จาก Vercel (เช่น `https://springroll-store.vercel.app`) ไปอัปเดต `CORS_ORIGIN` ใน Render Service

---

#### ⏰ ขั้นตอนที่ 4: ตั้งค่า cron-job.org ป้องกัน Render Sleep (Keep-Alive 24/7)

1. เข้าสู่ระบบ [cron-job.org](https://cron-job.org) -> **Cronjobs** -> **CREATE CRONJOB**
2. ตั้งค่า:
   * **Title**: `Springroll Backend Keep-Alive`
   * **URL**: `https://springroll-backend.onrender.com/api/health`
   * **Schedule**: **Every 10 minutes** หรือ **Every 12 minutes**
   * **Method**: `GET` หรือ `HEAD`
3. กด **CREATE**

---

## 📜 ใบอนุญาต (License)

เผยแพร่ภายใต้ [MIT License](LICENSE) ใช้งานและพัฒนาต่อยอดได้อย่างอิสระ
