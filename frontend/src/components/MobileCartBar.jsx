import React from 'react';
import { useCart } from '../context/CartContext';

export default function MobileCartBar({ onOpenCart }) {
  const { totalQuantity, totalPrice } = useCart();

  if (totalQuantity === 0) return null;

  return (
    <div 
      id="mobile-cart-bar"
      className="fixed bottom-4 left-4 right-4 z-50 lg:hidden animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div 
        onClick={onOpenCart}
        className="bg-primary/95 backdrop-blur-xl border border-primary/40 rounded-2xl p-3.5 px-5 shadow-[0_8px_30px_rgba(16,185,129,0.4)] flex justify-between items-center cursor-pointer active:scale-98 transition-transform"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-base shadow-inner">
            {totalQuantity}
          </div>
          <div>
            <p className="text-xs text-white/80 font-medium">ตะกร้าของคุณ ({totalQuantity} ชิ้น)</p>
            <p className="text-lg font-extrabold text-white leading-tight">
              {parseInt(totalPrice, 10)} ฿
            </p>
          </div>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            onOpenCart();
          }}
          className="bg-white text-primary px-4 py-2 rounded-xl font-bold text-sm shadow-md flex items-center gap-1.5 hover:bg-gray-100 transition-colors"
        >
          <span>ดูตะกร้า</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
}
