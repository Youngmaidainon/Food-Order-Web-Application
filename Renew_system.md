คุณคือ Senior Full-Stack Software Engineer & DevOps Architect
หน้าที่ของคุณคือ: รื้อถอนระบบ Server-Sent Events (SSE) และ Smart Fallback ออกจากระบบ Spring Roll Online Store ทั้งหมด 100% แล้วเปลี่ยนผ่านสู่สถาปัตยกรรม "Smart Polling + Smart Cache" อย่างสมบูรณ์แบบ โดยห้ามแตะต้อง Business Logic, UI Design, Glassmorphism Styling, Cart Optimistic UI หรือ Discord Notifications อื่นๆ

จงดำเนินการตาม 4 เฟสอย่างเคร่งครัดดังต่อไปนี้:

======================================================================
PHASE 1: DATABASE LAYER (การปรับแต่งฐานข้อมูล & Performance Indexes)
======================================================================
1.1 เป้าหมาย:
   - ปรับแต่ง Database ให้รองรับความถี่ของการ Polling จากทั้งฝั่ง Customer และ Admin อย่างมีประสิทธิภาพสูงสุด (Zero Bottleneck)
   - ไม่มีการลบข้อมูลจริงใน Database แต่ต้องตรวจสอบและเพิ่ม Index สำหรับ Query Polling

1.2 การแก้ไขไฟล์ `database/schema.sql`:
   - ตรวจสอบและคงไว้ซึ่ง B-Tree Indexes ที่จำเป็นสำหรับ Polling:
     * `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`
     * `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);`
     * `CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);`
     * `CREATE INDEX IF NOT EXISTS idx_orders_session_active ON orders(session_id) WHERE deleted_at IS NULL;`
   - ลบคอมเมนต์หรือข้อความใดๆ ที่อ้างอิงถึง SSE ในไฟล์ `database/schema.sql` (หากมี)

======================================================================
PHASE 2: BACKEND API (รื้อถอน SSE, ลบ Dead Code, ปรับ Rate Limit & Smart Cache)
======================================================================
2.1 ลบไฟล์ (Delete Files):
   - ลบ `backend/src/shared/sse.js` (คลาส SSEManager ทั้งหมด)
   - ลบ `backend/src/admin/events_controller.js` (Route: /api/admin/events)
   - ลบ `backend/src/orders/events_controller.js` (Route: /api/orders/events/:order_number)

2.2 ตัดการเชื่อมต่อ Route และ Dead Code ใน Controllers & Services:
   1. `backend/src/index.js`:
      - ปรับ `generalApiRateLimiter` ให้รองรับการ Polling (ปรับ max จาก 200 เป็น 600 ครั้ง / 15 นาที หรือตามความเหมาะสมของ Polling Interval)
      - คง Headers ความปลอดภัยและ No-Store สำหรับ Dynamic API ไว้ แต่เปิดรองรับ ETag (`app.set('etag', 'strong');`) เพื่อให้เบราว์เซอร์สามารถส่ง `If-None-Match` และเซิร์ฟเวอร์ตอบ `304 Not Modified` เมื่อข้อมูลไม่มีการเปลี่ยนแปลง (Smart Cache)
   
   2. `backend/src/admin/admin_controller.js`:
      - ลบ: `import { eventsRouter } from './events_controller.js';`
      - ลบ: `adminRouter.use('/events', eventsRouter);`

   3. `backend/src/orders/orders_controller.js`:
      - ลบ: `import { eventsRouter } from './events_controller.js';`
      - ลบ: `ordersRouter.use('/events', eventsRouter);`
      - ปรับแต่ง `trackOrderRateLimiter`: จากเดิม max: 20 ต่อ 15 นาที ปรับเป็น max: 300 ต่อ 15 นาที เพื่อไม่ให้ติด Rate Limit ขณะที่ฝั่งลูกค้าทำ Smart Polling สถานะออเดอร์ทุก 3-5 วินาที

   4. `backend/src/store/store_controller.js`:
      - ลบ: `import { sseManager } from '../shared/sse.js';`
      - ลบ Route `GET /api/store/events` ทั้งหมด (บรรทัดที่ 16-27)
      - ปรับแต่ง `storeRateLimiter`: ปรับ max เป็น 300 ต่อ 15 นาที เพื่อรองรับ Polling สถานะเปิด/ปิดร้าน

   5. `backend/src/store/store_service.js`:
      - ลบ: `import { sseManager } from '../shared/sse.js';`
      - ลบ: `sseManager.broadcast('store_status', updateResult);`

   6. `backend/src/orders/orders_service.js`:
      - ลบ: `import { sseManager } from '../shared/sse.js';`
      - ลบ: `sseManager.emitToAdmin('new_order', completeOrderPayload);`
      - ลบ: `sseManager.emitToAdmin('order_status_updated', updatedOrderPayload);`

   7. `backend/src/admin/orders_controller.js`:
      - ลบ: `import { sseManager } from '../shared/sse.js';`
      - ลบ: `sseManager.emitToAdmin('order_status_updated', updatedOrderPayload);`
      - ลบ: `sseManager.emitToCustomer(orderQueryResult.rows[0].order_number, 'order_status_updated', updatedOrderPayload);`
      - ลบ: `sseManager.emitToAdmin('order_status_updated', { type: 'queue_reset' });`

