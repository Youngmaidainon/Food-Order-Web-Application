import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '../../config/database.js';
import { authenticateAdminSession } from '../../middleware/auth.js';
import { validate } from '../../shared/middleware/validate.js';
import { adminLoginSchema } from '../../shared/validators/index.js';

const authRouter = express.Router();

// POST /api/admin/login - Login admin
authRouter.post('/login', validate(adminLoginSchema), async (request, response) => {
  const { username, password } = request.body;

  try {
    let adminQueryResult = await executeQuery('SELECT id, username, password_hash, password_rotated_at FROM admin_users WHERE username = $1', [username]);

    const initUsername = process.env.ADMIN_INIT_USERNAME || 'admin';
    const initPassword = (process.env.ADMIN_INIT_PASSWORD || '').trim();

    // Auto-create initial admin if DB is somehow empty or seed failed
    if (adminQueryResult.rows.length === 0 && initPassword && username === initUsername && password === initPassword) {
      const hashedPassword = await bcrypt.hash(password, 12);
      await executeQuery('INSERT INTO admin_users (username, password_hash, password_rotated_at) VALUES ($1, $2, NOW())', [username, hashedPassword]);
      adminQueryResult = await executeQuery('SELECT id, username, password_hash, password_rotated_at FROM admin_users WHERE username = $1', [username]);
      console.log('🔒 Admin user successfully auto-created on first login.');
    }

    if (adminQueryResult.rows.length === 0) {
      return response.status(401).json({ success: false, message: 'ชื่อผู้ใช้ หรือ รหัสผ่าน ไม่ถูกต้อง' });
    }

    const adminUserRecord = adminQueryResult.rows[0];
    let isPasswordValid = false;

    if (adminUserRecord.password_hash) {
      // Check if it's the dummy hash
      if (adminUserRecord.password_hash.startsWith('$2a$10$X8X8X8X8X8X8X8X8X8X8X')) {
        if (initPassword && password === initPassword) {
          isPasswordValid = true;
          const hashedPassword = await bcrypt.hash(password, 12);
          await executeQuery('UPDATE admin_users SET password_hash = $1, password_rotated_at = NOW() WHERE username = $2', [hashedPassword, username]);
        }
      } else {
        isPasswordValid = await bcrypt.compare(password, adminUserRecord.password_hash);
      }
    }

    if (!isPasswordValid) {
      return response.status(401).json({ success: false, message: 'ชื่อผู้ใช้ หรือ รหัสผ่าน ไม่ถูกต้อง' });
    }

    const newAdminSessionId = uuidv4();
    const sessionExpirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await executeQuery(
      'INSERT INTO admin_sessions (session_id, admin_id, expires_at) VALUES ($1, $2, $3)',
      [newAdminSessionId, adminUserRecord.id, sessionExpirationDate]
    );

    response.cookie('springroll_admin_session', newAdminSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && process.env.HTTPS_ENABLED === 'true',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    return response.json({
      success: true,
      admin: { id: adminUserRecord.id, username: adminUserRecord.username }
    });
  } catch (adminLoginError) {
    console.error('Error during admin login:', adminLoginError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// POST /api/admin/logout - Logout admin
authRouter.post('/logout', authenticateAdminSession, async (request, response) => {
  try {
    const activeAdminSessionId = request.cookies.springroll_admin_session;
    if (activeAdminSessionId) {
      await executeQuery('DELETE FROM admin_sessions WHERE session_id = $1', [activeAdminSessionId]);
      response.clearCookie('springroll_admin_session');
    }
    return response.json({ success: true });
  } catch (adminLogoutError) {
    console.error('Error during admin logout:', adminLogoutError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// GET /api/admin/me - Get current admin session
authRouter.get('/me', authenticateAdminSession, (request, response) => {
  return response.json({ success: true, admin: request.admin });
});

export default authRouter;
