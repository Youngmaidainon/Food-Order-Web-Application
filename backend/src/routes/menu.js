import express from 'express';
import { executeQuery } from '../config/database.js';

const menuRouter = express.Router();

// GET /api/menu - Get all available menu items with category
menuRouter.get('/', async (request, response) => {
  try {
    const fetchMenuItemsSql = `
      SELECT 
        menuItem.id, 
        menuItem.category_id, 
        category.name as category_name, 
        menuItem.name, 
        menuItem.description, 
        menuItem.price, 
        menuItem.image_url, 
        menuItem.is_available, 
        menuItem.created_at
      FROM menu_items menuItem
      LEFT JOIN categories category ON menuItem.category_id = category.id
      WHERE menuItem.is_available = true
      ORDER BY category.display_order ASC, menuItem.id ASC
    `;
    const menuQueryResult = await executeQuery(fetchMenuItemsSql);
    return response.json({ success: true, data: menuQueryResult.rows });
  } catch (menuFetchError) {
    console.error('Error fetching menu items:', menuFetchError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

export default menuRouter;
