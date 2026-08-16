import React from 'react';
import { Link } from 'react-router-dom';

// แถบเมนูด้านบนสุดของฝั่งลูกค้า (แสดงโลโก้และปุ่มติดตามออเดอร์)
export default function Header({ storeStatus, onTrackOrder }) {
  const isOpen = storeStatus?.is_open ?? true;
  const announcement = storeStatus?.announcement_message || (isOpen ? 'เปิดรับออเดอร์ค่า 💖' : 'ร้านปิดบริการชั่วคราว');
  const storeName = storeStatus?.restaurant_name || 'ร้านสปริงโรลออนไลน์';

  return (
    <>
      <div className={`text-center py-2 px-4 text-sm font-medium tracking-wide z-[100] relative text-white ${!isOpen ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-gradient-to-r from-primary to-primary-hover shadow-glow'}`} id="announcement-banner">
        <span className="opacity-80">ประกาศร้าน </span>
        <span className="font-semibold">{!isOpen ? 'ร้านปิดบริการชั่วคราว' : (storeStatus?.announcement_message || 'เปิดรับออเดอร์ค่า 💖')}</span>
      </div>

      <nav className="flex justify-between items-center py-3 px-4 sm:py-4 sm:px-6 lg:px-[5%] glass border-b border-white/5 sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 no-underline text-white transition-all hover:scale-105 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-md rounded-full group-hover:bg-primary/40 transition-colors"></div>
            <img src="/logo.svg" alt="Logo" className="w-9 h-9 sm:w-11 sm:h-11 relative z-10" />
          </div>
          <span className="text-xl sm:text-2xl font-bold tracking-tight">{storeName}</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="bg-primary/10 text-primary border border-primary/30 py-2 px-4 rounded-full text-xs sm:text-sm font-semibold cursor-pointer transition-all hover:bg-primary hover:text-white hover:shadow-glow" onClick={onTrackOrder}>
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ติดตามออเดอร์
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
