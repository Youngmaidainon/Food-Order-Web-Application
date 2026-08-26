import { executeQuery } from '../config/database.js';

// Menu database operations
export class MenuRepository {
  // Fetch available menu items
  async fetchAvailableMenuItems() {
    const fetchMenuItemsSql = `
      SELECT 
        menuItem.id, 
        menuItem.category_id, 
        category.name as category_name, 
        menuItem.name, 
        menuItem.description, 
        FLOOR(menuItem.price)::INT as price, 
        menuItem.image_url, 
        menuItem.is_available, 
        menuItem.created_at
      FROM menu_items menuItem
      LEFT JOIN categories category ON menuItem.category_id = category.id
      WHERE menuItem.is_available = true
      ORDER BY category.display_order ASC, menuItem.id ASC
    `;
    const menuQueryResult = await executeQuery(fetchMenuItemsSql);
    return menuQueryResult.rows;
  }
}
