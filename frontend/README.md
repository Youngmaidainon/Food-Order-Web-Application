<div align="center">
  <h1>✨ สถาปัตยกรรมส่วนติดต่อผู้ใช้ (Frontend Architecture)</h1>
  <p><strong>พัฒนาด้วย React 18 + Vite + Tailwind CSS สไตล์ Glassmorphism ออกแบบ Mobile-First ระบบ Smart Polling + Smart Cache, Optimistic UI และเสียงแจ้งเตือน Web Audio API Context</strong></p>
</div>

---

## 🎨 โครงสร้างและการจัดระเบียบซอร์สโค้ด (Source Code Overview)

```
frontend/
├── Dockerfile                      # คำสั่งสร้าง Docker Image สำหรับ Build & Serve ด้วย Nginx
├── index.html                      # HTML หลักของ React SPA
├── nginx.conf                      # คอนฟิก Nginx Non-root & API Reverse Proxy
├── package.json                    # รายการไลบรารีและ Dependencies
├── postcss.config.js               # คอนฟิก PostCSS
├── tailwind.config.js              # คอนฟิกชุดสี ธีม Glassmorphism และ Custom Utility Classes
├── vercel.json                     # คอนฟิก Reverse Proxy & Rewrites บน Vercel
├── vite.config.js                  # คอนฟิก Vite Build Tool & Dev Server
└── src/
    ├── App.jsx                     # คอมโพเนนต์หลัก จัดการ Routing สลับระหว่างลูกค้าและแอดมิน
    ├── index.css                   # สไตล์ Glassmorphism, Animations, Fluid Typography
    ├── main.jsx                    # จุดเริ่มต้น React DOM Render & Wrap Context Providers ทั้งหมด
    ├── api/api.js                  # Fetch Wrapper จัดการ Request, Error, Header ETag และ Cookies
    ├── components/                 # คอมโพเนนต์ UI หน้าร้านและ Modals
    │   ├── CartModal.jsx           # ตะกร้าสินค้าแบบ Bottom Sheet Drawer (Mobile)
    │   ├── CartSidebar.jsx         # แถบตะกร้าสินค้าด้านข้างคงที่ (Desktop)
    │   ├── CheckoutModal.jsx       # หน้าต่างตรวจสอบรายการ สรุปยอดเงิน และฟอร์มกรอกข้อมูลจัดส่ง
    │   ├── DressingModal.jsx       # หน้าต่างเลือกน้ำสลัดสำหรับเมนูอาหาร
    │   ├── Header.jsx              # แถบเมนูด้านบน, โลโก้, สถานะร้าน, ปุ่มติดตามออเดอร์ และตะกร้า
    │   ├── MenuGrid.jsx            # การ์ดแสดงเมนูอาหาร, ป้ายสถานะ และตัวกรองหมวดหมู่
    │   ├── MobileCartBar.jsx       # แถบตะกร้าสินค้าลอยตัวด้านล่างสุด (Mobile Floating Bar)
    │   ├── OrderSlipModal.jsx      # หน้าต่างสลิปใบเสร็จอิเล็กทรอนิกส์ (E-Receipt)
    │   └── TrackingModal.jsx       # หน้าต่างค้นหาและติดตามสถานะออเดอร์ (Smart Polling 4s)
    ├── context/                    # ระบบจัดการสถานะส่วนกลาง (Global State Providers)
    │   ├── AdminContext.jsx        # State หมวดหมู่และน้ำสลัดสำหรับหน้าแอดมิน
    │   ├── AlertContext.jsx        # ระบบกล่องข้อความแจ้งเตือนและยืนยัน (Custom Modal)
    │   ├── AuthContext.jsx         # ตรวจสอบและจดจำสถานะเข้าสู่ระบบของแอดมิน
    │   ├── CartContext.jsx         # จัดการตะกร้าสินค้า (Optimistic UI + Debounced Sync 500ms)
    │   └── ToastContext.jsx        # ป๊อปอัปแจ้งเตือนสั้น (Toast Notifications)
    ├── hooks/queries.js            # Hooks รวม TanStack React Query และ Smart Polling
    ├── pages/                      # หน้าหลักของระบบ
    │   ├── CustomerApp.jsx         # หน้าร้านค้าหลักสำหรับลูกค้า
    │   ├── AdminApp.jsx            # โครงสร้างหน้าหลักและ Sidebar/Header ของระบบแอดมิน
    │   └── admin/                  # หน้าย่อยแต่ละแท็บของระบบแอดมิน
    │       ├── Dashboard.jsx       # แดชบอร์ดสรุปยอดขาย Active Batch, วันนี้, เดือนนี้, รวม และ Top 5
    │       ├── Dressings.jsx       # หน้าจัดการเพิ่ม ลบ แก้ไข รายการน้ำสลัดและสถานะเปิด/ปิด
    │       ├── Login.jsx           # หน้าฟอร์มเข้าสู่ระบบแอดมิน
    │       ├── Menu.jsx            # หน้าจัดการเพิ่ม ลบ แก้ไข รายการเมนูอาหารและหมวดหมู่
    │       ├── Orders.jsx          # กระดาน KDS Kanban และ Table View (Smart Polling 4s)
    │       └── Settings.jsx        # หน้าตั้งค่าชื่อร้าน, ข้อความประกาศ และสวิตช์เปิด/ปิดร้าน
    └── utils/audio.js              # เสียงกระดิ่งสังเคราะห์ด้วย Web Audio Context API
```

---

## 🧩 ระบบ Global State Management (React Contexts)

1. **`CartContext.jsx`**:
   * เก็บ State รายการในตะกร้า (`cartItems`), ฟังก์ชัน `addItemToCart`, `updateQuantity`, `removeItem`, `clearCart`
   * คำนวณ `totalQuantity` และ `totalPrice` อัตโนมัติ
   * รองรับ **Optimistic UI Update** ทันที และหน่วงเวลา **500ms Debounce** ก่อนยิง API

