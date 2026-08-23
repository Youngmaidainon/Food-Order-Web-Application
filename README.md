<div align="center">
  <h1>🥗 ระบบสั่งอาหารออนไลน์ (Spring Roll Online Store)</h1>
  <p><strong>เว็บแอปพลิเคชันสั่งซื้ออาหารออนไลน์ระดับ Production สไตล์ Glassmorphism สำหรับร้านสปริงโรลและอาหารเพื่อสุขภาพ ออกแบบตามสถาปัตยกรรมแบบ Feature-First, ซิงค์ข้อมูลเรียลไทม์ผ่าน Smart Polling + Smart Cache (HTTP 304 ETag), ระบบตะกร้าสินค้าแบบ Optimistic UI, การแจ้งเตือนและส่งรายงานอัตโนมัติผ่าน Discord Webhook พร้อมรองรับการ Deploy บน Cloud แบบฟรี 100%</strong></p>

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
> พัฒนาตามหลักการ **Separation of Concerns (SoC)**, สถาปัตยกรรม **Feature-First** และมาตรฐานความปลอดภัย **OWASP Security Best Practices** รองรับทั้งการรันผ่าน **Docker Compose** ในเครื่อง หรือ Deploy ขึ้นระบบ Cloud ระดับ Production Free Tier

---

## 📐 สถาปัตยกรรมระบบ (System Architecture)

```mermaid
flowchart TD
    %% กำหนดชุดสีและสไตล์ของแต่ละเลเยอร์ (GitHub Dark & Light Compatible)
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

    %% เส้นทางการเชื่อมต่อและการไหลของข้อมูล (Data Flow & Interactions)
    Customer -->|"ส่งคำสั่งซื้อ / Polling สถานะ (4s)"| Proxy
    Admin -->|"จัดการออเดอร์ / ดูสถิติ (4s & 15s)"| Proxy

    Proxy -->|"Proxy Pass /api (พร้อม ETag If-None-Match)"| API

    API <-->|"Query & Mutate Data (pg.Pool + Indexes)"| Database
    API -->|"Trigger Webhook Events"| DiscordModule

    DiscordModule ==>|"ส่งการ์ดแจ้งเตือน Embeds"| DiscordApp
    CronBot -.->|"HTTP GET Ping ปลุกเซิร์ฟเวอร์"| API
```

---

## 🌟 จุดเด่นและฟีเจอร์สำคัญของระบบ (Key Features)

### 🛍️ ฝั่งลูกค้าร้านค้า (Customer Storefront)
- **ดีไซน์ระดับพรีเมียม (Glassmorphism & Fluid Typography)**: รองรับการใช้งานอย่างลื่นไหลบนทุกขนาดหน้าจอ ทั้งมือถือ แท็บเล็ต และคอมพิวเตอร์
- **การเลือกน้ำสลัดที่ยืดหยุ่น (Dressing Selection)**: สามารถเลือกน้ำสลัดที่ต้องการ หรือเลือกตัวเลือก "ไม่รับน้ำสลัด" ได้อย่างอิสระ
- **ตะกร้าสินค้าตอบสนองทันที (Optimistic UI & 500ms Debounce)**: ปรับจำนวนสินค้าได้ทันทีโดยไม่ต้องรอโหลด พร้อมการหน่วงเวลาส่งข้อมูลเพื่อประหยัดทรัพยากร
- **การติดตามคำสั่งซื้ออัจฉริยะ (Smart Polling Auto-Track)**: ดึงข้อมูลออเดอร์ล่าสุดของลูกค้ามาแสดงผลทันที 0 คลิก พร้อมแถบสถานะภาพ 5 สเต็ป ซิงค์ทุก 4 วินาที และหยุดอัตโนมัติเมื่อออเดอร์เสร็จสิ้น
- **การแจ้งเตือนด้วยเสียง (Harmonic Bell Chime)**: เสียงแจ้งเตือนนุ่มนวลผ่าน Web Audio Context API เมื่อสถานะออเดอร์มีการเปลี่ยนแปลง
- **สลิปคำสั่งซื้ออิเล็กทรอนิกส์ (E-Receipt)**: หน้าต่างสรุปสลิปคำสั่งซื้ออย่างเป็นทางการ พร้อมเงื่อนไขแสดงค่าจัดส่งที่ถูกต้องตามรูปแบบการรับอาหาร

