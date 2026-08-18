import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import MenuGrid from '../components/MenuGrid';
import CartSidebar from '../components/CartSidebar';
import MobileCartBar from '../components/MobileCartBar';
import DressingModal from '../components/DressingModal';
import CheckoutModal from '../components/CheckoutModal';
import TrackingModal from '../components/TrackingModal';
import CartModal from '../components/CartModal';
import { useCart } from '../context/CartContext';
import { useStoreStatus, useMenu } from '../hooks/queries.js';
import { useSSE } from '../hooks/useSSE.js';
import { sendApiRequest, getApiUrl } from '../api/api.js';
import { useToast } from '../context/ToastContext';
import { customerSoundAlert } from '../utils/audio.js';

export default function CustomerApp() {
  const { addItemToCart, cartItems, totalPrice, clearCart, totalQuantity } = useCart();
  const { showToast } = useToast();
  
  const [isDressingModalOpen, setIsDressingModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [selectedDressing, setSelectedDressing] = useState(null);

  // Queries from React Query
  const { data: storeStatusData, isLoading: isStoreLoading } = useStoreStatus();
  const { data: menuData, isLoading: isMenuLoading } = useMenu();

  const storeStatus = storeStatusData || { is_open: true, restaurant_name: 'ร้านสปริงโรลออนไลน์' };
  const menuItems = menuData?.menuItems || [];
  const dressings = menuData?.dressings || [];

  const [activeOrder, setActiveOrder] = useState(() => localStorage.getItem('activeOrder'));
  const [activeOrderStatus, setActiveOrderStatus] = useState(null);

  // Check URL param for ?track=ORD-...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackParam = params.get('track');
    if (trackParam) {
      setActiveOrder(trackParam);
      setIsTrackingModalOpen(true);
    }
  }, []);

  // Poll once on startup if activeOrder exists
  useEffect(() => {
    if (activeOrder && !activeOrderStatus) {
      sendApiRequest(`/orders/track/${activeOrder}`)
        .then(res => {
          if (res.success && res.data) {
            setActiveOrderStatus(res.data.status);
          }
        })
        .catch(err => console.error('Initial track error:', err));
    }
  }, [activeOrder, activeOrderStatus]);

  // Real-time SSE updates for Active Customer Order
  const sseUrl = activeOrder ? getApiUrl(`/orders/events/${activeOrder}`) : null;
  const { data: sseData } = useSSE(sseUrl);

  useEffect(() => {
    if (sseData && sseData.event === 'order_status_updated') {
      const newStatus = sseData.payload?.status;
      if (newStatus) {
        if (activeOrderStatus && newStatus !== activeOrderStatus) {
          customerSoundAlert.playStatusUpdateChime();
          showToast(`ออเดอร์ ${activeOrder} อัปเดตสถานะเป็น "${newStatus}"`, 'info');
        }
        setActiveOrderStatus(newStatus);
        
        if (newStatus === 'เสร็จสิ้น' || newStatus === 'ยกเลิก' || newStatus === 'รับอาหารแล้ว' || newStatus === 'จัดส่งแล้ว') {
          localStorage.removeItem('activeOrder');
          setActiveOrder(null);
          setActiveOrderStatus(null);
        }
      }
    }
  }, [sseData, activeOrder, activeOrderStatus, showToast]);

  // Add Item to Cart Flow
  const handleAddItem = (item) => {
    if (!storeStatus.is_open) {
      showToast('ขออภัย ขณะนี้ร้านปิดรับออเดอร์ชั่วคราว', 'warning');
      return;
    }
    setSelectedMenuItem(item);
    setSelectedDressing(dressings.length > 0 ? dressings[0] : null);
    setIsDressingModalOpen(true);
  };

  const handleConfirmDressing = async () => {
    if (selectedMenuItem) {
      const currentMenu = selectedMenuItem;
      const currentDressing = selectedDressing;
      
      setIsDressingModalOpen(false);
      setSelectedMenuItem(null);
      setSelectedDressing(null);
      
      try {
        await addItemToCart(currentMenu, currentDressing);
        showToast(`เพิ่ม "${currentMenu.name}" ลงตะกร้าแล้ว`, 'success');
      } catch (error) {
        showToast('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error');
      }
    }
  };

  const handleCheckoutSuccess = async (order) => {
    customerSoundAlert.playOrderSuccessChime();
    showToast(`สั่งซื้อสำเร็จ! คิว #${order.sequence_number || ''} (${order.order_number})`, 'success');
    await clearCart();
    
    localStorage.setItem('activeOrder', order.order_number);
    setActiveOrder(order.order_number);
    setActiveOrderStatus(order.status || 'รอดำเนินการ');
    setIsTrackingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-bg-color text-text-main flex flex-col">
      <Header 
        storeStatus={storeStatus} 
        onTrackOrder={() => setIsTrackingModalOpen(true)} 
        activeOrder={activeOrder}
        activeOrderStatus={activeOrderStatus}
        totalCartQuantity={totalQuantity}
        onOpenCart={() => setIsCartModalOpen(true)}
      />

      <main className="flex-1 pb-24 sm:pb-28">
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 p-3 sm:px-6 lg:py-8 lg:px-[5%] max-w-[1400px] mx-auto items-start">
          <div className="flex-1 min-w-0 w-full">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent border border-white/10 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-7 text-center mb-4 sm:mb-6 shadow-md relative overflow-hidden backdrop-blur-md">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-teal-500/10 opacity-30 pointer-events-none"></div>
              <div className="relative z-10 flex flex-col items-center">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
                  {storeStatus.restaurant_name || 'ร้านสปริงโรลออนไลน์'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-300 font-light max-w-md mx-auto mt-1 leading-relaxed">
                  ผักสดกรอบ อร่อยเต็มคำ — ทำสดใหม่ทุกออเดอร์
                </p>
              </div>
            </div>
            
            {/* Menu Grid */}
            <MenuGrid 
              menuItems={menuItems} 
              isStoreOpen={storeStatus.is_open} 
              onAddItem={handleAddItem} 
              dressings={dressings}
            />
          </div>
          
          {/* Desktop Cart Sidebar */}
          <div className="hidden lg:block w-full lg:w-[380px] sticky top-[100px]">
            <CartSidebar 
              isStoreOpen={storeStatus.is_open} 
              onCheckout={() => setIsCheckoutModalOpen(true)} 
            />
          </div>
        </div>
      </main>

      {/* Mobile Cart Bar */}
      <MobileCartBar 
        onOpenCart={() => setIsCartModalOpen(true)} 
      />

      {/* Modern Responsive Footer */}
      <footer className="border-t border-white/10 bg-black/40 py-6 sm:py-8 px-4 sm:px-6 text-center text-xs text-gray-400">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="w-5 h-5 opacity-80" />
            <span className="font-bold text-gray-300">{storeStatus.restaurant_name || 'ร้านสปริงโรลออนไลน์'}</span>
          </div>
          <p className="text-[11px] text-gray-500">สด สะอาด วัตถุดิบคุณภาพพรีเมียม ส่งตรงถึงมือคุณ</p>
          <div className="text-[10.5px] text-gray-500">
            ระบบสั่งอาหารออนไลน์ • ทำสดใหม่ทุกกล่อง
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CartModal 
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        isStoreOpen={storeStatus.is_open}
        onCheckout={() => {
          setIsCartModalOpen(false);
          setIsCheckoutModalOpen(true);
        }}
      />

      <DressingModal 
        isOpen={isDressingModalOpen} 
        onClose={() => setIsDressingModalOpen(false)}
        dressings={dressings}
        selectedDressing={selectedDressing}
        setSelectedDressing={setSelectedDressing}
        onConfirm={handleConfirmDressing}
      />

      <CheckoutModal 
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        cartItems={cartItems}
        totalPrice={totalPrice}
        onCheckoutSuccess={handleCheckoutSuccess}
      />

      <TrackingModal 
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        initialOrderNum={activeOrder}
      />
    </div>
  );
}

