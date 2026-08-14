export class DressingsService {
  constructor(dressingsRepository) {
    this.dressingsRepository = dressingsRepository;
  }

  async getDressings() {
    return await this.dressingsRepository.fetchAvailableDressings();
  }
}
