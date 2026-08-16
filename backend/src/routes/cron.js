import { Router } from 'express';
import { executeQuery } from '../config/database.js';

const router = Router();

router.all('/maintenance', async (req, res) => {
  const authHeader = req.headers.authorization;
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.error('[CRON] Error: CRON_SECRET is not configured in environment variables.');
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการตั้งค่าเซิร์ฟเวอร์' });
  }

  // รองรับทั้งแบบใส่ Header 'Authorization: Bearer <secret>', แบบส่ง Header 'Authorization: <secret>' และแบบส่ง Query String '?secret=<secret>'
  const providedToken = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : (authHeader || req.query.secret);

  if (providedToken !== expectedSecret) {
    console.warn('[CRON] Warning: Unauthorized access attempt to maintenance endpoint.');
    return res.status(401).json({ success: false, message: 'ไม่มีสิทธิ์ในการเข้าถึง' });
  }

  console.log(`[CRON] Maintenance tasks started at ${new Date().toISOString()}`);

  try {
    // ใช้ Promise.all เพื่อรันคำสั่งลบข้อมูลพร้อมกัน (Parallel) ทำให้ทำงานเสร็จเร็วขึ้น
    const [cartCleanupResult, adminCleanupResult] = await Promise.all([
      // ล้างข้อมูลเซสชันตะกร้าที่ไม่ได้เข้าสู่ระบบ (เก่ากว่า 15 นาที)
      executeQuery(`
        DELETE FROM cart_sessions 
        WHERE last_accessed_at < NOW() - INTERVAL '15 minutes'
      `),
      // ล้างข้อมูลเซสชันผู้ดูแลระบบที่หมดอายุแล้ว
      executeQuery(`
        DELETE FROM admin_sessions 
        WHERE expires_at < NOW()
      `)
    ]);

    const deletedCartSessions = cartCleanupResult.rowCount || 0;
    const deletedAdminSessions = adminCleanupResult.rowCount || 0;

    console.log(`[CRON] Maintenance completed. Deleted Carts: ${deletedCartSessions}, Deleted Admins: ${deletedAdminSessions}`);

    res.status(200).json({
      success: true,
      message: 'การบำรุงรักษาระบบเสร็จสมบูรณ์',
      data: {
        deleted_cart_sessions: deletedCartSessions,
        deleted_admin_sessions: deletedAdminSessions,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[CRON] Maintenance task failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'การบำรุงรักษาระบบล้มเหลว',
      // ส่ง error message กลับไปเฉพาะตอน Dev จะได้ปลอดภัยตอนขึ้น Production
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
