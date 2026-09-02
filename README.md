<div align="center">
  <h1>🥗 Spring Roll Online Store (Food Order Web Application)</h1>
  <p><strong>A modern Glassmorphism food ordering web application built with Feature-First architecture, real-time synchronization via Smart Polling + Smart Cache (HTTP 304 ETag), Optimistic UI, Discord Webhook notifications, and 100% Cloud Free Tier compatibility.</strong></p>

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
> Designed following **Separation of Concerns (SoC)**, **Feature-First Architecture**, and **OWASP Security Best Practices**. Deployable via local Docker Compose or 100% Cloud Production Free Tier.

---

## 📐 System Architecture

```mermaid
flowchart TD
    classDef client fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc,rx:8px
    classDef proxy fill:#1e293b,stroke:#06b6d4,stroke-width:2px,color:#f8fafc,rx:8px
    classDef backend fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc,rx:8px
    classDef db fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#f8fafc,rx:8px
    classDef ext fill:#2a1b4e,stroke:#c084fc,stroke-width:2px,color:#f8fafc,rx:8px

    subgraph CLIENTS ["🌐 1. Frontend Clients"]
        Customer["📱 Customer Storefront<br/>• React 18 & TanStack Query<br/>• Smart Polling & Auto-Tracking"]:::client
        Admin["💻 Admin Management Portal<br/>• Smart Polling KDS Kanban (4s)<br/>• Real-time Analytics Dashboard"]:::client
    end

    subgraph GATEWAY ["🛡️ 2. Edge & Reverse Proxy"]
        Proxy["🌐 Vercel Edge / Nginx Server<br/>• HTTPS & Static Assets (Cache 1y)<br/>• Reverse Proxy routing /api"]:::proxy
    end

    subgraph BACKEND ["⚙️ 3. Backend Engine"]
        API["🚀 Express.js API Core<br/>• Feature-First Architecture<br/>• Smart Cache (HTTP 304 ETag)<br/>• Secure Sessions & Rate Limiting"]:::backend
        DiscordModule["🤖 Discord Webhook Engine<br/>• Order creation & cancellation alerts<br/>• Automated daily sales reports"]:::backend
    end

    subgraph STORAGE ["🗄️ 4. Database Layer"]
        Database[("🐘 PostgreSQL 17+ Database<br/>• Menu, orders, cart & admin sessions<br/>• B-Tree Indexes & Connection Pool")]:::db
    end

    subgraph EXTERNAL ["☁️ 5. External Cloud Services"]
        CronBot["⏰ cron-job.org (Keep-Alive)<br/>• Pings /api/health every 10-12 min<br/>• Prevents Render spin-down"]:::ext
        DiscordApp["💬 Discord Channels<br/>• #orders • #cancels • #reports"]:::ext
    end

    Customer -->|"Place order / Poll status (4s)"| Proxy
    Admin -->|"Manage orders / View stats (4s & 15s)"| Proxy
    Proxy -->|"Proxy Pass /api (with ETag If-None-Match)"| API
    API <-->|"Query & Mutate Data (pg.Pool + Indexes)"| Database
    API -->|"Trigger Webhook Events"| DiscordModule
    DiscordModule ==>|"Send Embed Notification Cards"| DiscordApp
    CronBot -.->|"HTTP GET/HEAD Ping (Wake up server)"| API
```

---

## 🌟 Key Features

### 🛍️ Customer Storefront
* **Glassmorphism UI + Fluid Typography**: Sleek, fully responsive interface for mobile, tablet, and desktop viewports.
* **Flexible Salad Dressing Selection**: Pick custom salad dressings or opt for "No Dressing" (`dressing_id: 0`).
* **Optimistic UI Cart + Debounce (500ms)**: Real-time cart quantity updates with immediate visual feedback, debouncing requests to drastically reduce server overhead.
* **Smart Polling Auto-Track (Zero-Click)**: Automatically recovers and tracks the session's latest active order, syncing every 4s and pausing upon completion.
* **5-Step Animated Order Progress**:
  1. `Pending` -> 2. `Order Accepted` -> 3. `Preparing Food` -> 4. `Ready for Pickup` / `Out for Delivery` -> 5. `Picked Up` / `Delivered`
* **Web Audio Context Bell Chime**: Harmonic sine wave synthetic bell audio notifying customers on status transitions and successful checkout.
* **E-Receipt Modal**: Clean electronic receipt modal summarizing ordered items, notes, and delivery surcharge breakdown.

