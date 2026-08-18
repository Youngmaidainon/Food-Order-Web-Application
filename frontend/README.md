<div align="center">
  <h1>✨ สถาปัตยกรรมส่วนติดต่อผู้ใช้ (Frontend Architecture) - ร้านสปริงโรลออนไลน์</h1>
  <p><strong>พัฒนาด้วย React 18 + Vite + Tailwind CSS ดีไซน์หรูหราสไตล์ Glassmorphism รองรับการใช้งานบนมือถือเป็นหลัก (Mobile-First), ระบบสตรีมสถานะแบบเรียลไทม์ (SSE), เสียงแจ้งเตือน และการจัดการ State ประสิทธิภาพสูง</strong></p>
</div>

---

## 🎨 โครงสร้างและการจัดระเบียบซอร์สโค้ด (Source Code Overview)

```
frontend/
├── Dockerfile                      # คำสั่งสร้าง Docker Image สำหรับ Build และ Serve ด้วย Nginx
├── index.html                      # ไฟล์ HTML หลักของ React SPA
├── nginx.conf                      # คอนฟิก Nginx ปลอดภัยแบบ Non-root และ Reverse Proxy
├── package.json                    # รายการไลบรารีและ Dependencies ฝั่ง Frontend
├── postcss.config.js               # คอนฟิก PostCSS สำหรับ Tailwind CSS
├── tailwind.config.js              # คอนฟิกชุดสี ธีม และ Custom Utility Classes
├── vercel.json                     # คอนฟิก Reverse Proxy และ Rewrites สำหรับ Vercel
├── vite.config.js                  # คอนฟิก Vite Build Tool และ Development Server
└── src/
    ├── App.jsx                     # คอมโพเนนต์หลัก จัดการ Routing ระหว่างฝั่งลูกค้าและแอดมิน
    ├── index.css                   # สไตล์หลัก, ธีม Glassmorphism, Animation และ Fluid Typography
    ├── main.jsx                    # จุดเริ่มต้น React DOM Render และ Wrap บริบท Contexts
    ├── api/                        # ตัวจัดการเชื่อมต่อ Backend API
    │   └── api.js                  # Wrapper ส่งคำขอ (sendApiRequest) จัดการ Error และ Cookies
    ├── components/                 # คอมโพเนนต์ UI ฝั่งหน้าร้านและหน้าต่าง Modals
    │   ├── CartModal.jsx           # หน้าต่างสรุปตะกร้าสินค้าแบบเลื่อนเปิดจากด้านล่าง (Bottom Sheet)
    │   ├── CartSidebar.jsx         # แถบตะกร้าสินค้าแบบคงที่ด้านขวาสำหรับหน้าจอคอมพิวเตอร์
    │   ├── CheckoutModal.jsx       # หน้าต่างตรวจสอบรายการ สรุปยอดเงิน และกรอกข้อมูลจัดส่ง
    │   ├── DressingModal.jsx       # หน้าต่างตัวเลือกน้ำสลัดสำหรับเมนูที่ต้องเลือกน้ำสลัด
    │   ├── Header.jsx              # แถบเมนูด้านบน, โลโก้, สถานะร้าน, ปุ่มติดตามออเดอร์ และปุ่มตะกร้า
    │   ├── MenuGrid.jsx            # การ์ดแสดงรายการเมนูอาหาร, ป้ายสถานะ และตัวกรองหมวดหมู่
    │   ├── MobileCartBar.jsx       # แถบตะกร้าสินค้าแบบลอยตัวด้านล่างสุดสำหรับหน้าจอมือถือ
    │   ├── OrderSlipModal.jsx      # หน้าต่างแสดงสลิปใบเสร็จรับเงินอิเล็กทรอนิกส์ (E-Receipt)
    │   └── TrackingModal.jsx       # หน้าต่างค้นหาและติดตามสถานะออเดอร์แบบเรียลไทม์ (SSE)
    ├── context/                    # ระบบจัดการสถานะส่วนกลาง (Global State Management)
    │   ├── AdminContext.jsx        # ตัวจัดการ State ข้อมูลหมวดหมู่และน้ำสลัดสำหรับหน้าแอดมิน
    │   ├── AlertContext.jsx        # ระบบกล่องข้อความแจ้งเตือนและยืนยัน (Custom Alert/Confirm)
    │   ├── AuthContext.jsx         # ระบบตรวจสอบและจดจำสถานะการเข้าสู่ระบบของแอดมิน
    │   ├── CartContext.jsx         # ระบบจัดการตะกร้าสินค้า (Optimistic UI + Debounced Sync)
    │   └── ToastContext.jsx        # ระบบแสดงข้อความแจ้งเตือนป๊อปอัปสั้น (Toast Notifications)
    ├── hooks/                      # Custom React Hooks
    │   ├── queries.js              # Hook ฟังก์ชันรวมการเรียกข้อมูลเมนู หมวดหมู่ และน้ำสลัด
    │   └── useSSE.js               # Custom Hook สำหรับเชื่อมต่อ Server-Sent Events แบบเรียลไทม์
    ├── pages/                      # หน้าหลักของระบบ
    │   ├── AdminApp.jsx            # โครงสร้างหน้าหลักและ Layout ของระบบแอดมิน
    │   ├── CustomerApp.jsx         # หน้าร้านค้าหลักสำหรับลูกค้าเลือกดูและสั่งอาหาร
    │   └── admin/                  # หน้าย่อยแต่ละแท็บของระบบแอดมิน
    │       ├── Dashboard.jsx       # แดชบอร์ดสรุปสถิติยอดขายวันนี้/เดือนนี้/ทั้งหมด และเมนูขายดี
    │       ├── Dressings.jsx       # หน้าจัดการเพิ่ม ลบ แก้ไข รายการน้ำสลัดและสถานะเปิด/ปิด
    │       ├── Login.jsx           # หน้าฟอร์มเข้าสู่ระบบแอดมิน
    │       ├── Menu.jsx            # หน้าจัดการเพิ่ม ลบ แก้ไข รายการเมนูอาหารและหมวดหมู่
    │       ├── Orders.jsx          # กระดานควบคุมและเปลี่ยนสถานะคำสั่งซื้อแบบเรียลไทม์
    │       └── Settings.jsx        # หน้าตั้งค่าชื่อร้าน, ข้อความประกาศ และสวิตช์เปิด/ปิดร้าน
    └── utils/                      # ฟังก์ชันช่วยเหลือและยูทิลิตี้
        └── audio.js                # ตัวกำเนิดเสียงกระดิ่งแจ้งเตือนด้วย Web Audio Context API
```

