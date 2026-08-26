import express from 'express';
import { executeQuery } from '../config/database.js';
import { authenticateAdminSession } from '../shared/middleware/auth.js';

const categoriesRouter = express.Router();

// GET /api/admin/categories - Get all categories
categoriesRouter.get('/', authenticateAdminSession, async (request, response) => {
  try {
    const categoriesQueryResult = await executeQuery('SELECT * FROM categories ORDER BY display_order ASC, id ASC');
    return response.json({ success: true, data: categoriesQueryResult.rows });
  } catch (fetchCategoriesError) {
    console.error('Error fetching admin categories:', fetchCategoriesError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// POST /api/admin/categories - Create category
categoriesRouter.post('/', authenticateAdminSession, async (request, response) => {
  const { name: categoryName, display_order: displayOrder = 0 } = request.body;
  if (!categoryName || typeof categoryName !== 'string' || categoryName.trim() === '') {
    return response.status(400).json({ success: false, message: 'กรุณาระบุชื่อหมวดหมู่' });
  }

  try {
    const insertCategoryResult = await executeQuery(
      'INSERT INTO categories (name, display_order) VALUES ($1, $2) RETURNING *',
      [categoryName.trim(), displayOrder]
    );
    const createdCategory = insertCategoryResult.rows[0];

    return response.status(201).json({ success: true, message: 'เพิ่มหมวดหมู่เรียบร้อยแล้ว', data: createdCategory });
  } catch (addCategoryError) {
    console.error('Error adding category:', addCategoryError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// PUT /api/admin/categories/:id - Update category
categoriesRouter.put('/:id', authenticateAdminSession, async (request, response) => {
  const { id: categoryId } = request.params;
  const { name: categoryName, display_order: displayOrder } = request.body;

  const parsedId = parseInt(categoryId, 10);
  if (isNaN(parsedId)) {
    return response.status(400).json({ success: false, message: 'รหัสหมวดหมู่ไม่ถูกต้อง' });
  }

  try {
    const existingCategoryResult = await executeQuery('SELECT id FROM categories WHERE id = $1', [parsedId]);
    if (existingCategoryResult.rows.length === 0) {
      return response.status(404).json({ success: false, message: 'ไม่พบหมวดหมู่ที่ต้องการแก้ไข' });
    }

    const updateCategoryResult = await executeQuery(
      `UPDATE categories 
       SET 
         name = COALESCE($1, name),
         display_order = COALESCE($2, display_order)
       WHERE id = $3 RETURNING *`,
      [categoryName ? categoryName.trim() : null, displayOrder, parsedId]
    );

    const updatedCategory = updateCategoryResult.rows[0];
    return response.json({ success: true, message: 'แก้ไขหมวดหมู่เรียบร้อยแล้ว', data: updatedCategory });
  } catch (updateCategoryError) {
    console.error('Error updating category:', updateCategoryError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// DELETE /api/admin/categories/:id - Delete category
categoriesRouter.delete('/:id', authenticateAdminSession, async (request, response) => {
  const { id: categoryId } = request.params;
  const parsedId = parseInt(categoryId, 10);
  if (isNaN(parsedId)) {
    return response.status(400).json({ success: false, message: 'รหัสหมวดหมู่ไม่ถูกต้อง' });
  }

  try {
    const existingCategoryResult = await executeQuery('SELECT id FROM categories WHERE id = $1', [parsedId]);
    if (existingCategoryResult.rows.length === 0) {
      return response.status(404).json({ success: false, message: 'ไม่พบหมวดหมู่ที่ต้องการลบ' });
    }

    const existingMenuItems = await executeQuery('SELECT id FROM menu_items WHERE category_id = $1 LIMIT 1', [parsedId]);
    if (existingMenuItems.rows.length > 0) {
      return response.status(400).json({
        success: false,
        message: 'ไม่สามารถลบหมวดหมู่นี้ได้ เนื่องจากยังมีเมนูอาหารอยู่ในหมวดหมู่นี้ กรุณาย้ายหรือลบเมนูอาหารออกก่อน'
      });
    }

    await executeQuery('DELETE FROM categories WHERE id = $1', [parsedId]);
    return response.json({ success: true, message: 'ลบหมวดหมู่เรียบร้อยแล้ว' });
  } catch (deleteCategoryError) {
    console.error('Error deleting category:', deleteCategoryError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

export default categoriesRouter;