### ⚙️ Admin Management Portal
* **KDS Kanban & Table View (Smart Polling 4s)**: Real-time incoming kitchen orders updating every 4s, separated into kitchen workflow columns with quick status transitions.
* **Analytics Dashboard (Smart Polling 15s)**: Live sales breakdown for Active Batch, Today, This Month, All-Time, Cancellation Rate, and Top 5 Best Sellers.
* **Menu & Category CRUD**: Full lifecycle management for menu items, pictures, prices, categories, and availability toggles.
* **Dressing Management**: Add, update, and toggle availability for salad dressings (deletion blocked if referenced in order history).
* **Store Control & Announcements**: One-click store open/close toggle and live broadcast announcement banner synced instantly to customers.
* **Daily Closing & Reset Queue**: Automated daily sales report dispatched to Discord on queue reset and store closing.

### 🤖 Automated Discord Webhook Engine
* **#orders (New Order Notifications)**: Sky blue embed card with Order ID, Queue Number, items, dressings, special notes, total amount, delivery type, and contact phone.
* **#cancels (Order Cancellation Notifications)**: Edits and deletes the original message within 5s, sending a red embed card to the cancellation room detailing the cancellation reason and initiator to prevent duplicate kitchen work.
* **#reports (Daily Sales Summary)**: Emerald green embed card summarizing gross revenue, total orders, cancellation rate, and best-selling items when resetting the daily queue.

---

## 🚦 Business Rules & Security

### 📌 Business Rules
* **Anti-Spam / Concurrent Order Guard**: Only 1 active in-flight order allowed per phone number or cart session (returns `HTTP 429` if an existing order is active).
* **Store Status Guard**: Rejects new order submissions when the store is closed (`is_open = false`).
* **Order Cancellation Rules**:
  * Customers may only cancel orders in `Pending` (`รอดำเนินการ`) status, requiring a valid reason (1–20 characters).
  * IDOR Protection: Verifies `session_id` strictly matches the order creator.
* **Admin Workflow State Machine**:
  * *Store Pickup*: `Pending` -> `Order Accepted` -> `Preparing Food` -> `Ready for Pickup` -> `Picked Up`
  * *Delivery*: `Pending` -> `Order Accepted` -> `Preparing Food` -> `Out for Delivery` -> `Delivered`
  * Skipping steps or reverting states is strictly prevented.
* **Data Deletion Safety**:
  * Prevents deletion of menu items or dressings that have order history (toggle availability instead).
  * Admin order removal employs **Soft Delete** (`deleted_at = NOW()`).

### 🔒 Security Standards
* **RFC 9457 Problem Details**: Structured error classes (`NotFoundError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`) with stack traces masked in production.
* **Secure Cookie Sessions**:
  * `springroll_admin_session`: Admin session cookie (UUIDv4, `HttpOnly`, `SameSite`, `Secure` in production, 24h expiration).
  * `springroll_cart_session`: Customer cart session cookie (UUIDv4, `HttpOnly`, `SameSite`).
* **PII Masking**: Masks sensitive personal information (`customer_name`, `customer_phone`, `address`) as `'*** Hidden for privacy ***'` on public tracking endpoints if the request is not from the order owner or admin.
* **100% Parameterized SQL**: Prepared queries (`$1, $2, ...`) across all database operations, eliminating SQL Injection vulnerabilities.
* **Payload Limit**: Strict JSON payload ceiling of `100kb` to guard against DoS memory attacks.
* **Dynamic CORS Whitelist**: Supports `localhost`, `CORS_ORIGIN`, automatic `*.vercel.app` domain matching, or explicit `ALLOW_DYNAMIC_CORS=true`.

### ⏱️ Rate Limiting Breakdown
| Scope / Endpoint | Rate Limit Quota | Purpose |
|---|---|---|
| `POST /api/orders` | 10 req / 15 min | Prevents order creation spam |
| `PATCH /api/orders/:id/status` | 5 req / 15 min | Prevents cancellation spam |
| `POST /api/admin/login` | 5 req / 15 min | Brute-force password protection |
| `/api/cart/*` | 150 req / 15 min | Guards cart session manipulation |
| `GET /api/orders/track/:order_number` | 300 req / 15 min | Accommodates Customer Smart Polling (4s) |
| `/api/store/*` | 300 req / 15 min | Accommodates Store Status Polling (5–15s) |
| `/api/*` (General API) | 600 req / 15 min | General DoS protection (bypassed for health checks) |

