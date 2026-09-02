<div align="center">
  <h1>✨ Frontend Client Architecture</h1>
  <p><strong>Built with React 18 + Vite + Tailwind CSS featuring modern Glassmorphism aesthetics, Mobile-First responsive design, Smart Polling + Smart Cache, Optimistic UI, and Web Audio Context sound synthesized alerts.</strong></p>
</div>

---

## 🎨 Source Code Overview

```
frontend/
├── Dockerfile                      # Production Docker Image for Vite build & Nginx serving
├── index.html                      # Main HTML template for React SPA
├── nginx.conf                      # Non-root Nginx web server & API reverse proxy configuration
├── package.json                    # Frontend dependencies & scripts
├── postcss.config.js               # PostCSS configuration
├── tailwind.config.js              # Tailwind CSS theme, Glassmorphism colors & utilities
├── vercel.json                     # Reverse proxy & URL rewrite rules for Vercel deployment
├── vite.config.js                  # Vite build tool & local development server configuration
└── src/
    ├── App.jsx                     # Root application component & customer/admin routing
    ├── index.css                   # Glassmorphism styling, animations & fluid typography
    ├── main.jsx                    # React DOM render root & Global Context Providers wrapper
    ├── api/api.js                  # Fetch wrapper managing HTTP requests, errors, ETags & cookies
    ├── components/                 # Storefront UI components & interactive modals
    │   ├── CartModal.jsx           # Bottom Sheet Drawer cart view (Mobile)
    │   ├── CartSidebar.jsx         # Sticky cart sidebar panel (Desktop)
    │   ├── CheckoutModal.jsx       # Order review, cost summary & delivery details form
    │   ├── DressingModal.jsx       # Salad dressing selection popup
    │   ├── Header.jsx              # Top navigation bar, logo, store status, tracking button & cart
    │   ├── MenuGrid.jsx            # Menu item catalog cards, badges & category filter tabs
    │   ├── MobileCartBar.jsx       # Floating cart action bar for smartphones
    │   ├── OrderSlipModal.jsx      # Electronic receipt slip modal (E-Receipt)
    │   └── TrackingModal.jsx       # Live order tracking modal (Smart Polling 4s)
    ├── context/                    # Global state management (React Context Providers)
    │   ├── AdminContext.jsx        # Cached categories and dressings state for admin views
    │   ├── AlertContext.jsx        # Glassmorphism Custom Modal alert & confirm dialog replacement
    │   ├── AuthContext.jsx         # Admin authentication state & session persistence
    │   ├── CartContext.jsx         # Cart state (Optimistic UI + 500ms Debounced Server Sync)
    │   └── ToastContext.jsx        # Auto-dismissing transient toast notifications
    ├── hooks/queries.js            # TanStack React Query hooks with Smart Polling strategies
    ├── pages/                      # System page views
    │   ├── CustomerApp.jsx         # Primary customer storefront page
    │   ├── AdminApp.jsx            # Admin management portal layout, navigation & sidebar
    │   └── admin/                  # Admin feature tabs
    │       ├── Dashboard.jsx       # Analytics dashboard (Active batch, today, month, all-time, top 5)
    │       ├── Dressings.jsx       # Salad dressing catalog management & availability switches
    │       ├── Login.jsx           # Admin login authentication form
    │       ├── Menu.jsx            # Menu item catalog & category management
    │       ├── Orders.jsx          # Kitchen KDS Kanban board & order table (Smart Polling 4s)
    │       └── Settings.jsx        # Store name, announcements & master open/close switches
    └── utils/audio.js              # Synthetic bell chime audio via Web Audio Context API
```

---

## 🧩 Global State Management (React Contexts)

1. **`CartContext.jsx`**:
   * Manages cart items (`cartItems`), `addItemToCart`, `updateQuantity`, `removeItem`, `clearCart`.
   * Automatically derives `totalQuantity` and `totalPrice`.
   * Implements **Optimistic UI updates** with a **500ms debounce** before dispatching network update requests.

