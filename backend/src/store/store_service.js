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
        restaurant_name: 'ร้านสปริงโรลออนไลน์'
      };
    }

    if (resultData && (resultData.announcement_message === 'เปิดรับออเดอร์ค่า' || resultData.announcement_message === 'เปิดรับออเดอร์ค่า💖')) {
      resultData.announcement_message = 'เปิดรับออเดอร์ค่า 💖';
    }

    return resultData;
  }
}
