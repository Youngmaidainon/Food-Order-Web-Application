import express from 'express';
import { executeQuery } from '../config/database.js';

const storeRouter = express.Router();

/**
 * Central function to check if store is currently accepting orders
 */
export async function checkStoreIsOpen(databaseClient) {
  const queryExecutor = databaseClient ? (sqlText, sqlParams) => databaseClient.query(sqlText, sqlParams) : executeQuery;
  const statusQueryResult = await queryExecutor(
    `SELECT is_open FROM store_status ORDER BY id ASC LIMIT 1`
  );

  if (statusQueryResult.rows.length === 0) return false;

  return !!statusQueryResult.rows[0].is_open;
}

// GET /api/store/status - Fetch store status
storeRouter.get('/status', async (request, response) => {
  try {
    const statusQueryResult = await executeQuery(
      `SELECT is_open, announcement_message, restaurant_name
       FROM store_status ORDER BY id ASC LIMIT 1`
    );

    if (statusQueryResult.rows.length === 0) {
      return response.json({
        success: true,
        data: {
          is_open: false,
          announcement_message: 'ปิดรับออเดอร์',
          restaurant_name: 'ร้านสปริงโรลออนไลน์'
        }
      });
    }

    let resultData = statusQueryResult.rows[0];
    if (resultData && (resultData.announcement_message === 'เปิดรับออเดอร์ค่า' || resultData.announcement_message === 'เปิดรับออเดอร์ค่า💖')) {
      resultData.announcement_message = 'เปิดรับออเดอร์ค่า 💖';
    }

    return response.json({ success: true, data: resultData });
  } catch (storeStatusFetchError) {
    console.error('Error fetching store status:', storeStatusFetchError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

export default storeRouter;
