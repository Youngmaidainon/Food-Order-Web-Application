import { UnauthorizedError } from '../shared/errors.js';

export class CronService {
  constructor(cronRepository) {
    this.cronRepository = cronRepository;
  }

  async runMaintenance(providedToken) {
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!expectedSecret) {
      throw new Error('CRON_SECRET is not configured in environment variables.');
    }

    if (providedToken !== expectedSecret) {
      throw new UnauthorizedError('ไม่มีสิทธิ์ในการเข้าถึง');
    }

    const { deletedCartSessions, deletedAdminSessions } = await this.cronRepository.cleanupSessions();

    return {
      deleted_cart_sessions: deletedCartSessions,
      deleted_admin_sessions: deletedAdminSessions,
      timestamp: new Date().toISOString()
    };
  }
}