======================================================================
PHASE 3: FRONTEND CLIENT (เปลี่ยนเป็น TanStack React Query Smart Polling + Smart Cache)
======================================================================
3.1 ลบไฟล์ (Delete Files):
   - ลบ `frontend/src/hooks/useSSE.js`

3.2 อัปเกรด `frontend/src/hooks/queries.js` เป็นศูนย์กลาง Smart Polling & Cache:
   - เพิ่ม Hook สำหรับ Polling:
     * `useStoreStatus()`:
       - `staleTime: 10000` (10s)
       - `refetchInterval: 15000` (Smart Polling ทุก 15s เมื่อร้านเปิด/ปิด)
       - `refetchOnWindowFocus: true` (ซิงค์ทันทีเมื่อสลับแท็บกลับมา)
       - `refetchIntervalInBackground: false` (หยุด Polling เมื่อยุบจอ เพื่อประหยัดแบตเตอรี่และ Bandwidth)
     * `useActiveOrderTracking(orderNumber)`:
       - เปิด Polling ทุก 3-5 วินาที (`refetchInterval: (query) => ...`) เมื่อออเดอร์ยังไม่ถึง Terminal Status ('เสร็จสิ้น', 'ยกเลิก', 'รับอาหารแล้ว', 'จัดส่งแล้ว')
       - หยุด Polling ทันทีเมื่อออเดอร์เสร็จสิ้น
     * `useAdminOrders(statusFilter)`:
       - `refetchInterval: 4000` (Smart Polling สำหรับหน้ากระดานครัวและตารางออเดอร์ทุก 4s)
       - `refetchOnWindowFocus: true`

3.3 ปรับปรุงคอมโพเนนต์ต่างๆ:
   1. `frontend/src/pages/CustomerApp.jsx`:
      - ลบ: `import { useSSE } from '../hooks/useSSE.js';`
      - ลบ: `storeSseUrl`, `useSSE(storeSseUrl)`, `storeSseData`, `isStoreSseConnected`
      - ลบ: SSE useEffects และ Fallback Polling `setInterval` ทั้งหมด
      - ใช้ Data จาก `useStoreStatus()` โดยตรง พร้อมตรวจจับ State Diff เพื่อยิง Toast แจ้งเตือนเมื่อร้านเปิด/ปิด
      - ใช้ Smart Polling สำหรับ Active Order โดยเปรียบเทียบสถานะเก่า-ใหม่เพื่อเล่นเสียง Chime (`customerSoundAlert.playStatusUpdateChime()`) และแสดง Toast

   2. `frontend/src/pages/admin/Orders.jsx`:
      - ลบ: `import { useSSE } from '../../hooks/useSSE.js';`
      - ลบ: `useSSE(getApiUrl('/admin/events'))`, `isSSEConnected`, Fallback timer
      - ใช้ Smart Polling Interval (3-5s) ผ่าน React Query หรือ useEffect Polling ที่มี Visibility State Check
      - ตรวจจับจำนวนหรือสถานะออเดอร์ที่เปลี่ยนเพื่อแจ้งเตือนแอดมิน

   3. `frontend/src/pages/admin/Dashboard.jsx`:
      - ลบ: `import { useSSE } from '../../hooks/useSSE.js';`
      - ลบ: `useSSE(getApiUrl('/admin/events'))`, `isSSEConnected`, Fallback timer
      - ตั้ง Smart Polling Interval 15s-30s ดึงข้อมูลสถิติยอดขายอัตโนมัติ

   4. `frontend/src/components/TrackingModal.jsx`:
      - ลบ: `import { useSSE } from '../hooks/useSSE.js';`
      - ลบ: `useSSE(sseUrl)`, `isSSEConnected`, Fallback polling timer
      - ใช้ Smart Polling ดึงสถานะออเดอร์ทุก 3-5s เฉพาะขณะที่ Modal กำลังเปิดอยู่ (`isOpen === true`) และหยุดทันทีเมื่อปิด Modal