2. **`AuthContext.jsx`**:
   * Validates active admin session on initial page load via `GET /api/admin/me`.
   * Exposes `login(username, password)` and `logout()` handling HTTP-only session cookies.

3. **`AlertContext.jsx`**:
   * Renders sleek Glassmorphism Alert / Confirm dialogs as a drop-in replacement for native `window.alert()` / `window.confirm()`.

4. **`ToastContext.jsx`**:
   * Dispatches transient floating notifications (e.g., store status changes, item added to cart, order number copied) with automatic dismissal.

5. **`AdminContext.jsx`**:
   * Provides shared caching for categories and dressings across admin tabs.

---

## ⚡ Custom React Query Hooks (`hooks/queries.js`)

| Hook Name | Query Key | Polling Interval | Functionality & Strategy |
|---|---|---|---|
| `useMenu()` | `['menu_and_dressings']` | `staleTime: 5m` | Parallel fetches menu items and dressings concurrently |
| `useStoreStatus()` | `['storeStatus']` | `refetchInterval: 5s` | Continuously polls store open/closed status for live sync |
| `useActiveOrderTracking(orderNumber)` | `['activeOrder', orderNumber]` | `refetchInterval: 4s` | Polls order state every 4s and automatically ceases on terminal status |
| `useAdminOrders(statusFilter)` | `['adminOrders', statusFilter]` | `refetchInterval: 4s` | Kitchen KDS Kanban live sync every 4 seconds |

---

## 🚀 Performance Optimizations & User Experience

### 1. ⚡ Optimistic UI & 500ms Debounced Sync (`CartContext.jsx`)
* **Immediate UI Feedback**: Cart quantities and total price reflect immediately when tapping `+` or `-` without waiting for server network cycles.
* **Debounced Sync (500ms)**: Batches successive quantity adjustments into a single `/api/cart/update/:id` call after the user pauses clicking, reducing server request volume by over 80%.
* **Graceful Rollback**: If a network failure occurs, the local cart automatically rolls back to the verified server state.

### 2. ⏱️ Smart Polling Auto-Track (`TrackingModal.jsx`)
* **Zero-Click Instant Tracking**: Automatically detects and loads the active session's latest order ID without requiring repetitive manual input.
* **5-Step Animated Workflow Indicator**:
  1. `Pending`: Order placed, waiting for store acceptance
  2. `Order Accepted`: Queue confirmed, kitchen preparing ingredients
  3. `Preparing Food`: Fresh cooking underway in the kitchen
  4. `Ready for Pickup` / `Out for Delivery`: Ready at store counter or handed over to courier
  5. `Picked Up` / `Delivered`: Final delivery complete
* **Auto-Pause Behavior**: Polling ceases when the browser tab is hidden or when the order enters a terminal state (`Picked Up`, `Delivered`, or `Cancelled`).

### 3. 🔔 Web Audio API Bell Chime (`audio.js`)
* Synthesizes audio locally in the browser using the **Web Audio Context API** (Sine Waves) without downloading external MP3 files:
  * **Order Status Transition (Harmonic Arpeggio)**: F5 (698.46 Hz) -> A5 (880.00 Hz) -> C6 (1046.50 Hz)
  * **Order Placed Success (Success Ding)**: C5 (523.25 Hz) -> G5 (783.99 Hz) -> C6 (1046.50 Hz)

### 4. 📱 Mobile-First Responsive Design
* Handheld viewports utilize a smooth **Bottom Sheet Drawer** (`CartModal.jsx`) and sticky **Mobile Floating Action Bar** (`MobileCartBar.jsx`).
* Desktop viewports smoothly scale into a **Sticky Sidebar Cart** (`CartSidebar.jsx`).
* Generous touch targets and fluid typography ensure optimal readability across all screen sizes.

---

## 🌐 Vercel Deployment Configuration (Free Tier)

Configure the API reverse proxy in `frontend/vercel.json` to route `/api` traffic seamlessly to the Render backend service:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://your-backend-url.onrender.com/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
