<div align="center">
  <h1>⚙️ Backend API Architecture</h1>
  <p><strong>Built with Node.js (ESM) + Express.js featuring Feature-First modular architecture, session cookie authentication, rate limiting, PostgreSQL connection pool, Zod validation, and Smart Cache (HTTP 304 ETag).</strong></p>
</div>

---

## 🧩 Source Code Architecture (Feature-First)

```
backend/
├── Dockerfile                      # Production Docker Image definition
├── package.json                    # Dependencies & npm scripts
├── server.js                       # Server entry point, DB pool connection check & auto-migration
└── src/
    ├── discord.js                  # Discord Webhook notification engine (#orders, #cancels, #reports)
    ├── index.js                    # Express app initialization, security middlewares, rate limits, routes
    ├── admin/                      # Feature: Admin portal management
    │   ├── admin_controller.js     # Admin root router aggregator (/api/admin)
    │   ├── analytics_controller.js # Sales analytics for current batch/today/month/all-time (Dashboard)
    │   ├── auth_controller.js      # Admin login, logout & session verification
    │   ├── categories_controller.js# Food categories CRUD
    │   ├── dressings_controller.js # Salad dressings CRUD
    │   ├── menu_controller.js      # Menu items CRUD
    │   └── orders_controller.js    # Order status workflow transitions & soft delete
    ├── cart/                       # Feature: Customer shopping cart
    │   ├── cart_controller.js      # Cart API router (/api/cart)
    │   ├── cart_middleware.js      # Automatic guest cart session detection & initialization
    │   ├── cart_repository.js      # SQL queries for cart_sessions and cart_items
    │   └── cart_service.js         # Cart business logic & validations
    ├── config/                     # Feature: Central configuration & database connection
    │   ├── config.js               # Centralized configuration with Fail-Fast startup checks
    │   └── database.js             # pg.Pool with dynamic SSL & query helpers
    ├── dressings/                  # Feature: Customer salad dressings
    │   ├── dressings_controller.js # Active dressings router (/api/dressings)
    │   ├── dressings_repository.js # SQL queries for dressings table
    │   └── dressings_service.js    # Dressing availability business logic
    ├── menu/                       # Feature: Customer menu items
    │   ├── menu_controller.js      # Menu items & categories router (/api/menu)
    │   ├── menu_repository.js      # SQL queries for menu_items and categories
    │   └── menu_service.js         # Menu categorization business logic
    ├── orders/                     # Feature: Customer orders & live tracking
    │   ├── orders_controller.js    # Order creation & tracking router (/api/orders)
    │   ├── orders_repository.js    # SQL queries for orders and order_items
    │   └── orders_service.js       # Order creation, queue sequence, anti-spam, Discord alerts
    ├── shared/                     # Shared cross-cutting modules & middlewares
    │   ├── errors.js               # Standardized Error classes (RFC 9457 Problem Details)
    │   ├── logger.js               # Structured JSON logger (Pino)
    │   ├── middleware/             # auth.js, errorHandler.js, requestContext.js, validate.js
    │   └── validators/             # index.js (Zod validation schemas)
    └── store/                      # Feature: Store status & queue sequence
        ├── store_controller.js     # Store status router (/api/store)
        ├── store_repository.js     # SQL queries for store_status and queue sequence
        └── store_service.js        # Store toggle, queue reset, sales summary generation
```

---

## 🌐 Complete API Reference

### 1. General & Health Check
| Method | Endpoint | Description | Auth | Rate Limit |
|---|---|---|---|---|
| `GET` / `HEAD` | `/api/health` | Server health check & Keep-Alive endpoint | Public | Unlimited (Bypassed) |
| `HEAD` | `/` | Root health check for Uptime monitoring | Public | Unlimited (Bypassed) |

### 2. Menu Items & Salad Dressings
| Method | Endpoint | Description | Auth | Example Response |
|---|---|---|---|---|
| `GET` | `/api/menu` | Fetch available menu items grouped by category | Public | `{"success":true,"data":[{"id":1,"name":"Salmon Spring Roll","price":40,...}]}` |
| `GET` | `/api/dressings` | Fetch available salad dressing options | Public | `{"success":true,"data":[{"id":0,"name":"No Dressing"},...]}` |

