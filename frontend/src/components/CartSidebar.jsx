import React from 'react';
import { useCart } from '../context/CartContext';

// แถบตะกร้าสินค้าด้านข้างสำหรับเดสก์ท็อป
export default function CartSidebar({ isStoreOpen, onCheckout }) {
  const { cartItems, updateQuantity, removeItem, totalPrice } = useCart();

  return (
    <div className="glass-card rounded-3xl p-6 lg:p-8 flex flex-col h-[calc(100vh-140px)] shadow-xl border-t border-white/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
      
      <div className="text-2xl font-bold mb-6 pb-4 border-b border-white/10 relative z-10">
        <span className="flex items-center gap-3 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          ตะกร้าของคุณ
        </span>
      </div>

      <div className="flex-grow overflow-y-auto pr-3 -mr-3 relative z-10" id="desktop-cart-items-list">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-70">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><circle cx="12" cy="12" r="10"/><path d="m16 16-4-4-4 4"/><path d="M12 8v4"/></svg>
            <p>ตะกร้าสินค้าของคุณยังว่างเปล่า</p>
          </div>
        ) : (
          cartItems.map((item, idx) => (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 transition-all hover:bg-white/10 hover:border-primary/30 group" key={item.cart_item_id || idx}>
              <div className="flex justify-between font-semibold mb-2 text-white">
                <span className="flex items-center gap-2">
                  <span className="text-xl whitespace-nowrap flex-shrink-0 select-none">{item.image_url}</span> 
                  {item.name}
                </span>
                <span className="text-primary">{parseInt(item.price * item.quantity, 10)} ฿</span>
              </div>
              <div className="text-xs text-secondary mb-3 bg-secondary/10 border border-secondary/20 py-1 px-2.5 rounded-full inline-block">น้ำสลัด {item.dressing_name}</div>
              {item.item_notes && (
                <div className="text-xs text-gray-400 mb-3 italic pl-2 border-l-2 border-white/20">หมายเหตุ {item.item_notes}</div>
              )}
              <div className="flex justify-between items-center mt-3">
                <div className="flex items-center gap-3 bg-black/40 p-1.5 rounded-full border border-white/10">
                  <button className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center font-bold cursor-pointer transition-all hover:bg-primary hover:text-white" onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
                  </button>
                  <span className="w-4 text-center font-medium text-sm">{item.quantity}</span>
                  <button 
                    className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center font-bold cursor-pointer transition-all hover:bg-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed" 
                    disabled={!isStoreOpen}
                    onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  </button>
                </div>
                <button className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-full hover:bg-red-400/10" onClick={() => removeItem(item.cart_item_id)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-6 border-t border-white/10 mt-4 relative z-10">
        <div className="flex justify-between text-xl font-bold mb-6 text-white items-center">
          <div>
            <span className="text-base font-bold text-white block">ยอดรวมทั้งสิ้น</span>
            <span className="text-xs text-gray-400 font-normal">
              {cartItems.reduce((acc, i) => acc + i.quantity, 0)} รายการ
            </span>
          </div>
          <span className="text-3xl text-primary text-glow">{parseInt(totalPrice, 10)} ฿</span>
        </div>
        <button 
          className="w-full bg-primary text-white border border-primary/50 py-4 rounded-2xl text-base font-bold cursor-pointer transition-all shadow-[0_8px_25px_rgba(16,185,129,0.4)] hover:bg-primary-hover hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(16,185,129,0.5)] disabled:bg-surface-hover disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none disabled:border-transparent flex items-center justify-center gap-2" 
          disabled={!isStoreOpen || cartItems.length === 0}
          onClick={onCheckout}
        >
          {!isStoreOpen ? (
            <><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> ร้านปิดบริการชั่วคราว</>
          ) : (
            <>ดำเนินการสั่งซื้อ <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></>
          )}
        </button>
      </div>
    </div>
  );
}