---

## 📁 Repository Structure

```
Food-Order-Web-Application/
├── .env.example                    # Environment variables template
├── docker-compose.yml              # Full-stack Docker Compose container orchestration
├── LICENSE                         # MIT License
├── README.md                       # Main project documentation
├── backend/                        # Backend API service (Node.js + Express)
│   ├── Dockerfile                  # Production Docker Image for Backend
│   ├── package.json                # Backend dependencies & scripts
│   ├── README.md                   # Backend architecture and API reference
│   ├── server.js                   # Server bootstrap, DB pool validation & auto-migration
│   └── src/                        # Feature-First source code
│       ├── discord.js              # Discord Webhook integration (#orders, #cancels, #reports)
│       ├── index.js                # Express app setup, middlewares, rate limiting, routes
│       ├── admin/                  # Feature: Admin portal (CRUD, Analytics, Auth)
│       ├── cart/                   # Feature: Cart session management & operations
│       ├── config/                 # Central configuration & PostgreSQL connection pool
│       ├── dressings/              # Feature: Customer dressing selection
│       ├── menu/                   # Feature: Menu items & categories
│       ├── orders/                 # Feature: Order placement & tracking
│       ├── shared/                 # Error classes, Logger (Pino), Middlewares, Validators (Zod)
│       └── store/                  # Feature: Store status, queue sequence, announcements
├── frontend/                       # Frontend SPA (React 18 + Vite)
│   ├── Dockerfile                  # Production Docker Image for Frontend (Nginx)
│   ├── index.html                  # Main HTML entry point for React SPA
│   ├── nginx.conf                  # Nginx web server & API reverse proxy configuration
│   ├── package.json                # Frontend dependencies & scripts
│   ├── postcss.config.js           # PostCSS configuration
│   ├── README.md                   # Frontend architecture & UX/UI guide
│   ├── tailwind.config.js          # Tailwind CSS theme & utility configuration
│   ├── vercel.json                 # Vercel reverse proxy & URL rewrites configuration
│   ├── vite.config.js              # Vite configuration
│   └── src/
│       ├── App.jsx                 # Main component & customer/admin routing
│       ├── index.css               # Glassmorphism styling, animations & fluid typography
│       ├── main.jsx                # React DOM render entry point & Context Providers
│       ├── api/api.js              # Fetch wrapper handling requests, errors, ETag & cookies
│       ├── components/             # CartModal, CartSidebar, CheckoutModal, DressingModal, Header, MenuGrid, MobileCartBar, OrderSlipModal, TrackingModal
│       ├── context/                # AdminContext, AlertContext, AuthContext, CartContext, ToastContext
│       ├── hooks/queries.js        # Smart Polling & TanStack React Query custom hooks
│       ├── pages/                  # CustomerApp.jsx, AdminApp.jsx & admin tabs
│       └── utils/audio.js          # Synthetic bell chime via Web Audio Context API
└── database/                       # PostgreSQL database scripts & schema
    ├── README.md                   # Database schema, ER diagram, ENUMs & indexes guide
    └── schema.sql                  # Schema DDL, ENUMs, foreign keys, indexes & seed data
```

---

## 🚀 Getting Started

### Method 1: Running with Docker Compose (Local Development)

1. Copy and configure the environment variables:
   ```bash
   cp .env.example .env
   ```
2. Build and start the containers:
   ```bash
   docker compose up -d --build
   ```
3. Access the application:
   * **Customer Storefront**: `http://localhost`
   * **Admin Management Portal**: `http://localhost/admin`
   * **Backend API**: `http://localhost/api`
   * **Health Check**: `http://localhost/api/health`

### Online Testing with Cloudflare Tunnel (Webhook & Mobile Testing)

1. Start Docker Compose: `docker compose up -d --build`
2. Open a tunnel pointing to the Frontend web port (Port 80):
   ```bash
   npx cloudflared tunnel --url http://localhost
   ```
3. Use the generated URL (`https://xxxx.trycloudflare.com`) to test on real mobile devices or configure Discord Webhooks.

---

### Method 2: 100% Free Cloud Deployment (Neon + Render + Vercel + cron-job.org)

