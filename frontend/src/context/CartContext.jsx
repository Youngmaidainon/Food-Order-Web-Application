import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { sendApiRequest } from '../api/api.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const updateTimeoutRef = useRef({});
  
  const fetchCart = useCallback(async () => {
    try {
      const res = await sendApiRequest('/cart');
      if (res.success) {
        setCartItems(res.data);
      }
    } catch (err) {
      console.error('ไม่สามารถโหลดข้อมูลตะกร้าสินค้าได้:', err);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItemToCart = async (menuItem, dressing = null, notes = '') => {
    try {
      const res = await sendApiRequest('/cart/add', {
        method: 'POST',
        body: JSON.stringify({
          menu_item_id: menuItem.id,
          dressing_id: dressing ? dressing.id : null,
          quantity: 1,
          item_notes: notes
        })
      });
      if (res.success) await fetchCart();
      return res;
    } catch (err) {
      console.error('ไม่สามารถเพิ่มสินค้าได้:', err);
      throw err;
    }
  };

  const updateQuantity = async (cartItemId, newQty) => {
    // Optimistic Update
    setCartItems(prevItems => prevItems.map(item => {
      if (item.cart_item_id === cartItemId) {
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));

    // Debounce API Call
    if (updateTimeoutRef.current[cartItemId]) {
      clearTimeout(updateTimeoutRef.current[cartItemId]);
    }

    updateTimeoutRef.current[cartItemId] = setTimeout(async () => {
      try {
        const res = await sendApiRequest(`/cart/update/${cartItemId}`, {
          method: 'PUT',
          body: JSON.stringify({ quantity: newQty })
        });
        if (!res.success) {
          console.error('ไม่สามารถอัปเดตจำนวนสินค้าได้ กำลังคืนค่าเดิม...');
          await fetchCart();
        }
      } catch (err) {
        console.error('ไม่สามารถอัปเดตจำนวนสินค้าได้:', err);
        await fetchCart();
      }
    }, 500);
  };

  const removeItem = async (cartItemId) => {
    // Optimistic Update
    setCartItems(prevItems => prevItems.filter(item => item.cart_item_id !== cartItemId));

    try {
      const res = await sendApiRequest(`/cart/remove/${cartItemId}`, {
        method: 'DELETE'
      });
      if (!res.success) await fetchCart();
    } catch (err) {
      console.error('ไม่สามารถลบสินค้าได้:', err);
      await fetchCart();
    }
  };
  
  const clearCart = async () => {
    // Optimistic Update
    setCartItems([]);

    try {
      const res = await sendApiRequest('/cart/clear', { method: 'DELETE' });
      if (!res.success) await fetchCart();
    } catch (err) {
      console.error('ไม่สามารถล้างตะกร้าสินค้าได้:', err);
      await fetchCart();
    }
  };

  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cartItems, fetchCart, addItemToCart, updateQuantity, removeItem, clearCart, totalQuantity, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
