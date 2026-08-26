// Menu business logic
export class MenuService {
  constructor(menuRepository) {
    this.menuRepository = menuRepository;
  }

  // Get available menu items
  async getMenu() {
    return await this.menuRepository.fetchAvailableMenuItems();
  }
}
