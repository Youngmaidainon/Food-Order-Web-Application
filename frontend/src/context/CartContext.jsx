import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { sendApiRequest } from '../api/api.js';

const CartContext = createContext(null);

// Global Cart state provider
export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const updateTimeoutRef = useRef({});
  
  // Fetch cart items from server
  const fetchCart = useCallback(async () => {
    try {
      const res = await sendApiRequest('/cart');
      if (res.success) {
        setCartItems(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add item to cart
  const addItemToCart = async (menuItem, dressing = null, notes = '') => {
    try {
      const res = await sendApiRequest('/cart/add', {
        method: 'POST',
        body: JSON.stringify({
          menu_item_id: menuItem.id,
          dressing_id: dressing && dressing.id !== 0 ? dressing.id : null,
          quantity: 1,
          item_notes: notes
        })
      });
      if (res.success) await fetchCart();
      return res;
    } catch (err) {
      console.error('Failed to add item to cart:', err);
      throw err;
    }
  };

  // Update quantity (Optimistic UI + Debounced API call)
  const updateQuantity = async (cartItemId, newQty) => {
    if (newQty <= 0) {
      return removeItem(cartItemId);
    }
    // Optimistic update
    setCartItems(prevItems => prevItems.map(item => {
      if (item.cart_item_id === cartItemId) {
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));

    // Debounce API call
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
          console.error('Failed to update quantity, reverting...');
          await fetchCart();
        }
      } catch (err) {
        console.error('Failed to update quantity:', err);
        await fetchCart();
      }
    }, 500);
  };

  // Remove item from cart
  const removeItem = async (cartItemId) => {
    // Optimistic update
    setCartItems(prevItems => prevItems.filter(item => item.cart_item_id !== cartItemId));

    try {
      const res = await sendApiRequest(`/cart/remove/${cartItemId}`, {
        method: 'DELETE'
      });
      if (!res.success) await fetchCart();
    } catch (err) {
      console.error('Failed to remove item:', err);
      await fetchCart();
    }
  };
  
  // Clear cart
  const clearCart = async () => {
    // Optimistic update
    setCartItems([]);

    try {
      const res = await sendApiRequest('/cart/clear', { method: 'DELETE' });
      if (!res.success) await fetchCart();
    } catch (err) {
      console.error('Failed to clear cart:', err);
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