---

## 🚀 เทคนิคการปรับจูนประสิทธิภาพและประสบการณ์ผู้ใช้ (Optimizations & UX)

### 1. ⚡ การอัปเดตหน้าจอทันทีและการหน่วงเวลาส่งข้อมูล (`CartContext.jsx`)
- **การตอบสนองทันที (Instant Response)**: หน้าจออัปเดตจำนวนและยอดเงินทันทีที่กด โดยไม่ต้องรอการตอบกลับจากเซิร์ฟเวอร์
- **การหน่วงเวลาส่งข้อมูล (Debounced Sync)**: หน่วงเวลา 500 มิลลิวินาที ก่อนส่งคำขอ `/api/cart/update` ไปยังเซิร์ฟเวอร์ เพื่อลดปริมาณคำขอที่ไม่จำเป็น
- **การคืนค่าอัตโนมัติเมื่อเกิดข้อผิดพลาด (Graceful Rollback)**: หากระบบเครือข่ายมีปัญหา ข้อมูลจริงจากเซิร์ฟเวอร์จะถูกนำกลับมาแสดงผลแทนอัตโนมัติ

### 2. 📱 การปรับขนาดตัวอักษรและเลย์เอาต์ตามอุปกรณ์ (`index.css`)
- ปรับขนาดตัวอักษรพื้นฐานตามขนาดหน้าจออัตโนมัติ (14px บนมือถือ, 15px บนแท็บเล็ต, 16px บนคอมพิวเตอร์) เพื่อการอ่านภาษาไทยที่สบายตา
- เลือกใช้ฟอนต์ **Prompt** ผสานกับเอฟเฟกต์กระจกฝ้า (Glassmorphism) และโทนสีมืดระดับพรีเมียม

### 3. ⏱️ การติดตามออเดอร์แบบเรียลไทม์และการแจ้งเตือนด้วยเสียง (`TrackingModal.jsx` และ `audio.js`)
- เชื่อมต่อสตรีมข้อมูลผ่าน Server-Sent Events (SSE) ทาง `/api/orders/events/:order_number`
- เล่นเสียงกระดิ่งแจ้งเตือน (Harmonic Bell Chime) อัตโนมัติเมื่อสถานะออเดอร์มีการเปลี่ยนแปลง
- ระบบจะจดจำและดึงข้อมูลออเดอร์ล่าสุดของลูกค้ามาแสดงให้อัตโนมัติเมื่อเปิดหน้าต่างติดตาม

---

## 🚀 การติดตั้งและเผยแพร่บน Vercel (Free Tier)

กำหนดค่า Reverse Proxy / Rewrites ผ่านไฟล์ `frontend/vercel.json`:

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
> การตั้งค่า Rewrites ช่วยให้การเรียกใช้งาน `/api/*` ส่งตรงผ่านโดเมนของ Vercel ซึ่งช่วยแก้ปัญหา CORS ได้ 100% พร้อมป้องกันปัญหาข้อผิดพลาด 404 เมื่อกดรีเฟรชหน้าเว็บบนระบบ Single Page Application (SPA)
