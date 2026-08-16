import React from 'react';
import { useCart } from '../context/CartContext';

// แถบสรุปตะกร้าสินค้าแบบย่อสำหรับแสดงผลบนหน้าจอมือถือ
export default function MobileCartBar({ onOpenCart }) {
  const { totalQuantity, totalPrice } = useCart();

  if (totalQuantity === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-surface/85 backdrop-blur-md border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex justify-between items-center lg:hidden" id="mobile-cart-bar">
      <div className="flex flex-col">
        <span className="text-sm text-text-muted">{totalQuantity} รายการ</span>
        <span className="text-xl font-extrabold text-primary">{totalPrice.toFixed(2)} บาท</span>
      </div>
      <button className="bg-primary text-white border-none py-1.5 px-4 rounded-full font-bold text-sm shadow-[0_4px_12px_rgba(249,115,22,0.3)]" onClick={onOpenCart}>
        <span>ดูตะกร้าสินค้า</span>
      </button>
    </div>
  );
}
