import express from 'express';
import { executeQuery } from '../config/database.js';

const dressingsRouter = express.Router();

// GET /api/dressings - ดึงข้อมูลน้ำสลัดทั้งหมดที่พร้อมใช้งาน
dressingsRouter.get('/', async (request, response) => {
  try {
    const dressingsQueryResult = await executeQuery('SELECT * FROM dressings WHERE is_available = true ORDER BY id ASC');
    return response.json({ success: true, data: dressingsQueryResult.rows });
  } catch (dressingsFetchError) {
    console.error('Error fetching salad dressings:', dressingsFetchError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

export default dressingsRouter;
