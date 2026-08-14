import { executeQuery } from '../shared/database/database.js';

export class DressingsRepository {
  async fetchAvailableDressings() {
    const dressingsQueryResult = await executeQuery('SELECT * FROM dressings WHERE is_available = true ORDER BY id ASC');
    return dressingsQueryResult.rows;
  }
}