2. **`AuthContext.jsx`**:
   * ตรวจสอบเซสชันแอดมินผ่าน `GET /api/admin/me` ตอนโหลดหน้าเว็บ
   * ฟังก์ชัน `login(username, password)` และ `logout()` จัดการคุกกี้เซสชัน

3. **`AlertContext.jsx`**:
   * แสดงกล่องข้อความ Alert / Confirm แบบ Custom Modal สไตล์ Glassmorphism ทดแทน `window.alert()` / `window.confirm()` แบบดั้งเดิม

4. **`ToastContext.jsx`**:
   * แสดง Toast Notification แจ้งเตือนสั้นๆ (เช่น ร้านเปิด/ปิด, เพิ่มสินค้าลงตะกร้า, คัดลอกรหัสออเดอร์) พร้อม Auto-dismiss

5. **`AdminContext.jsx`**:
   * จัดการ State แคชของรายการหมวดหมู่และน้ำสลัดในหน้าแอดมิน

---

## ⚡ Custom React Query Hooks (`hooks/queries.js`)

| Hook Name | Query Key | Polling Interval | คุณสมบัติ & การทำงาน |
|---|---|---|---|
| `useMenu()` | `['menu_and_dressings']` | `staleTime: 5m` | ดึงข้อมูลเมนูอาหารและน้ำสลัดพร้อมกัน (Parallel Fetch) |
| `useStoreStatus()` | `['storeStatus']` | `refetchInterval: 5s` | ตรวจสอบสถานะเปิด/ปิดร้าน ซิงค์สดไปยังลูกค้า |
| `useActiveOrderTracking(orderNumber)` | `['activeOrder', orderNumber]` | `refetchInterval: 4s` | ซิงค์สถานะออเดอร์สด และหยุดอัตโนมัติเมื่อสถานะเสร็จสิ้น |
| `useAdminOrders(statusFilter)` | `['adminOrders', statusFilter]` | `refetchInterval: 4s` | อัปเดตกระดาน Kitchen KDS Kanban สดทุก 4 วินาที |

---

## 🚀 การปรับแต่งประสิทธิภาพและประสบการณ์ผู้ใช้ (Optimizations & UX)

### 1. ⚡ Optimistic UI & Debounced Sync 500ms (`CartContext.jsx`)
* **อัปเดต UI ทันที**: ยอดเงินและจำนวนสินค้าเปลี่ยนทันทีที่กด `+` หรือ `-` โดยไม่ต้องรอเซิร์ฟเวอร์
* **Debounced Sync (500ms)**: รวมคำขออัปเดตตะกร้าส่งไปยัง `/api/cart/update/:id` เพียงครั้งเดียวหลังจากหยุดกด ลดภาระเซิร์ฟเวอร์ > 80%
* **Graceful Rollback**: หากเครือข่ายขัดข้อง ระบบจะดึงข้อมูลจริงล่าสุดมาคืนค่าเดิมอัตโนมัติ

### 2. ⏱️ Smart Polling Auto-Track (`TrackingModal.jsx`)
* **Instant Auto-Track (0 คลิก)**: ดึงรหัสออเดอร์ล่าสุดของเซสชันขึ้นมาแสดงผลทันที ไม่ต้องพิมพ์รหัสซ้ำ
* **แอนิเมชันความคืบหน้า 5 สเต็ป**:
  1. `รอดำเนินการ`: ร้านได้รับออเดอร์ กำลังจัดคิว
  2. `รับออเดอร์แล้ว`: ยืนยันคิว เริ่มเตรียมวัตถุดิบ
  3. `กำลังเตรียมอาหาร`: ครัวกำลังปรุงอาหารสดใหม่
  4. `พร้อมรับอาหาร` / `กำลังจัดส่ง`: ปรุงเสร็จพร้อมรับ หรือไรเดอร์กำลังนำส่ง
  5. `รับอาหารแล้ว` / `จัดส่งแล้ว`: เสร็จสิ้นขั้นตอน
* **Auto-Pause**: หยุด Polling ทันทีเมื่อยุบแท็บ หรือเมื่อออเดอร์อยู่ในสถานะสุดท้าย (`Terminal Status`)

### 3. 🔔 Web Audio API Bell Chime (`audio.js`)
* สังเคราะห์เสียงผ่าน **Web Audio Context API** (Sine Waves) โดยไม่ต้องโหลดไฟล์ MP3 ภายนอก:
  * **เสียงอัปเดตสถานะออเดอร์ (Harmonic Arpeggio)**: F5 (698.46 Hz) -> A5 (880.00 Hz) -> C6 (1046.50 Hz)
  * **เสียงสั่งซื้อสำเร็จ (Success Ding)**: C5 (523.25 Hz) -> G5 (783.99 Hz) -> C6 (1046.50 Hz)

### 4. 📱 Mobile-First Responsive Design
* หน้าร้านค้าใช้ **Bottom Sheet Drawer** (`CartModal.jsx`) และ **Floating Bar** (`MobileCartBar.jsx`) สำหรับสมาร์ทโฟน
* หน้าจอคอมพิวเตอร์ Desktop แสดงผลเป็น **Sticky Sidebar Cart** (`CartSidebar.jsx`)
* Touch Target ขนาดใหญ่ สะดวกต่อการสัมผัส และรองรับ Fluid Typography ภาษาไทย

---

## 🌐 การคอนฟิก Deploy บน Vercel (Free Tier)

กำหนดค่า Reverse Proxy ใน `frontend/vercel.json` เพื่อส่งคำขอ `/api` ไปยัง Backend บน Render:

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
