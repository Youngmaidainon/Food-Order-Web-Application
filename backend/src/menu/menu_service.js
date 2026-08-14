export class MenuService {
  constructor(menuRepository) {
    this.menuRepository = menuRepository;
  }

  async getMenu() {
    return await this.menuRepository.fetchAvailableMenuItems();
  }
}
