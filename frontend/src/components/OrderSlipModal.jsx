import React, { useEffect } from 'react';
import { useStoreStatus } from '../hooks/queries.js';

// Printable and digital receipt (E-Receipt) modal
export default function OrderSlipModal({ isOpen, onClose, order, restaurantName: propRestaurantName }) {
  const { data: storeStatus } = useStoreStatus();
  const restaurantName = propRestaurantName || storeStatus?.restaurant_name || 'ร้านสปริงโรลออนไลน์';

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const currentStatus = order.status || 'รอดำเนินการ';
  const isDelivery = order.delivery_type === 'จัดส่ง';

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'รอดำเนินการ':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'รับออเดอร์แล้ว':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'กำลังเตรียมอาหาร':
        return 'bg-orange-50 text-orange-800 border-orange-300';
      case 'พร้อมรับอาหาร':
      case 'กำลังจัดส่ง':
        return 'bg-purple-50 text-purple-800 border-purple-300';
      case 'รับอาหารแล้ว':
      case 'จัดส่งแล้ว':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'ยกเลิก':
        return 'bg-red-50 text-red-800 border-red-300';
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-end sm:items-center z-[1100] p-0 sm:p-4 transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#141418] border border-white/15 w-full max-w-[460px] rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Mobile Drag/Close Handle */}
        <div
          className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-2.5 sm:hidden cursor-pointer"
          onClick={onClose}
        ></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-3 sm:mb-4 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary text-sm shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /></svg>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">สลิปคำสั่งซื้อ (E-Receipt)</h3>
              <p className="text-[10.5px] sm:text-[11px] text-gray-400">ใบเสร็จและรายละเอียดออเดอร์ของคุณ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs"
            title="ปิดหน้าต่าง"
          >
            ✕
          </button>
        </div>

        {/* Premium Paper Receipt Body */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          <div className="bg-[#fefdfb] text-gray-900 rounded-2xl p-4 sm:p-6 shadow-xl border border-amber-900/10 text-xs leading-relaxed relative overflow-hidden select-text">

            {/* Paper Top Decorative Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-primary to-amber-500"></div>

            {/* Receipt Header */}
            <div className="text-center pb-3 sm:pb-4 border-b border-dashed border-gray-300">
              <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">{restaurantName}</h2>
              <p className="text-[10.5px] sm:text-[11px] text-gray-500 font-medium mt-0.5">ใบแจ้งรายละเอียดคำสั่งซื้อ</p>

              {/* Synchronized Status Badge */}
              <div className={`mt-2 inline-flex items-center gap-1.5 text-[11px] px-3 py-0.5 rounded-full border font-bold ${getStatusBadgeStyle(currentStatus)}`}>
                <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                <span>{currentStatus}</span>
              </div>
            </div>

            {/* Queue Number Box */}
            <div className="my-3 p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 text-center">
              <span className="text-[10.5px] sm:text-[11px] text-emerald-800 font-bold uppercase tracking-wider block">ลำดับคิวของคุณ</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-wider">คิว #{order.sequence_number || '-'}</span>
            </div>

            {/* Order Metadata */}
            <div className="space-y-1.5 text-[11px] sm:text-[11.5px] pb-3 border-b border-dashed border-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-500">รหัสออเดอร์:</span>
                <span className="font-mono font-bold text-gray-800">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">วันที่-เวลา:</span>
                <span className="text-gray-700">{new Date(order.created_at || Date.now()).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">รูปแบบการรับ:</span>
                <span className="font-bold text-gray-800">
                  {isDelivery ? 'จัดส่งเดลิเวอรี่' : 'รับเองที่หน้าร้าน'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ชื่อลูกค้า:</span>
                <span className="font-bold text-gray-800">{order.customer_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">เบอร์โทรศัพท์:</span>
                <span className="font-mono text-gray-800">{order.customer_phone || '-'}</span>
              </div>
              {isDelivery && order.address && (
                <div className="pt-1.5 text-[11px] border-t border-gray-200 mt-1">
                  <span className="text-gray-500 font-semibold">ที่อยู่สำหรับจัดส่ง:</span>
                  <p className="text-gray-800 mt-0.5 pl-1 leading-snug">{order.address}</p>
                </div>
              )}
            </div>

            {/* Ordered Items Table */}
            <div className="my-3">
              <div className="flex items-center font-bold text-gray-700 border-b border-gray-300 pb-1.5 text-[10.5px] sm:text-[11px]">
                <span className="flex-1 text-left">รายการ</span>
                <span className="w-10 text-center">จำนวน</span>
                <span className="w-14 text-right">ราคา</span>
              </div>

              <div className="divide-y divide-gray-100">
                {(order.items || []).map((item, index) => (
                  <div key={index} className="py-1.5 sm:py-2 text-[11px] sm:text-[11.5px]">
                    <div className="flex items-start font-semibold text-gray-900">
                      <span className="flex-1 text-left pr-1 leading-snug">
                        {index + 1}. {item.menu_item_name}
                      </span>
                      <span className="w-10 text-center font-bold text-primary">x{item.quantity}</span>
                      <span className="w-14 text-right font-bold whitespace-nowrap">
                        {parseInt(item.unit_price * item.quantity, 10)} ฿
                      </span>
                    </div>

                    {item.dressing_name && item.dressing_name !== 'ไม่รับน้ำสลัด' && (
                      <div className="text-[10px] sm:text-[10.5px] text-gray-600 pl-3 sm:pl-4 mt-0.5 flex items-center gap-1">
                        <span className="text-primary font-bold">•</span>
                        <span>น้ำสลัด: <span className="font-medium text-gray-800">{item.dressing_name}</span></span>
                      </div>
                    )}

                    {item.item_notes && (
                      <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded mt-1 ml-3 sm:ml-4 inline-block font-medium">
                        หมายเหตุ: {item.item_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Price Summary Breakdown */}
            <div className="pt-2.5 border-t-2 border-gray-800 space-y-1 text-[11px] sm:text-[11.5px]">
              <div className="flex justify-between text-gray-600">
                <span>รวมค่าอาหาร:</span>
                <span className="font-semibold">{parseInt(order.total_amount, 10)} ฿</span>
              </div>

              {/* Only display delivery fee row if order is delivery */}
              {isDelivery && (
                <div className="flex justify-between text-gray-600">
                  <span>ค่าจัดส่ง:</span>
                  <span className="text-emerald-600 font-semibold">ฟรี</span>
                </div>
              )}

              <div className="flex justify-between items-center font-black text-gray-900 pt-1.5 border-t border-gray-200">
                <span className="text-xs sm:text-sm">ยอดสุทธิทั้งสิ้น:</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600">{parseInt(order.total_amount, 10)} ฿</span>
              </div>
            </div>

            {/* Slogan Footer */}
            <div className="text-center pt-3 mt-3 border-t border-dashed border-gray-300">
              <p className="text-[11px] sm:text-[11.5px] font-bold text-gray-800">ขอบคุณที่อุดหนุน{restaurantName}ค่ะ</p>
              <p className="text-[10px] text-gray-500 mt-0.5">ทานให้อร่อยนะคะ ยินดีให้บริการค่ะ</p>
            </div>

          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="pt-3 border-t border-white/10 mt-2.5 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            <span>ปิดหน้าต่างสลิป</span>
          </button>
        </div>

      </div>
    </div>
  );
}



