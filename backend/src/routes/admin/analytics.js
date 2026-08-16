import express from 'express';
import { executeQuery } from '../../config/database.js';
import { authenticateAdminSession } from '../../middleware/auth.js';

const analyticsRouter = express.Router();

// GET /api/admin/analytics - ดึงข้อมูลสถิติและรายงานยอดขาย
analyticsRouter.get('/', authenticateAdminSession, async (request, response) => {
  try {
    const salesMetricsQueryResult = await executeQuery(`
      SELECT 
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE THEN total_amount ELSE 0 END), 0) as today_sales,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN id ELSE NULL END) as today_orders,
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN total_amount ELSE 0 END), 0) as month_sales,
        COUNT(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN id ELSE NULL END) as month_orders,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(id) as total_orders
      FROM orders
      WHERE status IN ('รับอาหารแล้ว', 'จัดส่งแล้ว') AND deleted_at IS NULL
    `);

    const topSellersQueryResult = await executeQuery(`
      SELECT menuItem.name, SUM(orderItem.quantity) as total_qty, SUM(orderItem.quantity * orderItem.unit_price) as total_revenue
      FROM order_items orderItem
      JOIN orders customerOrder ON orderItem.order_id = customerOrder.id
      JOIN menu_items menuItem ON orderItem.menu_item_id = menuItem.id
      WHERE customerOrder.status IN ('รับอาหารแล้ว', 'จัดส่งแล้ว') AND customerOrder.deleted_at IS NULL
      GROUP BY menuItem.id, menuItem.name
      ORDER BY total_qty DESC
    `);

    const metrics = salesMetricsQueryResult.rows[0];

    return response.json({
      success: true,
      data: {
        today_sales: parseFloat(metrics.today_sales),
        today_orders: parseInt(metrics.today_orders, 10),
        month_sales: parseFloat(metrics.month_sales),
        month_orders: parseInt(metrics.month_orders, 10),
        total_sales: parseFloat(metrics.total_sales),
        total_orders: parseInt(metrics.total_orders, 10),
        top_sellers: topSellersQueryResult.rows.map(row => ({
          name: row.name,
          total_qty: parseInt(row.total_qty, 10),
          total_revenue: parseFloat(row.total_revenue)
        }))
      }
    });
  } catch (fetchAnalyticsError) {
    console.error('Error fetching admin analytics:', fetchAnalyticsError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

export default analyticsRouter;