| Component | Platform | Service Tier | Role |
|---|---|---|---|
| 🐘 **Database** | [Neon.tech](https://neon.tech) | Free Tier (0.5 GiB) | Serverless PostgreSQL for menu, orders, sessions, and queue |
| ⚙️ **Backend API** | [Render.com](https://render.com) | Free Web Service | Node.js + Express API, order processing & Discord alerts |
| 🌐 **Frontend** | [Vercel.com](https://vercel.com) | Free Hobby | React 18 SPA + Edge Reverse Proxy forwarding `/api` to Render |
| ⏰ **Keep-Alive** | [cron-job.org](https://cron-job.org) | Free 100% | Pings `/api/health` every 10–12 minutes to prevent Render idle sleep |

---

#### 🐘 Step 1: Set Up Database on Neon.tech

1. Go to [Neon.tech](https://neon.tech) -> **Create Project** -> Name it `springroll-db` -> Select Region `Singapore (ap-southeast-1)`
2. Navigate to **SQL Editor** -> Copy the full content of [database/schema.sql](database/schema.sql) -> Click **Run**
3. Go to **Dashboard** -> Copy the **Connection string** (`Pooled connection` with `?sslmode=require`)
   * *Example*: `postgres://username:password@ep-xyz.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`

---

#### ⚙️ Step 2: Deploy Backend API on Render.com

1. Go to [Render.com](https://render.com) -> **New +** -> **Web Service** -> Select the `Food-Order-Web-Application` repository
2. Configure Build & Deploy settings:
   * **Name**: `springroll-backend`
   * **Region**: `Singapore (Southeast Asia)`
   * **Branch**: `main`
   * **Root Directory**: `backend` *(⚠️ Make sure to specify `backend`)*
   * **Runtime**: `Node`
   * **Build Command**: `npm ci --omit=dev`
   * **Start Command**: `node server.js`
   * **Instance Type**: `Free`
3. Configure Environment Variables:

   | Key | Example Value / Notes | Required |
   |---|---|---|
   | `NODE_ENV` | `production` | Required |
   | `DATABASE_URL` | *Connection string from Neon* | Required |
   | `JWT_SECRET` | *Random string (32+ characters)* | Required |
   | `CORS_ORIGIN` | `https://your-app.vercel.app` *(Can use `*` initially, then update with Vercel domain)* | Required |
   | `ADMIN_INIT_USERNAME` | `admin` | Optional |
   | `ADMIN_INIT_PASSWORD` | `YourStrongAdminPassword123` | Optional |
   | `DISCORD_WEBHOOK_URL` | `https://discord.com/api/webhooks/...` | Optional |
   | `DISCORD_CANCEL_WEBHOOK_URL`| `https://discord.com/api/webhooks/...` | Optional |
   | `DISCORD_REPORT_WEBHOOK_URL`| `https://discord.com/api/webhooks/...` | Optional |

4. Click **Deploy Web Service** -> Wait until status is `Live` -> Test by opening `https://springroll-backend.onrender.com/api/health`

---

#### 🌐 Step 3: Deploy Frontend on Vercel.com

1. Update [frontend/vercel.json](frontend/vercel.json) to point `destination` to your Render Backend URL:
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
2. Commit and push the changes:
   ```bash
   git add frontend/vercel.json
   git commit -m "Update backend API proxy URL in vercel.json"
   git push
   ```
3. Go to [Vercel.com](https://vercel.com) -> **Add New...** -> **Project** -> Import the repository
4. Configure project settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `frontend` *(⚠️ Make sure to select `frontend`)*
   * **Build and Output Settings**: Defaults (`npm run build`, output directory: `dist`)
   * Click **Deploy**
5. Take your deployed Vercel domain (e.g. `https://springroll-store.vercel.app`) and update the `CORS_ORIGIN` environment variable in your Render service.

---

#### ⏰ Step 4: Configure cron-job.org to Prevent Render Spin-Down (24/7 Keep-Alive)

1. Sign in to [cron-job.org](https://cron-job.org) -> Navigate to **Cronjobs** -> Click **CREATE CRONJOB**
2. Configure:
   * **Title**: `Springroll Backend Keep-Alive`
   * **URL**: `https://springroll-backend.onrender.com/api/health`
   * **Schedule**: **Every 10 minutes** or **Every 12 minutes**
   * **Method**: `GET` or `HEAD`
3. Click **CREATE**

---

## 📜 License

Distributed under the [MIT License](LICENSE). Free for personal, commercial, and educational use.