### ⚙️ ฝั่งผู้ดูแลระบบ (Admin Management Portal)
- **กระดานจัดการออเดอร์แบบสด (Smart Polling KDS Kanban & Table View)**: อัปเดตออเดอร์เข้าใหม่ทุก 4 วินาที พร้อมระบบหยุด Polling อัตโนมัติเมื่อยุบจอเพื่อประหยัดทรัพยากร
- **แดชบอร์ดสถิติและยอดขาย (Analytics Dashboard)**: แสดงสรุปยอดขายวันนี้/เดือนนี้/ทั้งหมด, อัตราการยกเลิก และเมนูขายดี 5 อันดับแรก พร้อมซิงค์ทุก 15 วินาที
- **ระบบจัดการเมนูและน้ำสลัด (Full Menu & Dressing CRUD)**: เพิ่ม ลบ แก้ไข รายการอาหาร รูปภาพ ราคา และสถานะเปิด/ปิดจำหน่าย
- **การเปิด/ปิดร้านและข้อความประกาศ (Store Settings)**: สลับสถานะร้านและพิมพ์ประกาศเพื่อส่งต่อข้อมูลไปยังหน้าร้านลูกค้าแบบเรียลไทม์ทันที
- **การปิดรอบและรีเซ็ตคิวประจำวัน (Daily Closing & Reset Queue)**: ส่งสรุปยอดขายเข้า Discord ทันทีเมื่อปิดร้าน พร้อมรีเซ็ตลำดับคิวใหม่อัตโนมัติ

### 🤖 ระบบแจ้งเตือน Discord Webhook อัตโนมัติ
- **ใบแจ้งเตือนออเดอร์ใหม่**: ส่งการ์ด Embed แสดงรายการอาหาร, น้ำสลัด, ยอดเงิน, รูปแบบการจัดส่ง และเบอร์โทรลูกค้าเข้าห้อง Discord ทันที
- **การจัดการเมื่อมีการยกเลิกออเดอร์**: แก้ไขข้อความเดิมพร้อมสั่งลบข้อความเก่าภายใน 5 วินาที และส่งแจ้งเตือนการยกเลิกใหม่เพื่อป้องกันครัวทำอาหารซ้ำ
- **รายงานสรุปยอดขายประจำวัน**: สรุปยอดขายรวม, จำนวนออเดอร์สำเร็จ/ยกเลิก และเมนูขายดีประจำวัน ส่งเข้า Discord อัตโนมัติเมื่อปิดร้าน

---

## 🛡️ มาตรฐานความปลอดภัยและการเพิ่มประสิทธิภาพ (Security & Optimization)

### 🔒 ด้านความปลอดภัย (Cyber Security)
- **มาตรฐาน RFC 9457 Problem Details**: ดักจับและจัดการ Error ส่วนกลางด้วย `globalErrorHandler` พร้อมซ่อน Stack Trace บนสภาพแวดล้อม Production
- **การตรวจสอบสิทธิ์ด้วยเซสชัน (Session Auth)**: ตรวจสอบสิทธิ์แอดมินผ่านคุกกี้ที่ปลอดภัย `HttpOnly` และ `SameSite` ป้องกันการโจมตีแบบ XSS
- **การปกป้องข้อมูลส่วนบุคคล (PII Data Protection & Masking)**: ซ่อนข้อมูลระบุตัวตน (ชื่อ, เบอร์โทรศัพท์ และที่อยู่) อัตโนมัติบน API ติดตามสถานะคำสั่งซื้อ (`GET /api/orders/track/:order_number`) หากผู้ขอไม่ใช่แอดมินและไม่ใช่เจ้าของเซสชันที่สั่งซื้อ
- **การจำกัดอัตราคำขอที่เข้มงวด (Strict Rate Limits)**:
  - `POST /api/admin/login`: จำกัด 5 ครั้ง / 15 นาที (ป้องกัน Brute Force)
  - `GET /api/orders/track/:order_number`: จำกัด 300 ครั้ง / 15 นาที (รองรับ Customer Smart Polling)
  - `/api/store/*`: จำกัด 300 ครั้ง / 15 นาที (รองรับ Store Status Polling)
  - `/api/*` ทั่วไป: จำกัด 600 ครั้ง / 15 นาที (ป้องกัน DoS และ Scraper)