### 3. Store Status
| Method | Endpoint | Description | Auth | Rate Limit |
|---|---|---|---|---|
| `GET` | `/api/store/status` | Get store open/closed status, name, announcement, latest queue | Public | 300 req / 15 min |

### 4. Shopping Cart Sessions (Rate Limit: 150 req / 15 min)
| Method | Endpoint | Description | Auth / Cookie | Example Request Body |
|---|---|---|---|---|
| `GET` | `/api/cart` | Get current cart items and totals | Cart Session | - |
| `POST` | `/api/cart/add` | Add item to cart | Cart Session | `{"menu_item_id":1,"dressing_id":2,"quantity":1,"item_notes":""}` |
| `PUT` | `/api/cart/update/:id` | Update item quantity in cart | Cart Session | `{"quantity":2}` |
| `DELETE` | `/api/cart/remove/:id` | Remove single item from cart | Cart Session | - |
| `DELETE` | `/api/cart/clear` | Clear all items from cart | Cart Session | - |

### 5. Orders & Live Tracking
| Method | Endpoint | Description | Rate Limit | Example Request Body |
|---|---|---|---|---|
| `POST` | `/api/orders` | Create new order (Anti-spam 1 active order per phone) | 10 req / 15 min | `{"customer_name":"John Doe","customer_phone":"0812345678","delivery_type":"รับเองที่ร้าน","items":[{"menu_item_id":1,"dressing_id":0,"quantity":2}]}` |
| `GET` | `/api/orders/track/:order_number` | Live order tracking (Smart Polling 4s, PII Masked) | 300 req / 15 min | - |
| `PATCH` | `/api/orders/:id/status` | Customer cancels their order (Only in `Pending` status) | 5 req / 15 min | `{"status":"ยกเลิก","cancel_reason":"Emergency"}` |