======================================================================
PHASE 4: NGINX & DEPLOYMENT CONFIGURATIONS (ปรับแต่ง Proxy & Caching)
======================================================================
4.1 แก้ไข `frontend/nginx.conf`:
   - รื้อถอน Block `location ~* ^/api/(.*/events|events)` ออกทั้งหมด (เนื่องจากไม่มี Endpoint สตรีม Long-Lived Connection อีกต่อไป)
   - ปรับแต่ง Block `location /api/`:
     * เปิดใช้งาน HTTP/1.1 Keep-Alive Connection Pool ไปยัง Backend
     * ส่งต่อ Headers: `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`
     * รองรับ HTTP Conditional Requests (`If-None-Match`, `If-Modified-Since`)
     * ปรับ `proxy_buffering on;`, `proxy_read_timeout 30s;`, `proxy_send_timeout 30s;`
   - คงการ Caching ไฟล์ Static ใน `/assets/` (Immutable 1 ปี) และ No-Cache สำหรับ `index.html` ไว้คงเดิม

4.2 ตรวจสอบ `frontend/vercel.json` และ `docker-compose.yml`:
   - ตรวจสอบ Rewrites และ Clean Configuration ให้รองรับ REST Polling เต็มรูปแบบ

======================================================================
PHASE 5: DOCUMENTATION UPDATES (อัปเดต README ทุกฉบับให้ตรงตามระบบใหม่ 100%)
======================================================================
5.1 อัปเดต `README.md` (Root):
   - เปลี่ยน Badge: ลบ `Realtime SSE` -> แทนที่ด้วย `Smart Polling & Intelligent Cache (TanStack Query + HTTP 304)`
   - ปรับ Mermaid Diagram: ตัดโหนด `SSE Real-Time Hub` ออก และเปลี่ยนเป็น Data Flow ของ `Smart Polling & Cache Layer`
   - อัปเดตส่วน "จุดเด่นและฟีเจอร์สำคัญ" และ "การจัดการแคช":
     * อธิบายเทคโนโลยี Smart Polling (Adaptive Interval 3-15s, Tab Visibility Auto-Pause, Window Focus Revalidation)
     * อธิบาย Smart Caching Strategy (Stale-While-Revalidate, HTTP 304 Not Modified, Zero-Stale Data Policy)
   - อัปเดตโครงสร้างไดเรกทอรี: ลบ `sse.js`, `useSSE.js`, `events_controller.js` ออกจากผังไดเรกทอรี

5.2 อัปเดต `backend/README.md`:
   - ลบรายการ Route `/api/store/events`, `/api/orders/events/:order_number`, `/api/admin/events` ออกจากตาราง API Reference
   - ลบหัวข้อ "1. Server-Sent Events Manager"
   - อัปเดตคำอธิบาย Rate Limiting ให้ตรงกับค่าใหม่ที่ปรับปรุงเพื่อรองรับ Polling
   - อัปเดตผังโฟลเดอร์ตัด `sse.js` และ `events_controller.js` ออก

5.3 อัปเดต `frontend/README.md`:
   - ลบ `useSSE.js` ออกจากผังโฟลเดอร์และคำอธิบาย Hook
   - ปรับปรุงหัวข้อ "การติดตามออเดอร์อัจฉริยะ" และ "การซิงค์สถานะร้านค้า" เป็น Smart Polling Architecture
   - อธิบายการประหยัดพลังงานด้วย Tab Visibility Listener (หยุด Polling เมื่อไม่ได้เปิดแท็บหน้าเว็บ)

5.4 อัปเดต `database/README.md`:
   - อัปเดตคำอธิบายดัชนี (Indexes) ว่าถูกปรับจูนเพื่อรองรับ High-Frequency Polling Queries สำหรับคำสั่งซื้อและสถานะร้านค้า
