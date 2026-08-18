import express from 'express';
import { executeQuery } from '../config/database.js';
import { authenticateAdminSession } from '../shared/middleware/auth.js';

const analyticsRouter = express.Router();

// GET /api/admin/analytics - ดึงข้อมูลสถิติและรายงานยอดขายสำหรับรอบปัจจุบันและภาพรวม
analyticsRouter.get('/', authenticateAdminSession, async (request, response) => {
  try {
    // 1. สถิติภาพรวมและรอบปัจจุบัน (Active Queue Batch)
    const salesMetricsQueryResult = await executeQuery(`
      SELECT 
        -- ยอดขายรอบปัจจุบัน (Active Batch)
        COALESCE(SUM(CASE WHEN status IN ('รับอาหารแล้ว', 'จัดส่งแล้ว') THEN total_amount ELSE 0 END), 0) as active_sales,
        COUNT(CASE WHEN status IN ('รับอาหารแล้ว', 'จัดส่งแล้ว') THEN id ELSE NULL END) as active_completed_orders,
        COUNT(CASE WHEN status = 'ยกเลิก' THEN id ELSE NULL END) as active_canceled_orders,
        COUNT(id) as active_total_orders,

        -- ยอดขายวันนี้ (Today)
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE AND status IN ('รับอาหารแล้ว', 'จัดส่งแล้ว') THEN total_amount ELSE 0 END), 0) as today_sales,
        COUNT(CASE WHEN created_at >= CURRENT_DATE AND status IN ('รับอาหารแล้ว', 'จัดส่งแล้ว') THEN id ELSE NULL END) as today_orders,

        -- ยอดขายเดือนนี้ (This Month)
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) AND status IN ('รับอาหารแล้ว', 'จัดส่งแล้ว') THEN total_amount ELSE 0 END), 0) as month_sales,
        COUNT(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) AND status IN ('รับอาหารแล้ว', 'จัดส่งแล้ว') THEN id ELSE NULL END) as month_orders,

        -- ยอดขายรวมทั้งหมด (Total)
        COALESCE(SUM(CASE WHEN status IN ('รับอาหารแล้ว', 'จัดส่งแล้ว') THEN total_amount ELSE 0 END), 0) as total_sales,
        COUNT(CASE WHEN status IN ('รับอาหารแล้ว', 'จัดส่งแล้ว') THEN id ELSE NULL END) as total_orders
      FROM orders
      WHERE deleted_at IS NULL
    `);

    // 2. เมนูขายดี Top 5
    const topSellersQueryResult = await executeQuery(`
      SELECT 
        menuItem.name, 
        SUM(orderItem.quantity) as total_qty, 
        SUM(orderItem.quantity * orderItem.unit_price) as total_revenue
      FROM order_items orderItem
      JOIN orders customerOrder ON orderItem.order_id = customerOrder.id
      JOIN menu_items menuItem ON orderItem.menu_item_id = menuItem.id
      WHERE customerOrder.status IN ('รับอาหารแล้ว', 'จัดส่งแล้ว') AND customerOrder.deleted_at IS NULL
      GROUP BY menuItem.id, menuItem.name
      ORDER BY total_qty DESC
      LIMIT 5
    `);

    const metrics = salesMetricsQueryResult.rows[0] || {};
    const totalBatchOrders = parseInt(metrics.active_total_orders, 10) || 0;
    const canceledBatchOrders = parseInt(metrics.active_canceled_orders, 10) || 0;
    const cancelRate = totalBatchOrders > 0 
      ? ((canceledBatchOrders / totalBatchOrders) * 100).toFixed(1) 
      : '0.0';

    return response.json({
      success: true,
      data: {
        active_batch: {
          sales: parseInt(metrics.active_sales, 10) || 0,
          completed_orders: parseInt(metrics.active_completed_orders, 10) || 0,
          canceled_orders: canceledBatchOrders,
          total_orders: totalBatchOrders,
          cancel_rate: parseFloat(cancelRate)
        },
        today_sales: parseInt(metrics.today_sales, 10) || 0,
        today_orders: parseInt(metrics.today_orders, 10) || 0,
        month_sales: parseInt(metrics.month_sales, 10) || 0,
        month_orders: parseInt(metrics.month_orders, 10) || 0,
        total_sales: parseInt(metrics.total_sales, 10) || 0,
        total_orders: parseInt(metrics.total_orders, 10) || 0,
        top_sellers: topSellersQueryResult.rows.map(row => ({
          name: row.name,
          total_qty: parseInt(row.total_qty, 10) || 0,
          total_revenue: parseInt(row.total_revenue, 10) || 0
        }))
      }
    });
  } catch (fetchAnalyticsError) {
    console.error('Error fetching admin analytics:', fetchAnalyticsError);
    return response.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

export default analyticsRouter;
