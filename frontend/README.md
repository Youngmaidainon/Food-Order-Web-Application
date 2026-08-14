<div align="center">
  <h1>✨ Frontend Architecture - ร้านสปริงโรลออนไลน์</h1>
  <p>ส่วนต่อประสานผู้ใช้ (UI) พัฒนาด้วย <strong>React 18 + Vite + Tailwind CSS</strong> สไตล์ Glassmorphism เน้นความลื่นไหล ประสบการณ์ผู้ใช้ (UX) และการจัดการ State ที่มีประสิทธิภาพ</p>
</div>

---

## 🎨 โครงสร้างและการจัดระเบียบ (Source Code Overview)

```
frontend/src/
├── api/
│   └── api.js              # Fetch wrapper (sendApiRequest) จัดการ Request, Error และ credentials
├── components/             # Reusable UI Components
│   ├── Header.jsx          # แถบเมนูด้านบน แสดงสถานะร้านและปุ่มติดตามออเดอร์
│   ├── MenuGrid.jsx        # แสดงการ์ดเมนูอาหารและตัวกรองหมวดหมู่
│   ├── CartSidebar.jsx     # ตะกร้าสินค้าด้านข้างสำหรับหน้าจอ Desktop
│   ├── MobileCartBar.jsx   # แถบตะกร้าสินค้าแบบ Floating สำหรับหน้าจอ Mobile
│   ├── DressingModal.jsx   # Modal ให้ลูกค้าเลือกน้ำสลัดก่อนเพิ่มลงตะกร้า
│   ├── CheckoutModal.jsx   # Modal สรุปรายการและกรอกข้อมูลจัดส่ง
│   ├── TrackingModal.jsx   # Modal ตรวจสอบและติดตามสถานะคำสั่งซื้อ
│   └── admin/              # Components เฉพาะสำหรับระบบแอดมิน
├── context/                # Global State Management
│   ├── AlertContext.jsx    # จัดการ Confirm / Alert Dialog สไตล์โมเดิร์น
│   ├── AuthContext.jsx     # จัดการสถานะการเข้าสู่ระบบของแอดมิน
│   ├── CartContext.jsx     # จัดการตะกร้าสินค้า (Optimistic Update + Debouncing)
│   └── ToastContext.jsx    # แสดง Toast Notifications แจ้งเตือนสถานะต่างๆ
├── pages/                  # หน้าหลักของระบบ
│   ├── CustomerApp.jsx     # หน้าร้านค้าหลักสำหรับลูกค้าสั่งซื้อ
│   └── admin/              # หน้าควบคุมแอดมิน
│       ├── Dashboard.jsx   # แดชบอร์ดสรุปยอดขาย วันนี้/เดือนนี้/ทั้งหมด และเมนูขายดี
│       ├── Menu.jsx        # จัดการเพิ่ม/ลบ/แก้ไขเมนูอาหาร และหมวดหมู่
│       ├── Dressings.jsx   # จัดการรายการน้ำสลัด
│       ├── Orders.jsx      # กระดานจัดการและเปลี่ยนสถานะออเดอร์
│       ├── Reports.jsx     # สรุปรายงานรายวันและส่งรายงานเข้า Discord
│       └── Login.jsx       # หน้าเข้าสู่ระบบแอดมิน
└── index.css               # สไตล์หลัก, Custom Glassmorphism, Fluid Typography สำหรับภาษาไทย
```

---

## 🚀 เทคนิคการปรับจูนประสิทธิภาพและ UX (Optimizations)

### 1. ⚡ Optimistic UI + Debouncing (`CartContext.jsx`)
- **Instant Response**: เมื่อลูกค้ากดเพิ่ม/ลดจำนวนสินค้า State บนหน้าจอจะอัปเดตทันที ไม่ต้องรอการตอบกลับจาก Network
- **Debounced Sync**: หน่วงเวลา 500ms ก่อนยิงคำขอ `/api/cart/update` ไปยัง Server เพื่อลดจำนวน Request ที่เกิดจากการกดย้ำๆ
- **Graceful Rollback**: หากเกิด Network Error ระบบจะดึงข้อมูลล่าสุดจาก Server กลับมาแสดงผลโดยอัตโนมัติ

### 2. 📱 Fluid Typography & Responsive Layout (`index.css`)
- ปรับขนาด `font-size` พื้นฐานตามความกว้างหน้าจอ (14px ในมือถือ, 15px ในแท็บเล็ต, 16px ในเดสก์ท็อป) เพื่อป้องกันปัญหาการตัดคำภาษาไทยไม่สวยงาม
- ใช้แบบอักษร **Prompt** ควบคู่กับเอฟเฟกต์กระจกฝ้า (Glassmorphism) และ Dark Theme

### 3. ⏱️ Non-aggressive Order Tracking (`CustomerApp.jsx` & `TrackingModal.jsx`)
- ติดตามสถานะออเดอร์อัตโนมัติผ่าน Polling ในช่วงเวลาที่เหมาะสม (10 วินาที) โดยหยุดทำงานอัตโนมัติเมื่อออเดอร์เสร็จสิ้นหรือถูกยกเลิก เพื่อประหยัด Bandwidth

---

## 🚀 การ Deploy ขึ้น Vercel (Free Tier)

โปรเจกต์มีไฟล์ `frontend/vercel.json` สำหรับตั้งค่า **Reverse Proxy / Rewrites**:

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
> การตั้งค่า Rewrites ทำให้ Frontend เรียก `/api/*` ผ่าน Domain ของ Vercel โดยตรง ซึ่งช่วยขจัดปัญหา CORS ได้อย่างสมบูรณ์ และทำให้ระบบ Single Page Application (SPA) รองรับการรีเฟรชหน้าเว็บโดยไม่เกิดข้อผิดพลาด 404
