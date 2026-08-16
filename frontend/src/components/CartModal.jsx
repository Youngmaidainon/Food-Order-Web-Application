import React from 'react';
import { useCart } from '../context/CartContext';

export default function CartModal({ isOpen, onClose, isStoreOpen, onCheckout }) {
  const { cartItems, updateQuantity, removeItem, totalPrice } = useCart();

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-end md:items-center z-[100] transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div className={`bg-surface w-full max-w-[500px] h-[85vh] flex flex-col rounded-t-2xl md:rounded-3xl p-5 md:p-6 transition-transform duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)] shadow-glass-md ${isOpen ? 'translate-y-0 md:scale-100' : 'translate-y-full md:scale-95'}`}>
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-4 md:mb-6 md:hidden flex-shrink-0"></div>
        
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <span className="text-xl font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            ตะกร้าสินค้า
          </span>
          <button className="bg-surface border border-border w-8 h-8 rounded-full text-xl text-white flex items-center justify-center cursor-pointer transition-all hover:bg-background hover:text-red-500" onClick={onClose}>&times;</button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-70">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><circle cx="12" cy="12" r="10"/><path d="m16 16-4-4-4 4"/><path d="M12 8v4"/></svg>
              <p>ตะกร้าสินค้าของคุณยังว่างเปล่า</p>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 transition-all" key={item.cart_item_id || idx}>
                <div className="flex justify-between font-semibold mb-1 text-white text-sm">
                  <span className="flex items-center gap-2 line-clamp-1">
                    <span>{item.image_url}</span> 
                    {item.name}
                  </span>
                  <span className="text-primary flex-shrink-0">{(item.price * item.quantity).toFixed(2)}.-</span>
                </div>
                <div className="text-xs text-secondary mb-2 bg-secondary/10 border border-secondary/20 py-0.5 px-2 rounded-full inline-block">น้ำสลัด {item.dressing_name}</div>
                {item.item_notes && (
                  <div className="text-xs text-gray-400 mb-2 italic pl-2 border-l-2 border-white/20">หมายเหตุ {item.item_notes}</div>
                )}
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-3 bg-black/40 p-1.5 rounded-full border border-white/10">
                    <button className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center font-bold cursor-pointer transition-all hover:bg-primary active:scale-90" onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
                    </button>
                    <span className="w-4 text-center font-medium text-sm">{item.quantity}</span>
                    <button 
                      className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center font-bold cursor-pointer transition-all hover:bg-primary active:scale-90 disabled:opacity-30" 
                      disabled={!isStoreOpen}
                      onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    </button>
                  </div>
                  <button className="text-red-400 p-2 rounded-full hover:bg-red-400/10 active:scale-90" onClick={() => removeItem(item.cart_item_id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-4 border-t border-white/10 mt-4 flex-shrink-0">
          <div className="flex justify-between text-lg font-bold mb-4 text-white items-end">
            <span className="text-sm font-normal text-gray-400">ยอดรวมทั้งหมด</span>
            <span className="text-2xl text-primary">{totalPrice.toFixed(2)} ฿</span>
          </div>
          <button 
            className="w-full bg-primary text-white border border-primary/50 py-3.5 rounded-xl text-base font-bold cursor-pointer transition-all active:scale-[0.98] disabled:bg-surface-hover disabled:text-gray-500 flex items-center justify-center gap-2" 
            disabled={!isStoreOpen || cartItems.length === 0}
            onClick={() => {
              onClose();
              onCheckout();
            }}
          >
            {!isStoreOpen ? (
              <><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> ร้านปิด</>
            ) : (
              <>ดำเนินการสั่งซื้อ <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