- **Header ความปลอดภัยและ CORS**: ติดตั้ง `Helmet` และจำกัด `CORS_ORIGIN` เฉพาะ Whitelist Domains ในโหมด Production
- **คำสั่ง SQL ปลอดภัย 100%**: ใช้ Parameterized Queries (`$1, $2, ...`) ทุกจุด ป้องกัน SQL Injection อย่างสมบูรณ์

### 🚀 ด้านการเพิ่มประสิทธิภาพและการจัดการแคช (Optimization & Caching Strategy)
- **สถาปัตยกรรม Smart Polling & Intelligent Cache (HTTP 304 + TanStack Query)**:
  - **Dynamic API Smart Caching**: เซิร์ฟเวอร์เปิดใช้งาน `ETag` (Strong ETag) เมื่อไคลเอนต์ส่งคำขอ Polling พร้อม `If-None-Match` หากข้อมูลไม่มีการเปลี่ยนแปลง เซิร์ฟเวอร์จะตอบกลับด้วย `HTTP 304 Not Modified` ทันทีโดยไม่ต้องส่ง Body ซ้ำ ช่วยลดภาระ CPU และประหยัด Bandwidth กว่า 95%
  - **Adaptive Polling Intervals**: ปรับความถี่ตามบริบทการใช้งาน — หน้าออเดอร์แอดมิน 4s, หน้าติดตามออเดอร์ลูกค้า 4s, สถานะร้านค้า 15s, แดชบอร์ดสถิติ 15s
  - **Tab Visibility Auto-Pause**: หยุด Polling อัตโนมัติเมื่อผู้ใช้สลับไปแท็บอื่นหรือยุบหน้าต่าง (`document.visibilityState === 'hidden'`) เพื่อประหยัดแบตเตอรี่และ Bandwidth
  - **Window Focus & Tab Revalidation**: ดึงข้อมูลสดล่าสุดทันทีเมื่อผู้ใช้สลับกลับมาเปิดหน้าเว็บ (`refetchOnWindowFocus: true`)
  - **Long-term Cache (Static Assets)**: แคชไฟล์ใน `/assets/` (JS/CSS ที่มี Hash กำกับ) นาน 1 ปี (`public, max-age=31536000, immutable`) โหลดเว็บเร็วระดับเสี้ยววินาที
- **Optimistic UI และการหน่วงเวลา Debounce**: อัปเดต UI ทันที และหน่วงเวลา 500 มิลลิวินาที ก่อนส่งคำขออัปเดตตะกร้าสินค้าไปยังเซิร์ฟเวอร์
- **การจัดการ Connection Pooling & Indexes**: ควบคุมการเชื่อมต่อฐานข้อมูลผ่าน `pg.Pool` พร้อมดัชนี B-Tree ที่ครอบคลุมคิวรี่ Polling ทั้งหมด

---

## 📁 โครงสร้างโปรเจกต์ (Repository Structure)

