import React from 'react';
import { useCart } from '../context/CartContext';

export default function CartModal({ isOpen, onClose, isStoreOpen, onCheckout }) {
  const { cartItems, updateQuantity, removeItem, totalPrice } = useCart();

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-end sm:items-center z-[1000] p-0 sm:p-4 transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div className={`bg-[#131317] border border-white/10 w-full max-w-[480px] h-[85vh] max-h-[640px] flex flex-col rounded-t-2xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300 shadow-2xl ${isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-full sm:scale-95'}`}>
        
        {/* Drag Handle for Mobile */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-2.5 sm:hidden flex-shrink-0 cursor-pointer" onClick={onClose}></div>

        {/* Header */}
        <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary text-sm shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">ตะกร้าสินค้าของคุณ</h3>
              <p className="text-[10px] sm:text-xs text-gray-400">{cartItems.length} รายการที่เลือก</p>
            </div>
          </div>
          <button 
            className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center text-xs cursor-pointer transition-colors" 
            onClick={onClose}
            title="ปิดหน้าต่าง"
          >
            ✕
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto pr-0.5 space-y-2 custom-scrollbar text-xs">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary/70 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              </div>
              <p className="text-xs font-semibold text-gray-300 mb-0.5">ยังไม่มีสินค้าในตะกร้า</p>
              <p className="text-[10px] text-gray-500">เลือกเมนูสปริงโรลแสนอร่อยได้จากหน้าหลักเลยค่ะ</p>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div 
                key={item.cart_item_id || idx} 
                className="bg-white/5 border border-white/10 rounded-xl p-3 transition-all hover:border-white/20"
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex-1 pr-2">
                    <h4 className="font-bold text-white text-xs sm:text-sm">
                      {item.name}
                    </h4>
                    
                    {/* Dressing Badge */}
                    {item.dressing_name && item.dressing_name !== 'ไม่รับน้ำสลัด' && (
                      <div className="mt-1 inline-flex items-center gap-1 text-[10.5px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md font-medium">
                        <span>น้ำสลัด:</span>
                        <span>{item.dressing_name}</span>
                      </div>
                    )}

                    {/* Special Instructions */}
                    {item.item_notes && (
                      <div className="mt-1 text-[10.5px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md inline-block">
                        หมายเหตุ: {item.item_notes}
                      </div>
                    )}
                  </div>

                  <span className="font-bold text-primary text-sm whitespace-nowrap">
                    {parseInt(item.price * item.quantity, 10)} ฿
                  </span>
                </div>

                {/* Quantity & Delete Controls */}
                <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-white/5">
                  <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded-lg border border-white/10">
                    <button 
                      className="w-5 h-5 rounded-md bg-white/10 text-white flex items-center justify-center font-bold hover:bg-white/20 active:scale-90 transition-all text-xs cursor-pointer"
                      onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span className="w-4 text-center font-bold text-xs text-white">{item.quantity}</span>
                    <button 
                      className="w-5 h-5 rounded-md bg-white/10 text-white flex items-center justify-center font-bold hover:bg-white/20 active:scale-90 transition-all text-xs cursor-pointer disabled:opacity-30"
                      disabled={!isStoreOpen}
                      onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  <button 
                    className="text-[11px] text-red-400 hover:text-red-300 p-1 rounded-md hover:bg-red-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                    onClick={() => removeItem(item.cart_item_id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    <span>ลบ</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout Summary */}
        <div className="pt-3 border-t border-white/10 mt-2.5 flex-shrink-0">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-xs font-semibold text-gray-300">ยอดรวมทั้งสิ้น</p>
              <p className="text-[10px] text-gray-400">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} รายการ
              </p>
              {!isStoreOpen && (
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  <span>ร้านปิดชั่วคราว</span>
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-xl sm:text-2xl font-black text-primary leading-tight font-mono">{parseInt(totalPrice, 10)} ฿</p>
            </div>
          </div>

          <button 
            disabled={!isStoreOpen || cartItems.length === 0}
            onClick={() => {
              onClose();
              onCheckout();
            }}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-primary text-white hover:bg-primary-hover active:scale-98 transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {!isStoreOpen ? (
              'ร้านปิดให้บริการชั่วคราว'
            ) : cartItems.length === 0 ? (
              'กรุณาเลือกสินค้าลงตะกร้า'
            ) : (
              <>
                <span>ดำเนินการสั่งซื้อ</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
