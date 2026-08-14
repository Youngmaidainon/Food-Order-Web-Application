import { executeQuery } from '../shared/database/database.js';

export class CronRepository {
  async cleanupSessions() {
    const [cartCleanupResult, adminCleanupResult] = await Promise.all([
      // Cleanup old unauthenticated cart sessions (older than 15 minutes)
      executeQuery(`
        DELETE FROM cart_sessions 
        WHERE last_accessed_at < NOW() - INTERVAL '15 minutes'
      `),
      // Cleanup expired admin sessions
      executeQuery(`
        DELETE FROM admin_sessions 
        WHERE expires_at < NOW()
      `)
    ]);

    return {
      deletedCartSessions: cartCleanupResult.rowCount || 0,
      deletedAdminSessions: adminCleanupResult.rowCount || 0
    };
  }
}