```
Food-Order-Web-Application/
├── .env.example                    # ไฟล์ตัวอย่างการตั้งค่า Environment Variables
├── docker-compose.yml              # ตัวควบคุม Container Orchestration ทั้งระบบ (Full-Stack)
├── LICENSE                         # ใบอนุญาตการใช้งานซอฟต์แวร์ (MIT)
├── README.md                       # เอกสารคู่มือหลักของโปรเจกต์
├── backend/                        # ซอร์สโค้ดและระบบเซิร์ฟเวอร์หลังบ้าน (Node.js + Express)
│   ├── Dockerfile                  # คำสั่งสร้าง Docker Image สำหรับ Backend
│   ├── package.json                # รายการ Dependencies และ Scripts ของ Backend
│   ├── README.md                   # เอกสารคู่มือสถาปัตยกรรมและ API ของ Backend
│   ├── render.yaml                 # คอนฟิก Infrastructure-as-Code สำหรับ Render
│   ├── server.js                   # บูตเซิร์ฟเวอร์, เชื่อมต่อ Database และ Auto-Migration
│   └── src/                        # ซอร์สโค้ดจัดโครงสร้างแบบ Feature-First
│       ├── discord.js              # โมดูลส่ง Webhook แจ้งเตือนและจัดการข้อความใน Discord
│       ├── index.js                # จุดรวม Express App, Middlewares, Rate Limiting และ Routes
│       ├── admin/                  # ฟีเจอร์: ระบบจัดการแอดมินหลังบ้าน
│       │   ├── admin_controller.js
│       │   ├── analytics_controller.js
│       │   ├── auth_controller.js
│       │   ├── categories_controller.js
│       │   ├── dressings_controller.js
│       │   ├── menu_controller.js
│       │   └── orders_controller.js
│       ├── cart/                   # ฟีเจอร์: ตะกร้าสินค้าและการจัดการเซสชัน
│       │   ├── cart_controller.js
│       │   ├── cart_middleware.js
│       │   ├── cart_repository.js
│       │   └── cart_service.js
│       ├── config/                 # ฟีเจอร์: Centralized Config & Database Pool
│       │   ├── config.js
│       │   └── database.js
│       ├── dressings/              # ฟีเจอร์: การดึงข้อมูลน้ำสลัดสำหรับลูกค้า
│       │   ├── dressings_controller.js
│       │   ├── dressings_repository.js
│       │   └── dressings_service.js
│       ├── menu/                   # ฟีเจอร์: การดึงข้อมูลเมนูอาหารและหมวดหมู่
│       │   ├── menu_controller.js
│       │   ├── menu_repository.js
│       │   └── menu_service.js
│       ├── orders/                 # ฟีเจอร์: คำสั่งซื้อและการติดตามสถานะ
│       │   ├── orders_controller.js
│       │   ├── orders_repository.js
│       │   └── orders_service.js
│       ├── shared/                 # โมดูลและมิดเดิลแวร์ส่วนกลาง
│       │   ├── errors.js           # โครงสร้างคลาส Error (RFC 9457)
│       │   ├── logger.js           # ระบบบันทึก Log JSON (Pino)
│       │   ├── middleware/         # auth.js, errorHandler.js, requestContext.js, validate.js
│       │   └── validators/         # index.js (Validation Schemas)
│       └── store/                  # ฟีเจอร์: สถานะเปิด/ปิดร้าน, ลำดับคิว, และประกาศ
│           ├── store_controller.js
│           ├── store_repository.js
│           └── store_service.js
├── frontend/                       # ซอร์สโค้ดส่วนติดต่อผู้ใช้หน้าร้านและหลังบ้าน (React 18 + Vite)
│   ├── Dockerfile                  # คำสั่งสร้าง Docker Image สำหรับ Frontend (Nginx)
│   ├── index.html                  # ไฟล์ HTML หลักของ React SPA
│   ├── nginx.conf                  # คอนฟิก Web Server Nginx และ API Reverse Proxy
│   ├── package.json                # รายการ Dependencies และ Scripts ของ Frontend
│   ├── postcss.config.js           # คอนฟิก PostCSS สำหรับ Tailwind CSS
│   ├── README.md                   # เอกสารคู่มือสถาปัตยกรรมและเทคนิค UX/UI ของ Frontend
│   ├── tailwind.config.js          # คอนฟิกธีมและสไตล์สี Tailwind CSS
│   ├── vercel.json                 # คอนฟิก Reverse Proxy และ Rewrites สำหรับ Vercel
│   ├── vite.config.js              # คอนฟิก Vite Build Tool
│   └── src/
│       ├── App.jsx                 # คอมโพเนนต์หลักและระบบจัดการ Routing
│       ├── index.css               # สไตล์ธีม Glassmorphism, Animations และ Fluid Typography
│       ├── main.jsx                # จุดเริ่มต้น React DOM Render
│       ├── api/                    # api.js (Fetch Wrapper จัดการ Request & Error)
│       ├── components/             # คอมโพเนนต์ UI หน้าร้านและ Modals
│       │   ├── CartModal.jsx       # หน้าต่างตะกร้าสินค้าแบบ Bottom Sheet
│       │   ├── CartSidebar.jsx     # แถบตะกร้าสินค้าด้านข้างสำหรับ Desktop
│       │   ├── CheckoutModal.jsx   # หน้าต่างตรวจสอบรายการและกรอกข้อมูลจัดส่ง
│       │   ├── DressingModal.jsx   # หน้าต่างเลือกน้ำสลัด
│       │   ├── Header.jsx          # แถบเมนูด้านบน, โลโก้, สถานะร้าน, ปุ่มติดตาม, และตะกร้า
│       │   ├── MenuGrid.jsx        # การ์ดแสดงเมนูอาหารและตัวกรองหมวดหมู่
│       │   ├── MobileCartBar.jsx   # แถบตะกร้าสินค้าลอยตัวสำหรับ Mobile
│       │   ├── OrderSlipModal.jsx  # หน้าต่างสลิปใบเสร็จอิเล็กทรอนิกส์ (E-Receipt)
│       │   └── TrackingModal.jsx   # หน้าต่างค้นหาและติดตามสถานะออเดอร์ (Smart Polling)
│       ├── context/                # AdminContext, AlertContext, AuthContext, CartContext, ToastContext
│       ├── hooks/                  # queries.js (Smart Polling & React Query Hooks)
│       ├── pages/                  # CustomerApp.jsx, AdminApp.jsx
│       │   └── admin/              # Dashboard.jsx, Dressings.jsx, Login.jsx, Menu.jsx, Orders.jsx, Settings.jsx
│       └── utils/                  # audio.js (Web Audio Context Bell Chime)
└── database/                       # ซอร์สโค้ดและสคีมาฐานข้อมูล PostgreSQL
    ├── README.md                   # เอกสารคู่มือโครงสร้าง Database, ENUMs และ Indexes
    └── schema.sql                  # สคริปต์สร้างตาราง, ENUMs, Foreign Keys, Indexes และ Seed Data
```

