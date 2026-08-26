import { executeQuery } from '../../config/database.js';

// Admin session authentication middleware
export const authenticateAdminSession = async (request, response, nextFunction) => {
  try {
    let adminSessionId = null;

    if (request.cookies && request.cookies.springroll_admin_session) {
      adminSessionId = request.cookies.springroll_admin_session;
    }

    if (!adminSessionId) {
      return response.status(401).json({ success: false, message: 'ไม่มีสิทธิ์ในการเข้าถึง: ไม่พบเซสชัน' });
    }

    // Verify session in database
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

    // Check session expiry
    if (new Date() > new Date(activeSessionRecord.expires_at)) {
      await executeQuery('DELETE FROM admin_sessions WHERE session_id = $1', [adminSessionId]);
      response.clearCookie('springroll_admin_session');
      return response.status(401).json({ success: false, message: 'ไม่มีสิทธิ์ในการเข้าถึง: เซสชันหมดอายุ' });
    }

    // Attach admin context to request
    request.admin = { id: activeSessionRecord.id, username: activeSessionRecord.username };
    nextFunction();
  } catch (authenticationError) {
    console.error('Authentication middleware error:', authenticationError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
};
