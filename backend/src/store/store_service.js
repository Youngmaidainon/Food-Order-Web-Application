import { ValidationError, AppError } from '../shared/errors.js';
import { getDatabaseClient } from '../config/database.js';
import { applicationConfig } from '../config/config.js';
import { sendDiscordDailySummary } from '../discord.js';


export class StoreService {
  constructor(storeRepository) {
    this.storeRepository = storeRepository;
  }

  async checkStoreIsOpen(databaseClient = null) {
    const status = await this.storeRepository.getStoreStatus(databaseClient);
    if (!status) return false;
    return !!status.is_open;
  }

  async getStatus() {
    const resultData = await this.storeRepository.getStoreStatus();
    if (!resultData) {
      return {
        is_open: false,
        announcement_message: 'ปิดรับออเดอร์',
        restaurant_name: 'ร้านสปริงโรลออนไลน์',
        hero_title: '🥗 เมนูเพื่อสุขภาพสดใหม่',
        hero_subtitle: 'ผักสดกรอบ สะอาด อร่อยเต็มคำ — ทำสดใหม่ทุกออเดอร์'
      };
    }

    if (resultData && (resultData.announcement_message === 'เปิดรับออเดอร์ค่า' || resultData.announcement_message === 'เปิดรับออเดอร์ค่า💖')) {
      resultData.announcement_message = 'เปิดรับออเดอร์ค่า 💖';
    }

    if (!resultData.hero_title) {
      resultData.hero_title = '🥗 เมนูเพื่อสุขภาพสดใหม่';
    }
    if (!resultData.hero_subtitle) {
      resultData.hero_subtitle = 'ผักสดกรอบ สะอาด อร่อยเต็มคำ — ทำสดใหม่ทุกออเดอร์';
    }

    return resultData;
  }

  async updateStatus(data) {
    const { 
      is_open: isOpen, 
      announcement_message: announcementMessage, 
      restaurant_name: restaurantName,
      hero_title: heroTitle,
      hero_subtitle: heroSubtitle
    } = data;

    if (restaurantName && restaurantName.length > 100) {
      throw new ValidationError('ชื่อร้านยาวเกินไป (สูงสุด 100 ตัวอักษร)');
    }
    if (announcementMessage && announcementMessage.length > 200) {
      throw new ValidationError('ข้อความประกาศยาวเกินไป (สูงสุด 200 ตัวอักษร)');
    }
    if (heroTitle && heroTitle.length > 150) {
      throw new ValidationError('หัวข้อ Hero ยาวเกินไป (สูงสุด 150 ตัวอักษร)');
    }
    if (heroSubtitle && heroSubtitle.length > 255) {
      throw new ValidationError('คำอธิบายย่อย Hero ยาวเกินไป (สูงสุด 255 ตัวอักษร)');
    }

    const databaseClient = await getDatabaseClient();
    try {
      await databaseClient.query('BEGIN');
      const existingStatus = await this.storeRepository.getStoreStatusForUpdate(databaseClient);
      const wasOpen = existingStatus ? existingStatus.is_open : true;

      // Extract discord messages for async deletion later
      let cancelMessages = [];
      let orderMessages = [];

      // If closing the store
      if (wasOpen && isOpen === false) {
        // 1. Gather stats
        const { total_sales: totalSales, total_orders: totalOrders } = await this.storeRepository.getTodaySales(databaseClient);
        const cancelledCount = await this.storeRepository.getCancelledCount(databaseClient);
        const bestSellers = await this.storeRepository.getBestSellers(databaseClient);

        // Prepare messages to delete outside transaction
        if (applicationConfig.discordCancelWebhookUrl) {
          cancelMessages = await this.storeRepository.getDiscordCancelMessages(databaseClient);
        }
        if (applicationConfig.discordWebhookUrl) {
          orderMessages = await this.storeRepository.getDiscordOrderMessages(databaseClient);
        }

        // 2. Guaranteed Delivery: Send summary to Discord BEFORE clearing DB
        // If this throws, transaction rolls back.
        await sendDiscordDailySummary(totalSales, bestSellers, cancelledCount, totalOrders);

        // 3. Clear DB queue
        await this.storeRepository.clearDailyQueue(databaseClient);
      }

      // Reset queue sequence if state changed
      const stateChanged = (isOpen !== undefined && isOpen !== wasOpen);

      let updateResult = await this.storeRepository.updateStoreStatus(databaseClient, isOpen, announcementMessage, restaurantName, heroTitle, heroSubtitle, stateChanged);
      
      if (!updateResult) {
        updateResult = await this.storeRepository.insertStoreStatus(databaseClient, isOpen, announcementMessage, restaurantName, heroTitle, heroSubtitle);
      }

      await databaseClient.query('COMMIT');

      // 4. Async Fire-and-Forget Discord Cleanup
      // Execute outside transaction to not block DB
      this._asyncCleanupDiscordMessages(cancelMessages, orderMessages);



      return updateResult;
    } catch (error) {
      await databaseClient.query('ROLLBACK');
      if (error instanceof ValidationError || error instanceof AppError) {
        throw error;
      }
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตสถานะร้าน (อาจเชื่อมต่อ Discord ไม่สำเร็จ)', 'INTERNAL_ERROR', 500);
    } finally {
      databaseClient.release();
    }
  }

  _asyncCleanupDiscordMessages(cancelMessages, orderMessages) {
    if (cancelMessages.length > 0 && applicationConfig.discordCancelWebhookUrl) {
      Promise.allSettled(cancelMessages.map(id => 
        fetch(`${applicationConfig.discordCancelWebhookUrl}/messages/${id}`, { method: 'DELETE' })
      )).catch(err => console.error('Error async deleting cancel messages:', err));
    }
    if (orderMessages.length > 0 && applicationConfig.discordWebhookUrl) {
      Promise.allSettled(orderMessages.map(id => 
        fetch(`${applicationConfig.discordWebhookUrl}/messages/${id}`, { method: 'DELETE' })
      )).catch(err => console.error('Error async deleting order messages:', err));
    }
  }
}
