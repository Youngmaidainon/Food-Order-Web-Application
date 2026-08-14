import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

export default function MenuGrid({ menuItems, isStoreOpen, onAddItem, dressings }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'ทั้งหมด' },
    { id: 1, name: 'สปริงโรล' },
    { id: 2, name: 'สปริงโรลอโวคาโด้' },
  ];

  const filteredItems = menuItems.filter(item => 
    selectedCategory === 'all' || item.category_id == selectedCategory
  );

  return (
    <>
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" id="category-tabs-container">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`glass border py-2 px-5 rounded-full text-sm font-medium cursor-pointer transition-all whitespace-nowrap hover:border-primary hover:text-primary ${selectedCategory === cat.id ? 'bg-primary/20 text-primary border-primary shadow-glow' : 'border-white/10 text-gray-400'}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 mb-[100px] w-full" id="menu-grid-container">
        {filteredItems.length === 0 ? (
          <div className="text-center p-12 text-gray-500 glass-card rounded-3xl border border-dashed border-white/20">ไม่มีรายการสินค้าในหมวดหมู่นี้</div>
        ) : (
          filteredItems.map(item => (
            <div className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col transition-all shadow-lg relative overflow-hidden group hover:-translate-y-2 hover:shadow-glow hover:border-primary/50" key={item.id}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors"></div>
              
              <div className="text-6xl sm:text-7xl text-center mb-5 transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-6 drop-shadow-2xl">{item.image_url || '🌯'}</div>
              <div className="text-lg sm:text-xl leading-tight tracking-tight font-bold mb-2 text-white min-h-[3.5rem] line-clamp-2 relative z-10 break-keep">{item.name}</div>
              <div className="text-sm text-gray-400 flex-grow mb-6 relative z-10">{item.description || 'ชิ้นพอดีกิน อีสฉ่ำ'}</div>
              
              <div className="flex flex-wrap items-center justify-between gap-3 mt-auto relative z-10 border-t border-white/10 pt-4">
                <div>
                  <div className="text-2xl font-bold text-primary whitespace-nowrap">{parseFloat(item.price).toFixed(2)}.-</div>
                </div>
                <button 
                  className="whitespace-nowrap flex-shrink-0 bg-primary text-white py-2.5 px-5 rounded-full text-sm font-semibold cursor-pointer transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:bg-primary-hover hover:scale-105 disabled:bg-surface-hover disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none disabled:border-white/10 border border-transparent" 
                  disabled={!isStoreOpen || item.is_available === false}
                  onClick={() => onAddItem(item)}
                >
                  {!isStoreOpen ? '🔒 ร้านปิด' : (item.is_available === false ? 'หมดชั่วคราว' : '+ เพิ่มใส่ตะกร้า')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
