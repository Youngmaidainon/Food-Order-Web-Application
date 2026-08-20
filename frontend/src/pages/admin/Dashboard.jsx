import React, { useState, useEffect } from 'react';
import { sendApiRequest } from '../../api/api.js';

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [storeStatus, setStoreStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Smart Polling (15s) with Tab Visibility Optimization & Window Focus Revalidation
  useEffect(() => {
    fetchData();

    const pollTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData(false);
      }
    }, 15000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const [analyticsRes, statusRes] = await Promise.all([
        sendApiRequest('/admin/analytics'),
        sendApiRequest('/store/status')
      ]);
      if (analyticsRes.success) setAnalytics(analyticsRes.data);
      if (statusRes.success) setStoreStatus(statusRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      setError(err.message || 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-3xl p-16 flex flex-col items-center justify-center text-gray-400">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium">กำลังโหลดข้อมูลแดชบอร์ด...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-center p-8 bg-red-500/10 rounded-3xl border border-red-500/30">
        {error}
      </div>
    );
  }

  if (!analytics || !storeStatus) return null;

  const activeBatch = analytics.active_batch || {
    sales: 0,
    completed_orders: 0,
    canceled_orders: 0,
    total_orders: 0,
    cancel_rate: 0
  };

  const topSellersMaxRevenue = analytics.top_sellers.length > 0
    ? Math.max(...analytics.top_sellers.map(i => i.total_revenue))
    : 1;

  return (
    <div className="space-y-8">
      {/* Header & Status Indicator */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-surface/60 backdrop-blur-md p-6 rounded-3xl border border-white/10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">แดชบอร์ด & สรุปยอดขาย</h1>
          <p className="text-gray-400 mt-1 text-sm">
            ภาพรวมผลประกอบการรอบปัจจุบัน และประวัติยอดขายร้านสปริงโรล
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Discord Sales Archive Link */}
          <a
            href="https://discord.com/channels/@me"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/40 text-[#8ea1e1] hover:text-white font-bold text-xs sm:text-sm transition-all shadow-sm"
          >
            <span>📊</span>
            <span>ดูรายงานย้อนหลังใน Discord</span>
          </a>

          {/* Store Open / Closed Status Pill */}
          <div className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border ${storeStatus.is_open
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${storeStatus.is_open ? 'bg-primary animate-pulse' : 'bg-red-500'}`}></span>
            <span className="font-bold text-xs sm:text-sm">
              {storeStatus.is_open ? '🟢 เปิดรับออเดอร์' : '🔴 ร้านปิดชั่วคราว'}
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Active Batch Metrics (รอบปัจจุบัน) */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>⚡</span>
            <span>สถิติรอบปัจจุบัน (Active Queue Batch)</span>
          </h2>
          <div className="h-px bg-white/10 flex-grow"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Sales */}
          <div className="glass-card p-5 rounded-3xl border border-primary/20 bg-primary/5 relative overflow-hidden">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">ยอดขายในวันนี้ (สำเร็จ)</div>
            <div className="text-3xl font-black text-white mb-1">
              {parseInt(activeBatch.sales, 10)} <span className="text-base text-primary font-bold">฿</span>
            </div>
            <div className="text-xs text-primary font-medium">จากบิลสำเร็จ {activeBatch.completed_orders} บิล</div>
          </div>

          {/* Active Completed Orders */}
          <div className="glass-card p-5 rounded-3xl border border-white/5 relative overflow-hidden">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">ออเดอร์ทั้งหมดในวันนี้</div>
            <div className="text-3xl font-black text-white mb-1">
              {activeBatch.total_orders} <span className="text-base text-gray-400 font-normal">บิล</span>
            </div>
            <div className="text-xs text-gray-400">เสร็จสิ้นแล้ว {activeBatch.completed_orders} บิล</div>
          </div>

          {/* Canceled Orders */}
          <div className="glass-card p-5 rounded-3xl border border-white/5 relative overflow-hidden">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">จำนวนการยกเลิกออเดอร์ในวันนี้</div>
            <div className="text-3xl font-black text-red-400 mb-1">
              {activeBatch.canceled_orders} <span className="text-base text-red-400/70 font-normal">บิล</span>
            </div>
            <div className="text-xs text-gray-400">ทั้งจากลูกค้าและร้านค้า</div>
          </div>

          {/* Cancel Rate */}
          <div className="glass-card p-5 rounded-3xl border border-white/5 relative overflow-hidden">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">อัตราการยกเลิก (Cancel Rate)</div>
            <div className={`text-3xl font-black mb-1 ${activeBatch.cancel_rate > 10 ? 'text-red-400' : 'text-emerald-400'}`}>
              {activeBatch.cancel_rate}%
            </div>
            <div className="text-xs text-gray-400">
              {activeBatch.cancel_rate > 10 ? '⚠️ ควรตรวจสอบสาเหตุ' : '✅ อยู่ในเกณฑ์ปกติ'}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Historical Overview Cards */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>📅</span>
            <span>ภาพรวมยอดขายตามช่วงเวลา</span>
          </h2>
          <div className="h-px bg-white/10 flex-grow"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Today */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 hover:-translate-y-1 transition-transform relative overflow-hidden">
            <div className="text-gray-400 font-medium text-xs sm:text-sm mb-2 flex items-center gap-2">
              <span className="text-base">☀️</span>
              <span>ยอดขายวันนี้</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
              {parseInt(analytics.today_sales, 10)} <span className="text-lg text-primary font-bold">฿</span>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full inline-block">
              {analytics.today_orders} ออเดอร์
            </span>
          </div>

          {/* Month */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 hover:-translate-y-1 transition-transform relative overflow-hidden">
            <div className="text-gray-400 font-medium text-xs sm:text-sm mb-2 flex items-center gap-2">
              <span className="text-base">📆</span>
              <span>ยอดขายเดือนนี้</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
              {parseInt(analytics.month_sales, 10)} <span className="text-lg text-secondary font-bold">฿</span>
            </div>
            <span className="text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full inline-block">
              {analytics.month_orders} ออเดอร์
            </span>
          </div>

          {/* Total */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 hover:-translate-y-1 transition-transform relative overflow-hidden">
            <div className="text-gray-400 font-medium text-xs sm:text-sm mb-2 flex items-center gap-2">
              <span className="text-base">🏆</span>
              <span>ยอดขายรวมทั้งหมด</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
              {parseInt(analytics.total_sales, 10)} <span className="text-lg text-blue-400 font-bold">฿</span>
            </div>
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full inline-block">
              {analytics.total_orders} ออเดอร์
            </span>
          </div>
        </div>
      </div>

      {/* Section 3: Top 5 Best Sellers */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>🔥</span>
            <span>5 อันดับเมนูขายดีประจำร้าน (Top 5 Best Sellers)</span>
          </h2>
          <div className="h-px bg-white/10 flex-grow"></div>
        </div>

        <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-lg">
          {analytics.top_sellers.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              ยังไม่มีข้อมูลการขายในระบบ
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {analytics.top_sellers.map((item, idx) => {
                const percent = Math.min(100, Math.round((item.total_revenue / topSellersMaxRevenue) * 100));

                return (
                  <div key={idx} className="p-4 sm:p-5 hover:bg-white/5 transition-colors flex items-center gap-4">
                    {/* Rank Badge */}
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </div>

                    {/* Item Info & Progress Bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-bold text-white text-sm sm:text-base truncate pr-2">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs bg-white/10 text-gray-300 px-2.5 py-0.5 rounded-full font-semibold">
                            {item.total_qty} ชิ้น
                          </span>
                          <span className="font-extrabold text-primary text-sm sm:text-base">
                            {parseInt(item.total_revenue, 10)} ฿
                          </span>
                        </div>
                      </div>

                      {/* Visual Revenue Share Bar */}
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
