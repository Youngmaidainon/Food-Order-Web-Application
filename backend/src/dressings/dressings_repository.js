import { executeQuery } from '../config/database.js';

// Dressings database operations
export class DressingsRepository {
  // Fetch available dressings
  async fetchAvailableDressings() {
    const dressingsQueryResult = await executeQuery('SELECT * FROM dressings WHERE is_available = true ORDER BY id ASC');
    return dressingsQueryResult.rows;
  }
}
