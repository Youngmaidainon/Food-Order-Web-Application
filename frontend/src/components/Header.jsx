import React from 'react';
import { Link } from 'react-router-dom';

// แถบเมนูด้านบนสุดของฝั่งลูกค้า (แสดงโลโก้, สถานะออเดอร์ปัจจุบัน, ปุ่มตะกร้าสำหรับมือถือ/iPad, และปุ่มติดตาม)
export default function Header({ storeStatus, onTrackOrder, activeOrder, activeOrderStatus, totalCartQuantity = 0, onOpenCart }) {
  const isOpen = storeStatus?.is_open ?? true;
  const storeName = storeStatus?.restaurant_name || 'ร้านสปริงโรลออนไลน์';

  return (
    <>
      {/* Single Authoritative Announcement Banner */}
      <div 
        className={`text-center py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium tracking-wide z-[100] relative text-white transition-all ${
          !isOpen 
            ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)] font-semibold' 
            : 'bg-gradient-to-r from-primary to-primary-hover shadow-glow'
        }`} 
        id="announcement-banner"
      >
        {!isOpen ? (
          <span>🔴 ขณะนี้ร้านปิดรับออเดอร์ชั่วคราว (คุณยังสามารถเลือกชมเมนูอาหารได้ตามปกติ)</span>
        ) : (
          <span>ประกาศร้าน: <strong className="font-semibold">{storeStatus?.announcement_message || 'เปิดรับออเดอร์ตามปกติ'}</strong></span>
        )}
      </div>

      {/* Main Navbar */}
      <nav className="flex justify-between items-center py-2.5 px-3 sm:py-3.5 sm:px-6 lg:px-[5%] glass border-b border-white/5 sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 no-underline text-white transition-all hover:scale-102 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-md rounded-full group-hover:bg-primary/40 transition-colors"></div>
            <img src="/logo.svg" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 relative z-10" />
          </div>
          <span className="text-base sm:text-xl lg:text-2xl font-bold tracking-tight text-white">{storeName}</span>
        </Link>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Standard Track Order Button */}
          <button 
            className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 py-1.5 px-3 sm:px-3.5 rounded-full text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 active:scale-95" 
            onClick={onTrackOrder}
            title="ค้นหาและติดตามสถานะออเดอร์"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>ติดตามออเดอร์</span>
          </button>

          {/* Mobile & iPad Cart Button (Visible on screens < lg) */}
          <button 
            className="lg:hidden relative bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 py-1.5 px-2.5 sm:px-3 rounded-full text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
            onClick={onOpenCart}
            title="เปิดตะกร้าสินค้า"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            {totalCartQuantity > 0 && (
              <span className="bg-primary text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-sm">
                {totalCartQuantity}
              </span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}

