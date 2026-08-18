import express from 'express';
import { executeQuery } from '../config/database.js';
import { authenticateAdminSession } from '../shared/middleware/auth.js';

const dressingsRouter = express.Router();

// GET /api/admin/dressings - ดึงข้อมูลน้ำสลัดทั้งหมด
dressingsRouter.get('/', authenticateAdminSession, async (request, response) => {
  try {
    const dressingsQueryResult = await executeQuery('SELECT * FROM dressings ORDER BY id ASC');
    return response.json({ success: true, data: dressingsQueryResult.rows });
  } catch (fetchDressingsError) {
    console.error('Error fetching admin dressings:', fetchDressingsError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// POST /api/admin/dressings - เพิ่มน้ำสลัดใหม่
dressingsRouter.post('/', authenticateAdminSession, async (request, response) => {
  const { name: dressingName, is_available: isAvailable = true } = request.body;
  if (!dressingName) return response.status(400).json({ success: false, message: 'กรุณาระบุชื่อน้ำสลัด' });

  try {
    const insertDressingResult = await executeQuery(
      'INSERT INTO dressings (name, is_available) VALUES ($1, $2) RETURNING *',
      [dressingName.trim(), isAvailable]
    );
    const createdDressing = insertDressingResult.rows[0];

    return response.status(201).json({ success: true, message: 'เพิ่มน้ำสลัดเรียบร้อยแล้ว', data: createdDressing });
  } catch (addDressingError) {
    console.error('Error adding dressing:', addDressingError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// PUT /api/admin/dressings/:id - แก้ไขข้อมูลน้ำสลัด
dressingsRouter.put('/:id', authenticateAdminSession, async (request, response) => {
  const { id: dressingId } = request.params;
  const { name: dressingName, is_available: isAvailable } = request.body;

  try {
    const existingDressingResult = await executeQuery('SELECT name FROM dressings WHERE id = $1', [dressingId]);
    if (existingDressingResult.rows.length === 0) {
      return response.status(404).json({ success: false, message: 'ไม่พบน้ำสลัดที่ต้องการแก้ไข' });
    }

    const updateDressingResult = await executeQuery(
      `UPDATE dressings 
       SET 
         name = COALESCE($1, name),
         is_available = COALESCE($2, is_available)
       WHERE id = $3 RETURNING *`,
      [dressingName, isAvailable, dressingId]
    );

    const updatedDressing = updateDressingResult.rows[0];

    return response.json({ success: true, message: 'แก้ไขน้ำสลัดเรียบร้อยแล้ว', data: updatedDressing });
  } catch (updateDressingError) {
    console.error('Error updating dressing:', updateDressingError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// DELETE /api/admin/dressings/:id - ลบข้อมูลน้ำสลัด
dressingsRouter.delete('/:id', authenticateAdminSession, async (request, response) => {
  const { id: dressingId } = request.params;
  if (parseInt(dressingId, 10) === 0) return response.status(400).json({ success: false, message: 'ไม่สามารถลบค่าพื้นฐานได้' });
  
  try {
    const existingDressingResult = await executeQuery('SELECT id FROM dressings WHERE id = $1', [dressingId]);
    if (existingDressingResult.rows.length === 0) {
      return response.status(404).json({ success: false, message: 'ไม่พบน้ำสลัดที่ต้องการลบ' });
    }

    const existingOrderItems = await executeQuery('SELECT id FROM order_items WHERE dressing_id = $1 LIMIT 1', [dressingId]);
    if (existingOrderItems.rows.length > 0) {
      return response.status(400).json({ success: false, message: 'ไม่สามารถลบได้ เนื่องจากน้ำสลัดนี้ถูกสั่งในออเดอร์แล้ว กรุณาปิดการใช้งานแทนการลบ เพื่อรักษาประวัติการสั่งซื้อ' });
    }

    await executeQuery('DELETE FROM dressings WHERE id = $1', [dressingId]);
    return response.json({ success: true, message: 'ลบน้ำสลัดเรียบร้อยแล้ว' });
  } catch (deleteDressingError) {
    console.error('Error deleting dressing:', deleteDressingError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

export default dressingsRouter;
