import React, { useState, useEffect } from 'react';
import { sendApiRequest } from '../../api/api.js';
import { useAlert } from '../../context/AlertContext';

export default function Dashboard() {
  const { showAlert } = useAlert();
  const [analytics, setAnalytics] = useState(null);
  const [storeStatus, setStoreStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
      setIsLoading(false);
    }
  };



  if (isLoading) return <div>กำลังโหลดข้อมูล...</div>;
  if (error) return <div className="text-red-500 text-center p-8 bg-black/40 rounded-2xl border border-red-500/30 m-8">{error}</div>;
  if (!analytics || !storeStatus) return null;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold m-0 text-white tracking-tight">แดชบอร์ด</h1>
          <p className="text-gray-400 mt-2">สรุปภาพรวมและสถิติยอดขายของร้าน</p>
        </div>
        <div className={`flex flex-wrap items-center gap-4 glass-card py-3 px-6 rounded-2xl border ${storeStatus.is_open ? 'border-primary/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]'}`}>
          <div className="flex items-center gap-3">
            <div className={`relative flex items-center justify-center w-4 h-4`}>
              {storeStatus.is_open && <div className="absolute w-full h-full bg-primary rounded-full animate-ping opacity-75"></div>}
              <div className={`relative w-3 h-3 rounded-full ${storeStatus.is_open ? 'bg-primary' : 'bg-red-500'}`}></div>
            </div>
            <span className={`font-bold text-lg tracking-wide ${storeStatus.is_open ? 'text-primary' : 'text-red-500'}`}>
              {storeStatus.is_open ? 'เปิดรับออเดอร์' : 'ร้านปิดชั่วคราว'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 mb-10">
        <div className="glass-card p-6 lg:p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/20 transition-colors"></div>
          <div className="text-gray-400 font-medium mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
            ยอดขายวันนี้
          </div>
          <div className="text-4xl font-extrabold text-white mb-2">{analytics.today_sales.toFixed(2)} <span className="text-xl text-primary font-bold">฿</span></div>
          <div className="text-sm font-medium text-primary/80 bg-primary/10 inline-block px-3 py-1 rounded-full">{analytics.today_orders} ออเดอร์</div>
        </div>
        <div className="glass-card p-6 lg:p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-secondary/20 transition-colors"></div>
          <div className="text-gray-400 font-medium mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            ยอดขายเดือนนี้
          </div>
          <div className="text-4xl font-extrabold text-white mb-2">{analytics.month_sales.toFixed(2)} <span className="text-xl text-secondary font-bold">฿</span></div>
          <div className="text-sm font-medium text-secondary/80 bg-secondary/10 inline-block px-3 py-1 rounded-full">{analytics.month_orders} ออเดอร์</div>
        </div>
        <div className="glass-card p-6 lg:p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-colors"></div>
          <div className="text-gray-400 font-medium mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
            ยอดขายรวมทั้งหมด
          </div>
          <div className="text-4xl font-extrabold text-white mb-2">{analytics.total_sales.toFixed(2)} <span className="text-xl text-blue-400 font-bold">฿</span></div>
          <div className="text-sm font-medium text-blue-400/80 bg-blue-400/10 inline-block px-3 py-1 rounded-full">{analytics.total_orders} ออเดอร์</div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold m-0 tracking-tight">เมนูขายดี</h2>
        <div className="h-px bg-white/10 flex-grow"></div>
      </div>
      
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-black/40 text-gray-400 text-sm tracking-wider uppercase border-b border-white/10">
              <th className="p-5 font-semibold min-w-[100px] whitespace-nowrap text-center">อันดับ</th>
              <th className="p-5 font-semibold min-w-[200px] whitespace-nowrap text-center">ชื่อเมนู</th>
              <th className="p-5 font-semibold min-w-[150px] whitespace-nowrap text-center">จำนวนที่ขายได้</th>
              <th className="p-5 font-semibold min-w-[150px] whitespace-nowrap text-center">ยอดขายรวม</th>
            </tr>
          </thead>
          <tbody>
            {analytics.top_sellers.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">ยังไม่มีข้อมูลการขาย</td>
              </tr>
            ) : (
              analytics.top_sellers.map((item, idx) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-5 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold shadow-sm ${idx === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : idx === 1 ? 'bg-gray-300/20 text-gray-200 border border-gray-300/30' : idx === 2 ? 'bg-amber-700/30 text-amber-500 border border-amber-700/40' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="p-5 font-bold text-white text-lg text-center whitespace-nowrap">{item.name}</td>
                  <td className="p-5 font-medium text-gray-300 text-center">
                    <span className="bg-white/10 px-3 py-1 rounded-full text-sm">{item.total_qty}</span>
                  </td>
                  <td className="p-5 font-bold text-primary text-center whitespace-nowrap">{item.total_revenue.toFixed(2)} ฿</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
