import express from 'express';
import { executeQuery } from '../../config/database.js';
import { authenticateAdminSession } from '../../middleware/auth.js';

const menuRouter = express.Router();

// GET /api/admin/menu - Get all menu items (including hidden)
menuRouter.get('/', authenticateAdminSession, async (request, response) => {
  try {
    const fetchAdminMenuItemsSql = `
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
      ORDER BY menuItem.id ASC
    `;
    const adminMenuQueryResult = await executeQuery(fetchAdminMenuItemsSql);
    return response.json({ success: true, data: adminMenuQueryResult.rows });
  } catch (fetchAdminMenuError) {
    console.error('Error fetching admin menu items:', fetchAdminMenuError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// POST /api/admin/menu - Add new menu item
menuRouter.post('/', authenticateAdminSession, async (request, response) => {
  const { category_id: categoryId, name: menuItemName, description: menuItemDescription, price: menuItemPrice, image_url: menuItemImageUrl, is_available: isAvailable } = request.body;

  if (!menuItemName || menuItemPrice === undefined) {
    return response.status(400).json({ success: false, message: 'กรุณาระบุชื่อสินค้าและราคา' });
  }

  if (parseFloat(menuItemPrice) < 0) {
    return response.status(400).json({ success: false, message: 'ราคาสินค้าต้องไม่ติดลบ' });
  }

  try {
    const insertMenuItemSql = `
      INSERT INTO menu_items (category_id, name, description, price, image_url, is_available)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const insertValues = [
      categoryId || 1,
      menuItemName.trim(),
      menuItemDescription || 'ชิ้นพอดีกิน อีสฉ่ำ✨',
      menuItemPrice,
      menuItemImageUrl || '🌯',
      isAvailable !== undefined ? isAvailable : true
    ];

    const insertResult = await executeQuery(insertMenuItemSql, insertValues);
    const createdMenuItem = insertResult.rows[0];

    return response.status(201).json({ success: true, message: 'เพิ่มเมนูเรียบร้อยแล้ว', data: createdMenuItem });
  } catch (addMenuItemError) {
    console.error('Error adding new menu item:', addMenuItemError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// PUT /api/admin/menu/:id - Edit menu item
menuRouter.put('/:id', authenticateAdminSession, async (request, response) => {
  const { id: menuItemId } = request.params;
  const { category_id: categoryId, name: menuItemName, description: menuItemDescription, price: menuItemPrice, image_url: menuItemImageUrl, is_available: isAvailable } = request.body;

  if (menuItemPrice !== undefined && parseFloat(menuItemPrice) < 0) {
    return response.status(400).json({ success: false, message: 'ราคาสินค้าต้องไม่ติดลบ' });
  }

  try {
    const existingMenuItemResult = await executeQuery('SELECT name FROM menu_items WHERE id = $1', [menuItemId]);
    if (existingMenuItemResult.rows.length === 0) {
      return response.status(404).json({ success: false, message: 'ไม่พบเมนูที่ต้องการแก้ไข' });
    }

    const updateMenuItemSql = `
      UPDATE menu_items 
      SET 
        category_id = COALESCE($1, category_id),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        price = COALESCE($4, price),
        image_url = COALESCE($5, image_url),
        is_available = COALESCE($6, is_available)
      WHERE id = $7
      RETURNING *
    `;
    const updateValues = [categoryId, menuItemName, menuItemDescription, menuItemPrice, menuItemImageUrl, isAvailable, menuItemId];

    const updateResult = await executeQuery(updateMenuItemSql, updateValues);
    const updatedMenuItem = updateResult.rows[0];

    return response.json({ success: true, message: 'แก้ไขเมนูเรียบร้อยแล้ว', data: updatedMenuItem });
  } catch (updateMenuItemError) {
    console.error('Error updating menu item:', updateMenuItemError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// DELETE /api/admin/menu/:id - Delete menu item
menuRouter.delete('/:id', authenticateAdminSession, async (request, response) => {
  const { id: menuItemId } = request.params;
  try {
    const existingOrderItems = await executeQuery('SELECT id FROM order_items WHERE menu_item_id = $1 LIMIT 1', [menuItemId]);
    if (existingOrderItems.rows.length > 0) {
      return response.status(400).json({ success: false, message: 'ไม่สามารถลบได้ เนื่องจากเมนูนี้ถูกสั่งในออเดอร์แล้ว กรุณาปิดการจำหน่ายแทนการลบ เพื่อรักษาประวัติการสั่งซื้อ' });
    }

    const deleteResult = await executeQuery('DELETE FROM menu_items WHERE id = $1 RETURNING *', [menuItemId]);
    if (deleteResult.rows.length === 0) {
      return response.status(404).json({ success: false, message: 'ไม่พบเมนูที่ต้องการลบ' });
    }
    return response.json({ success: true, message: 'ลบเมนูเรียบร้อยแล้ว' });
  } catch (deleteMenuItemError) {
    console.error('Error deleting menu item:', deleteMenuItemError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

export default menuRouter;
