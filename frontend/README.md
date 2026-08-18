<div align="center">
  <h1>✨ Frontend Architecture - ร้านสปริงโรลออนไลน์</h1>
  <p><strong>React 18 + Vite + Tailwind CSS. Glassmorphism UI, mobile-first responsive, real-time SSE, audio chime, optimized state.</strong></p>
</div>

---

## 🎨 โครงสร้างและการจัดระเบียบ (Source Code Overview)

```
frontend/src/
├── api/
│   └── api.js              # Fetch wrapper (sendApiRequest) จัดการ Request, Error, credentials
├── components/             # Reusable UI Components
│   ├── Header.jsx          # Navbar, สถานะร้าน, ปุ่มติดตามออเดอร์, Mobile Cart
│   ├── MenuGrid.jsx        # เมนูอาหาร, badges, filter หมวดหมู่
│   ├── CartSidebar.jsx     # Desktop Cart Sidebar
│   ├── MobileCartBar.jsx   # Mobile Bottom Floating Cart Bar
│   ├── CartModal.jsx       # Mobile/Tablet Bottom Sheet Drawer
│   ├── DressingModal.jsx   # เลือกน้ำสลัดก่อนลงตะกร้า
│   ├── CheckoutModal.jsx   # Checkout & ข้อมูลจัดส่ง
│   ├── TrackingModal.jsx   # ติดตามออเดอร์ Real-time + ดูสลิป
│   ├── OrderSlipModal.jsx  # E-Receipt สลิปกระดาษคำสั่งซื้อ
│   └── admin/              # Components ระบบแอดมิน
├── context/                # Global State Management
│   ├── AlertContext.jsx    # Modern Dialog Alert / Confirm
│   ├── AuthContext.jsx     # Admin auth state
│   ├── CartContext.jsx     # Cart state (Optimistic UI + Debounced sync)
│   └── ToastContext.jsx    # Toast notifications
├── pages/                  # Main Pages
│   ├── CustomerApp.jsx     # หน้าร้านค้าลูกค้า + Hero Banner
│   └── admin/              # แอดมิน
│       ├── Dashboard.jsx   # สถิติยอดขาย & เมนูขายดี
│       ├── Menu.jsx        # CRUD เมนู & หมวดหมู่
│       ├── Dressings.jsx   # CRUD น้ำสลัด
│       ├── Orders.jsx      # กระดานจัดการสถานะออเดอร์ (Kanban / Table)
│       ├── Settings.jsx    # ตั้งค่าชื่อร้าน, ข้อความประกาศ, สวิตช์เปิด/ปิด
│       ├── Reports.jsx     # รายงานรายวัน & ส่ง Discord
│       └── Login.jsx       # เข้าสู่ระบบแอดมิน
├── utils/
│   └── audio.js            # Web Audio Context bell chime generator
└── index.css               # Theme tokens, Glassmorphism, Tailwind
```

---

## 🚀 เทคนิคการปรับจูนประสิทธิภาพและ UX (Optimizations)

### 1. ⚡ Optimistic UI + Debouncing (`CartContext.jsx`)
- **Instant Response**: UI อัปเดตทันที ไม่รอ network
- **Debounced Sync**: หน่วงเวลา 500ms ก่อนส่ง `/api/cart/update` ลดโหลด request
- **Graceful Rollback**: Network error ดึง state จริงจาก Server กลับมาคืนค่าอัตโนมัติ

### 2. 📱 Fluid Typography & Responsive Layout (`index.css`)
- Auto font scale ตาม viewport (14px mobile, 15px tablet, 16px desktop)
- ฟอนต์ **Prompt** + Glassmorphism dark palette

### 3. ⏱️ Real-time SSE & Smart Tracking (`TrackingModal.jsx` & `audio.js`)
- รับ event ผ่าน Server-Sent Events (SSE) `/api/orders/events/:order_number`
- ส่งเสียงแจ้งเตือน Harmonic Bell Chime เมื่อสถานะออเดอร์เปลี่ยน
- ดึงออเดอร์ล่าสุดของลูกค้าอัตโนมัติ

---

## 🚀 การ Deploy ขึ้น Vercel (Free Tier)

ไฟล์ `frontend/vercel.json` ตั้งค่า Reverse Proxy / Rewrites:

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

> [!TIP]
> Rewrites proxy ส่ง `/api/*` ผ่าน domain Vercel ตรง แก้ปัญหา CORS 100% + ป้องกัน 404 บน SPA routing
