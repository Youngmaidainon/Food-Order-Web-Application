import { executeQuery } from '../shared/database/database.js';

export class StoreRepository {
  async getStoreStatus(databaseClient = null) {
    const queryExecutor = databaseClient ? (sqlText, sqlParams) => databaseClient.query(sqlText, sqlParams) : executeQuery;
    const statusQueryResult = await queryExecutor(
      `SELECT is_open, announcement_message, restaurant_name
       FROM store_status ORDER BY id ASC LIMIT 1`
    );
    return statusQueryResult.rows.length > 0 ? statusQueryResult.rows[0] : null;
  }
}