---

## 🚀 การติดตั้งและเปิดใช้งานระบบ (Getting Started)

### วิธีที่ 1: รันด้วย Docker Compose (สำหรับรันในเครื่อง Local Development)

1. คัดลอกและตั้งค่า Environment Variables:
   ```bash
   cp .env.example .env
   ```
2. ทำการ Build และเปิด Containers:
   ```bash
   docker compose up -d --build
   ```
3. เข้าใช้งานระบบ:
   - **หน้าร้านค้าลูกค้า (Storefront)**: `http://localhost`
   - **ระบบจัดการแอดมิน (Admin Portal)**: `http://localhost/admin`
   - **Backend API**: `http://localhost/api`
   - **ตรวจสอบสถานะเซิร์ฟเวอร์ (Health Check)**: `http://localhost/api/health`

### การทดสอบแบบออนไลน์ผ่าน Cloudflare Tunnel (ทดสอบ Webhook และอุปกรณ์จริง 100%)

1. รันระบบผ่าน Docker Compose ตามปกติ: `docker compose up -d --build`
2. เปิด Tunnel ชี้ไปยังพอร์ต Frontend (Port 80):
   ```bash
   npx cloudflared tunnel --url http://localhost
   ```
3. นำ URL ที่ได้รับ (เช่น `https://xxxx.trycloudflare.com`) ไปเปิดทดสอบบนมือถือ หรือนำไปตั้งค่าเชื่อมต่อกับ Discord Webhook ได้ทันที

---

### วิธีที่ 2: คู่มือการ Deploy ฟรีผ่าน Cloud แบบละเอียด 100% (Neon + Render + Vercel + cron-job.org)

สถาปัตยกรรมคลาวด์ฟรีระดับ Production โดยแยกส่วนการทำงานอย่างเป็นอิสระ:

