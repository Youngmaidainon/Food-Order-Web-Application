// Dressings business logic
export class DressingsService {
  constructor(dressingsRepository) {
    this.dressingsRepository = dressingsRepository;
  }

  // Get available dressings
  async getDressings() {
    return await this.dressingsRepository.fetchAvailableDressings();
  }
}
