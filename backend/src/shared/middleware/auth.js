import { executeQuery } from '../../config/database.js';

// Middleware ตรวจสอบสิทธิ์ผู้ดูแลระบบ (Authentication) เพื่อป้องกัน BOLA/IDOR
export const authenticateAdminSession = async (request, response, nextFunction) => {
  try {
    let adminSessionId = null;

    // อ่าน Session ID จาก HttpOnly Secure Cookie (ป้องกัน XSS)
    if (request.cookies && request.cookies.springroll_admin_session) {
      adminSessionId = request.cookies.springroll_admin_session;
    }

    if (!adminSessionId) {
      return response.status(401).json({ success: false, message: 'ไม่มีสิทธิ์ในการเข้าถึง: ไม่พบเซสชัน' });
    }

    // ตรวจสอบ Session จากฐานข้อมูล (Parameterized Query ป้องกัน SQLi)
    const sessionQueryDbResult = await executeQuery(
      `SELECT adminUser.id, adminUser.username, adminSession.expires_at 
       FROM admin_sessions adminSession
       JOIN admin_users adminUser ON adminSession.admin_id = adminUser.id
       WHERE adminSession.session_id = $1`,
      [adminSessionId]
    );

    if (sessionQueryDbResult.rows.length === 0) {
      return response.status(401).json({ success: false, message: 'ไม่มีสิทธิ์ในการเข้าถึง: เซสชันไม่ถูกต้อง' });
    }

    const activeSessionRecord = sessionQueryDbResult.rows[0];

    // ตรวจสอบวันหมดอายุของ Session
    if (new Date() > new Date(activeSessionRecord.expires_at)) {
      await executeQuery('DELETE FROM admin_sessions WHERE session_id = $1', [adminSessionId]);
      response.clearCookie('springroll_admin_session');
      return response.status(401).json({ success: false, message: 'ไม่มีสิทธิ์ในการเข้าถึง: เซสชันหมดอายุ' });
    }

    // แนบข้อมูลผู้ดูแลระบบไปกับ Request Context สำหรับใช้งานใน Layer ถัดไป
    request.admin = { id: activeSessionRecord.id, username: activeSessionRecord.username };
    nextFunction();
  } catch (authenticationError) {
    console.error('Authentication middleware error:', authenticationError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
};