| ส่วนประกอบ | แพลตฟอร์ม | แผนบริการ (Tier) | หน้าที่และความรับผิดชอบ |
|---|---|---|---|
| 🐘 **ฐานข้อมูล (Database)** | [Neon.tech](https://neon.tech) | Free Tier (0.5 GiB) | PostgreSQL Serverless เก็บข้อมูลเมนู, ออเดอร์, และคิว |
| ⚙️ **เซิร์ฟเวอร์ (Backend API)** | [Render.com](https://render.com) | Free Web Service | Node.js + Express API, ประมวลผลคำสั่งซื้อและรายงาน Discord |
| 🌐 **ส่วนติดต่อผู้ใช้ (Frontend)** | [Vercel.com](https://vercel.com) | Free Hobby | React 18 SPA + Reverse Proxy ส่งต่อคำขอ API ไปยัง Render |
| ⏰ **ระบบปลุกเซิร์ฟเวอร์ (Keep-Alive)** | [cron-job.org](https://cron-job.org) | Free 100% | ยิงคำขอ Ping ทุก 14 นาที ป้องกันไม่ให้ Render เข้าสู่โหมด Sleep |

---

#### 🐘 ขั้นตอนที่ 1: เตรียมฐานข้อมูล PostgreSQL บน Neon.tech

1. **สร้างโปรเจกต์ฐานข้อมูล**:
   - เข้าสู่ระบบ [Neon.tech](https://neon.tech) แล้วกด **Create Project**
   - ตั้งชื่อโปรเจกต์ (เช่น `springroll-db`)
   - เลือก **Region**: `Singapore (ap-southeast-1)` (แนะนำเพื่อความเร็วในการเชื่อมต่อจากไทย)
   - กด **Create Project**
2. **รันคำสั่งสร้างตารางและข้อมูลเริ่มต้น (Schema & Seeds)**:
   - ไปที่เมนู **SQL Editor** บนแถบด้านซ้ายของ Neon Console
   - เปิดไฟล์ [database/schema.sql](file:///d:/Food-Order-Web-Application/database/schema.sql) ในโปรเจกต์นี้ คัดลอกโค้ด SQL ทั้งหมดมาวางในช่อง Editor
   - กดปุ่ม **Run** เพื่อสร้างตาราง, ENUMs, Indexes, Triggers และข้อมูลเริ่มต้น (เมนูอาหารและน้ำสลัด)
3. **คัดลอก Connection String**:
   - ไปที่หน้า **Dashboard** ของ Neon
   - คัดลอกค่า **Connection string** (เลือกแท็บ `Pooled connection` หรือ `Direct connection` ที่มี `?sslmode=require`)
   - *ตัวอย่าง*: `postgres://username:password@ep-xyz.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`

---

#### ⚙️ ขั้นตอนที่ 2: Deploy Backend API บน Render.com

1. **สร้าง Web Service ใหม่**:
   - เข้าสู่ระบบ [Render.com](https://render.com) แล้วกด **New +** -> **Web Service**
   - เลือกเชื่อมต่อกับ Repository GitHub ของโปรเจกต์นี้ (`Food-Order-Web-Application`)
2. **กำหนดการตั้งค่าหลัก (Build & Deploy Settings)**:
   - **Name**: `springroll-backend` (หรือชื่อตามต้องการ)
   - **Region**: `Singapore (Southeast Asia)` (เลือกให้ตรงกับภูมิภาคของ Neon)
   - **Branch**: `main`
   - **Root Directory**: `backend` *(⚠️ สำคัญมาก: ต้องระบุ `backend`)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
3. **เพิ่มตัวแปร Environment Variables**:
   - เลื่อนลงมาที่หัวข้อ **Environment Variables** และกด **Add Environment Variable** ตามตารางนี้:

   | Key | Value ตัวอย่าง / คำแนะนำ | ความจำเป็น |
   |---|---|---|
   | `NODE_ENV` | `production` | จำเป็น |
   | `DATABASE_URL` | *วาง Connection string ที่คัดลอกมาจาก Neon* | จำเป็น |
   | `JWT_SECRET` | *กดปุ่ม **Generate** หรือพิมพ์สุ่ม 32 ตัวอักษรขึ้นไป* | จำเป็น |
   | `CORS_ORIGIN` | `https://your-app.vercel.app` *(ใส่โดเมน Vercel หลัง Deploy หรือใส่ `*` ก่อนได้)* | จำเป็น |
   | `ADMIN_INIT_USERNAME` | `admin` *(กำหนดชื่อผู้ใช้แอดมิน)* | ตัวเลือก |
   | `ADMIN_INIT_PASSWORD` | `YourStrongAdminPassword123` *(กำหนดรหัสผ่านแอดมิน)* | ตัวเลือก |
   | `DISCORD_WEBHOOK_URL` | `https://discord.com/api/webhooks/...` | ตัวเลือก |
   | `DISCORD_CANCEL_WEBHOOK_URL`| `https://discord.com/api/webhooks/...` | ตัวเลือก |
   | `DISCORD_REPORT_WEBHOOK_URL`| `https://discord.com/api/webhooks/...` | ตัวเลือก |

4. **เริ่ม Deploy และทดสอบ**:
   - กดปุ่ม **Deploy Web Service** ด้านล่างสุด แล้วรอ 1-2 นาทีจนขึ้นสถานะ `Live`
   - คัดลอก URL ของ Backend ที่ Render สร้างให้ เช่น `https://springroll-backend.onrender.com`
   - ทดสอบเปิด Browser ไปที่ `https://springroll-backend.onrender.com/api/health` หากได้ผลลัพธ์ `{"status":"ok",...}` แสดงว่า Backend พร้อมทำงาน 100%

---

#### 🌐 ขั้นตอนที่ 3: Deploy Frontend บน Vercel.com

1. **ปรับแต่ง Proxy Rewrites ในโค้ดก่อน Deploy**:
   - เปิดไฟล์ [frontend/vercel.json](file:///d:/Food-Order-Web-Application/frontend/vercel.json) ในเครื่องของคุณ
   - แก้ไขบรรทัด `destination` ในส่วน `/api/(.*)` ให้ชี้ไปยัง URL ของ Render Backend ที่ได้จากขั้นตอนที่ 2:
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
   - บันทึกไฟล์ ทำการ Commit และ Push ขึ้น GitHub:
     ```bash
     git add frontend/vercel.json
     git commit -m "Update backend API proxy URL in vercel.json"
     git push
     ```
2. **สร้างโปรเจกต์บน Vercel**:
   - เข้าสู่ระบบ [Vercel.com](https://vercel.com) แล้วกด **Add New...** -> **Project**
   - เลือก **Import** จาก Repository GitHub ของโปรเจกต์
3. **กำหนดการตั้งค่าโปรเจกต์ (Project Configuration)**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: กดปุ่ม **Edit** แล้วเลือกโฟลเดอร์ `frontend` *(⚠️ สำคัญมาก: ต้องเลือก `frontend`)*
   - **Build and Output Settings**: ใช้ค่าเริ่มต้น (`npm run build` และ Output directory: `dist`)
   - กดปุ่ม **Deploy**
4. **ผูก CORS Domain กลับไปยัง Render**:
   - เมื่อ Vercel Deploy เสร็จสิ้น จะได้ Domain หน้าร้านค้า เช่น `https://springroll-store.vercel.app`
   - กลับไปที่ [Render.com](https://render.com) -> เลือก Service `springroll-backend` -> ไปที่เมนู **Environment**
   - อัปเดตตัวแปร `CORS_ORIGIN` เป็น `https://springroll-store.vercel.app` แล้วกด **Save Changes** (Render จะรีสตาร์ตอัตโนมัติ)

---

#### ⏰ ขั้นตอนที่ 4: ตั้งค่า cron-job.org ป้องกัน Render Sleep (Keep-Alive 24/7)

เนื่องจาก Render Free Tier จะเข้าสู่โหมด Sleep หากไม่มีคำขอเข้ามานานเกิน 15 นาที จึงใช้บริการฟรีของ **cron-job.org** เพื่อส่งคำขอ Ping คอยกระตุ้นเซิร์ฟเวอร์ไว้ตลอดเวลา:

1. สมัครและเข้าสู่ระบบที่ [cron-job.org](https://cron-job.org)
2. ไปที่หน้า **Cronjobs** แล้วกดปุ่ม **CREATE CRONJOB**
3. กรอกข้อมูลตั้งค่าดังนี้:
   - **Title**: `Springroll Backend Keep-Alive`
   - **URL**: `https://springroll-backend.onrender.com/api/health` *(เปลี่ยนเป็น URL จริงของคุณ)*
   - **Execution Schedule**: เลือก **Every 10 minutes** หรือ **Every 12 minutes**
   - **Request Method**: `GET`
   - **Headers / Body**: *ปล่อยว่าง*
4. กดปุ่ม **CREATE** ด้านล่างสุด

---

## 📜 ใบอนุญาตการใช้งาน (License)

โปรเจกต์นี้เผยแพร่ภายใต้ใบอนุญาต [MIT License](LICENSE) สามารถนำไปพัฒนาต่อยอด ใช้งานเชิงพาณิชย์ หรือปรับแต่งได้อย่างอิสระ