### 6. Admin Portal Endpoints (Auth: Admin Session Cookie)
| Method | Endpoint | Description | Rate Limit / Notes |
|---|---|---|---|
| `POST` | `/api/admin/login` | Administrator login | 5 req / 15 min (Brute Force Protection) |
| `POST` | `/api/admin/logout` | Administrator logout & session revocation | Admin Session |
| `GET` | `/api/admin/me` | Verify active admin session | Admin Session |
| `GET` | `/api/admin/analytics` | Sales statistics (Active Batch, Today, Month, All-Time, Top 5) | Smart Polling 15s |
| `GET` | `/api/admin/orders` | List orders (Query params: `status`, `sort`, `page`, `limit`) | Smart Polling 4s |
| `PATCH` | `/api/admin/orders/:id/status` | Transition order status via Workflow State Machine | Strict step validation |
| `DELETE` | `/api/admin/orders/:id` | Soft delete order (`deleted_at = NOW()`) | Admin Session |
| `PATCH` | `/api/admin/store/status` | Toggle open/closed, update store name, announcement banner | Admin Session |
| `POST` | `/api/admin/store/reset-queue` | Dispatch sales summary to Discord (#reports) and reset queue | Admin Session |
| `GET` | `/api/admin/categories` | List all menu categories | Admin Session |
| `POST` | `/api/admin/categories` | Create new category | Request: `{"name":"...","display_order":1}` |
| `PUT` | `/api/admin/categories/:id` | Update category name and display order | Admin Session |
| `DELETE` | `/api/admin/categories/:id` | Delete category (Forbidden if menu items are attached) | Admin Session |
| `GET` | `/api/admin/menu` | List all menu items (including unavailable items) | Admin Session |
| `POST` | `/api/admin/menu` | Create new menu item | Request: `{"name":"...","price":40,...}` |
| `PUT` | `/api/admin/menu/:id` | Update menu item details, pricing, image | Admin Session |
| `DELETE` | `/api/admin/menu/:id` | Delete menu item (Forbidden if referenced in order history) | Admin Session |
| `GET` | `/api/admin/dressings` | List all salad dressings | Admin Session |
| `POST` | `/api/admin/dressings` | Create new salad dressing option | Request: `{"name":"...","is_available":true}` |
| `PUT` | `/api/admin/dressings/:id` | Update salad dressing details & availability | Admin Session |
| `DELETE` | `/api/admin/dressings/:id` | Delete salad dressing (Forbidden for id=0 or with order history) | Admin Session |

---

## 🛡️ Security & Error Standards

1. **Fail-Fast Startup Configuration (`src/config/config.js`)**
   * Verifies all critical environment variables (`DATABASE_URL`, `JWT_SECRET`) during boot and halts startup immediately if values are missing.

2. **RFC 9457 Problem Details (`src/shared/errors.js`)**
   * Specialized error classes: `NotFoundError` (404), `ValidationError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `ConflictError` (409).
   * Centralized `globalErrorHandler` returns clean, standardized JSON errors while hiding internal stack traces in production mode.

3. **Database Connection Pool Optimization (`src/config/database.js`)**
   * `max: 10`: Pool size capped to stay comfortably within Cloud Database Free Tier limits (Neon).
   * `idleTimeoutMillis: 30000`: Closes idle connections after 30 seconds.
   * `connectionTimeoutMillis: 5000`: Fails fast if the database does not respond within 5 seconds.
   * Dynamic SSL: Automatically enables secure SSL connections when targeting remote cloud databases.

4. **Structured JSON Logging (`src/shared/logger.js`, `requestContext.js`)**
   * Attaches a unique `requestId` (UUIDv4) to every incoming request for distributed tracing across logs.

5. **PII Masking**
   * On `GET /api/orders/track/:order_number`, if the requester is neither the order owner nor an authenticated admin, sensitive fields (`customer_name`, `customer_phone`, `address`) are masked as `'*** Hidden for privacy ***'`.

---

## 🤖 Smart Cache & Discord Engine

### 1. Smart Cache (HTTP 304 & ETag)
* Strong ETags enabled (`app.set('etag', 'strong')`).
* When clients poll with `If-None-Match: <etag>` and data has not changed, the server immediately responds with `304 Not Modified` and zero payload body.
* Saves bandwidth and eliminates over 95% of unnecessary CPU processing during polling.

### 2. Discord Webhook Notifications (`src/discord.js`)
* **New Order Alert (`DISCORD_WEBHOOK_URL`)**: Sky blue embed card detailing ordered items, dressings, special notes, total amount, delivery method, and phone number.
* **Order Cancellation Alert (`DISCORD_CANCEL_WEBHOOK_URL`)**: Edits and cleans up the original alert within 5s, dispatching a red cancellation embed card with the cancellation initiator and reason to prevent kitchen waste.
* **Daily Sales Report (`DISCORD_REPORT_WEBHOOK_URL`)**: Emerald green embed card summarizing daily revenue, order volume, cancellation rates, and top-selling items dispatched automatically upon store closing.

---

## 🚀 Environment Variables (`backend/.env`)

| Variable | Example Value | Importance | Description |
|---|---|---|---|
| `PORT` | `8000` | Optional | Server port (Default: 8000) |
| `NODE_ENV` | `production` | Important | Environment mode (`development` / `production`) |
| `DATABASE_URL` | `postgres://user:pass@host/db?sslmode=require` | Required | PostgreSQL connection string |
| `JWT_SECRET` | `your_super_secret_jwt_key_here` | Required | Secret key for signing JWT sessions (32+ chars) |
| `CORS_ORIGIN` | `https://your-app.vercel.app,http://localhost:5173` | Required | Allowed frontend origins (comma-separated) |
| `ALLOW_DYNAMIC_CORS` | `false` | Optional | Allow any origin dynamically (`true`/`false`) |
| `ADMIN_INIT_USERNAME` | `admin` | Optional | Default admin username initialized on first boot |
| `ADMIN_INIT_PASSWORD` | `YourStrongPassword123` | Optional | Default admin password (hashed with bcrypt immediately) |
| `DISCORD_WEBHOOK_URL` | `https://discord.com/api/webhooks/...` | Optional | Webhook for new order alerts (#orders) |
| `DISCORD_CANCEL_WEBHOOK_URL`| `https://discord.com/api/webhooks/...` | Optional | Webhook for order cancellations (#cancels) |
| `DISCORD_REPORT_WEBHOOK_URL`| `https://discord.com/api/webhooks/...` | Optional | Webhook for daily sales reports (#reports) |
