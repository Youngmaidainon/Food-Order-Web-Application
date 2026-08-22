import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

// Component แสดงรายการเมนูอาหารทั้งหมด พร้อมระบบคัดกรองตามหมวดหมู่ (Category Filter)
export default function MenuGrid({ menuItems, isStoreOpen, onAddItem, dressings }) {
  const { cartItems } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const dynamicCategories = React.useMemo(() => {
    const map = new Map();
    menuItems.forEach(item => {
      if (item.category_id && item.category_name) {
        map.set(item.category_id, item.category_name);
      }
    });
    const extracted = Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    if (extracted.length === 0) {
      return [
        { id: 'all', name: 'ทั้งหมด' },
        { id: 1, name: 'สปริงโรล' },
        { id: 2, name: 'สปริงโรลอโวคาโด้' }
      ];
    }
    return [{ id: 'all', name: 'ทั้งหมด' }, ...extracted];
  }, [menuItems]);

  const categories = dynamicCategories;

  const filteredItems = menuItems.filter(item => 
    selectedCategory === 'all' || item.category_id == selectedCategory
  );

  return (
    <>
      {/* Category Pills Filter */}
      <div className="flex gap-2 sm:gap-2.5 mb-5 sm:mb-6 overflow-x-auto pb-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" id="category-tabs-container">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`border py-1.5 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-medium cursor-pointer transition-all whitespace-nowrap ${
              selectedCategory === cat.id 
                ? 'bg-primary text-white border-primary shadow-sm font-semibold' 
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Cards Grid: 2 cols on mobile, 2-3 on iPad, 3 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 lg:gap-6 mb-12 sm:mb-16 w-full" id="menu-grid-container">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center p-8 text-gray-400 bg-white/5 rounded-2xl border border-dashed border-white/10 text-xs sm:text-sm">
            ไม่มีรายการสินค้าในหมวดหมู่นี้
          </div>
        ) : (
          filteredItems.map(item => {
            const inCartQty = cartItems
              .filter(ci => ci.menu_item_id === item.id)
              .reduce((sum, ci) => sum + ci.quantity, 0);

            return (
              <div 
                key={item.id}
                className={`bg-white/5 border rounded-2xl p-3 sm:p-5 flex flex-col justify-between transition-all shadow-md relative overflow-hidden group hover:border-primary/40 hover:bg-white/[0.08] ${
                  inCartQty > 0 ? 'border-primary/30 ring-1 ring-primary/20' : 'border-white/10'
                }`} 
              >
                {/* In-Cart Active Badge */}
                {inCartQty > 0 && (
                  <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 bg-primary text-black font-black text-[9.5px] sm:text-[10.5px] px-1.5 py-0.5 rounded-md shadow-sm z-10">
                    ในตะกร้า {inCartQty}
                  </div>
                )}

                <div>
                  {/* Food Image / Icon */}
                  <div className="text-4xl sm:text-5xl lg:text-6xl text-center py-2 sm:py-4 transition-transform duration-300 group-hover:scale-105 select-none drop-shadow-md whitespace-nowrap">
                    {item.image_url || '🌯'}
                  </div>

                  {/* Title */}
                  <h3 className="text-xs sm:text-base font-bold text-white leading-snug line-clamp-2 mt-1 sm:mt-2">
                    {item.name}
                  </h3>

                  {/* Description (Only if present and not generic fallback) */}
                  {item.description && (
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
                
                {/* Footer: Price & Add Button */}
                <div className="flex items-center justify-between gap-1.5 sm:gap-2 mt-3 pt-2 sm:pt-3 border-t border-white/10">
                  <span className="text-sm sm:text-lg font-black text-primary font-mono whitespace-nowrap">
                    {parseInt(item.price, 10)} ฿
                  </span>
                  
                  <button 
                    className="bg-primary text-white py-1 sm:py-1.5 px-2.5 sm:px-3.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold cursor-pointer transition-all hover:bg-primary-hover active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-sm flex items-center justify-center gap-1" 
                    disabled={!isStoreOpen || item.is_available === false}
                    onClick={() => onAddItem(item)}
                  >
                    {!isStoreOpen ? 'ร้านปิด' : (item.is_available === false ? 'หมด' : (inCartQty > 0 ? `+ เพิ่ม (${inCartQty})` : '+ เพิ่ม'))}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}


