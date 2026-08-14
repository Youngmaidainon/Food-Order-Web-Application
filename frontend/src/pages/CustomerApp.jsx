import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import MenuGrid from '../components/MenuGrid';
import CartSidebar from '../components/CartSidebar';
import MobileCartBar from '../components/MobileCartBar';
import DressingModal from '../components/DressingModal';
import CheckoutModal from '../components/CheckoutModal';
import TrackingModal from '../components/TrackingModal';
import { useCart } from '../context/CartContext';
import { sendApiRequest } from '../api/api.js';

import { useAlert } from '../context/AlertContext';
import { useToast } from '../context/ToastContext';

export default function CustomerApp() {
  const { addItemToCart, cartItems, totalPrice, clearCart } = useCart();
  const { showToast } = useToast();
  
  const [storeStatus, setStoreStatus] = useState({ is_open: true });
  const [menuItems, setMenuItems] = useState([]);
  const [dressings, setDressings] = useState([]);

  const [isDressingModalOpen, setIsDressingModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [selectedDressing, setSelectedDressing] = useState(null);

  const [activeOrder, setActiveOrder] = useState(localStorage.getItem('activeOrder'));
  const [activeOrderStatus, setActiveOrderStatus] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statusRes, menuRes, dressingsRes] = await Promise.all([
          sendApiRequest('/store/status'),
          sendApiRequest('/menu'),
          sendApiRequest('/dressings')
        ]);
        if (statusRes.success) setStoreStatus(statusRes.data);
        if (menuRes.success) setMenuItems(menuRes.data);
        if (dressingsRes.success) {
          let opts = dressingsRes.data;
          if (!opts.some(d => d.id === 0)) {
            opts = [{ id: 0, name: 'ไม่รับน้ำสลัด', is_available: true }, ...opts];
          }
          setDressings(opts);
        }
      } catch (err) {
        console.error('ไม่สามารถโหลดข้อมูลเริ่มต้นได้:', err);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    let intervalId;
    
    const pollOrderStatus = async () => {
      if (!activeOrder) return;
      try {
        const res = await sendApiRequest(`/orders/track/${activeOrder}`);
        if (res.success && res.data) {
          const newStatus = res.data.status;
          
          if (activeOrderStatus && newStatus !== activeOrderStatus) {
             showToast(`ออเดอร์ ${activeOrder} อัพเดทสถานะเป็น ${newStatus}`, 'info');
          }
          
          setActiveOrderStatus(newStatus);
          
          if (newStatus === 'เสร็จสิ้น' || newStatus === 'ยกเลิก') {
            localStorage.removeItem('activeOrder');
            setActiveOrder(null);
            setActiveOrderStatus(null);
          }
        }
      } catch (err) {
        console.error("เกิดข้อผิดพลาดในการตรวจสอบสถานะออเดอร์", err);
      }
    };

    if (activeOrder && !isTrackingModalOpen) {
      if (!activeOrderStatus) pollOrderStatus();
      intervalId = setInterval(pollOrderStatus, 10000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeOrder, activeOrderStatus, isTrackingModalOpen, showToast]);

  const handleAddItem = (item) => {
    setSelectedMenuItem(item);
    setSelectedDressing(dressings[0]);
    setIsDressingModalOpen(true);
  };

  const handleConfirmDressing = async () => {
    if (selectedMenuItem) {
      await addItemToCart(selectedMenuItem, selectedDressing);
      setIsDressingModalOpen(false);
      setSelectedMenuItem(null);
      setSelectedDressing(null);
      showToast('เพิ่มสินค้าลงตะกร้าแล้ว', 'success');
    }
  };

  const handleCheckoutSuccess = async (order) => {
    showToast(`สั่งซื้อสำเร็จ! รหัสออเดอร์ ${order.order_number}`, 'success');
    await clearCart();
    
    localStorage.setItem('activeOrder', order.order_number);
    setActiveOrder(order.order_number);
    setActiveOrderStatus('รอดำเนินการ');
    setIsTrackingModalOpen(true);
  };

  return (
    <>
      <Header 
        storeStatus={storeStatus} 
        onTrackOrder={() => setIsTrackingModalOpen(true)} 
      />
      
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 p-4 sm:px-6 lg:py-8 lg:px-[5%] max-w-[1400px] mx-auto items-start">
        <div className="flex-1 min-w-0 w-full">
          {/* Modern Premium Hero Section */}
          <div className="glass-card rounded-2xl lg:rounded-3xl p-8 lg:p-12 text-center mb-8 sm:mb-10 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
            <div className="relative z-10 flex flex-col items-center">
              <span className={`inline-flex items-center gap-2 py-1 px-4 rounded-full border text-xs sm:text-sm font-medium mb-4 tracking-wider ${storeStatus.is_open ? 'bg-primary/10 text-primary border-primary/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                <span className={`w-2 h-2 rounded-full ${storeStatus.is_open ? 'bg-primary animate-pulse' : 'bg-red-500'}`}></span>
                {storeStatus.is_open ? 'เปิดให้บริการ' : 'ปิดให้บริการชั่วคราว'}
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 text-white tracking-tight text-glow">
                {storeStatus.restaurant_name || 'ร้านสปริงโรลออนไลน์'}
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
                ชิ้นพอดีกิน อีสฉ่ำ — ผักสดกรอบ อร่อยเต็มคำ ส่งตรงถึงหน้าบ้านคุณด้วยวัตถุดิบระดับพรีเมียม
              </p>
            </div>
            
            {/* Decorative background blur elements */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
          </div>
          
          <MenuGrid 
            menuItems={menuItems} 
            isStoreOpen={storeStatus.is_open} 
            onAddItem={handleAddItem} 
          />
        </div>
        
        <div className="hidden lg:block w-full lg:w-[380px] sticky top-[100px]">
          <CartSidebar 
            isStoreOpen={storeStatus.is_open} 
            onCheckout={() => setIsCheckoutModalOpen(true)} 
          />
        </div>
      </div>

      <MobileCartBar 
        onOpenCart={() => setIsCheckoutModalOpen(true)} 
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
    </>
  );
}
