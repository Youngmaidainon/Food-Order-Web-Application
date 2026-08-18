import express from 'express';
import { executeQuery } from '../config/database.js';
import { authenticateAdminSession } from '../shared/middleware/auth.js';

const categoriesRouter = express.Router();

// GET /api/admin/categories - ดึงข้อมูลหมวดหมู่ทั้งหมด
categoriesRouter.get('/', authenticateAdminSession, async (request, response) => {
  try {
    const categoriesQueryResult = await executeQuery('SELECT * FROM categories ORDER BY display_order ASC, id ASC');
    return response.json({ success: true, data: categoriesQueryResult.rows });
  } catch (fetchCategoriesError) {
    console.error('Error fetching admin categories:', fetchCategoriesError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// POST /api/admin/categories - เพิ่มหมวดหมู่ใหม่
categoriesRouter.post('/', authenticateAdminSession, async (request, response) => {
  const { name: categoryName, display_order: displayOrder = 0 } = request.body;
  if (!categoryName) return response.status(400).json({ success: false, message: 'กรุณาระบุชื่อหมวดหมู่' });

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

export default categoriesRouter;
