import React, { useState } from 'react';
import { sendApiRequest } from '../api/api.js';

export default function CheckoutModal({ isOpen, onClose, cartItems, totalPrice, onCheckoutSuccess }) {
  const [deliveryType, setDeliveryType] = useState('รับเองที่ร้าน');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setError('ตะกร้าว่างเปล่า');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    const payload = {
      customer_name: name,
      customer_phone: phone,
      delivery_type: deliveryType,
      address: deliveryType === 'จัดส่ง' ? address : null,
      items: cartItems.map(item => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        dressing_id: item.dressing_id || null,
        item_notes: item.item_notes || ''
      }))
    };

    try {
      const res = await sendApiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        onCheckoutSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-end md:items-center z-[1000] transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div className={`bg-surface w-full max-w-[500px] rounded-t-2xl md:rounded-3xl p-5 md:p-8 transition-transform duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)] shadow-glass-md max-h-[90vh] overflow-y-auto ${isOpen ? 'translate-y-0 md:scale-100' : 'translate-y-full md:scale-95'}`}>
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-4 md:mb-6 md:hidden"></div>
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <span className="text-xl md:text-2xl font-bold text-text-main">กรอกข้อมูลสั่งซื้อ</span>
          <button className="bg-surface border border-border w-9 h-9 rounded-full text-2xl text-text-main flex items-center justify-center cursor-pointer transition-all hover:bg-background hover:text-red-500" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block font-semibold mb-2 text-text-main">รูปแบบการรับสินค้า</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                className={`p-3 border-2 rounded-xl font-semibold cursor-pointer transition-all hover:border-slate-500 ${deliveryType === 'รับเองที่ร้าน' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-transparent text-text-main'}`}
                onClick={() => setDeliveryType('รับเองที่ร้าน')}
              >
                🏬 รับเองที่ร้าน
              </button>
              <button 
                type="button" 
                className={`p-3 border-2 rounded-xl font-semibold cursor-pointer transition-all hover:border-slate-500 ${deliveryType === 'จัดส่ง' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-transparent text-text-main'}`}
                onClick={() => setDeliveryType('จัดส่ง')}
              >
                🛵 จัดส่งเดลิเวอรี่
              </button>
            </div>
          </div>

          <div className="mb-5">
            <label className="block font-semibold mb-2 text-text-main">ชื่อผู้สั่งซื้อ *</label>
            <input 
              type="text" 
              className="w-full p-3 border border-border rounded-xl text-base transition-all bg-surface text-text-main focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background" 
              value={name}
              onChange={e => setName(e.target.value.replace(/[^A-Za-zก-ฮะ-์\s]/g, ''))}
              required 
            />
          </div>

          <div className="mb-5">
            <label className="block font-semibold mb-2 text-text-main">เบอร์โทรศัพท์ *</label>
            <input 
              type="tel" 
              className="w-full p-3 border border-border rounded-xl text-base transition-all bg-surface text-text-main focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background" 
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              maxLength="10"
              required 
            />
          </div>

          {deliveryType === 'จัดส่ง' && (
            <div className="mb-5">
              <label className="block font-semibold mb-2 text-text-main">ที่อยู่สำหรับจัดส่ง *</label>
              <textarea 
                className="w-full p-3 border border-border rounded-xl text-base transition-all bg-surface text-text-main focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background" 
                rows="3"
                value={address}
                onChange={e => setAddress(e.target.value)}
                required
              />
            </div>
          )}

          {error && <div className="text-red-500 mb-2.5">{error}</div>}

          <button type="submit" className="w-full bg-primary text-white border-none py-2 px-4 rounded-xl text-sm font-bold cursor-pointer transition-all shadow-[0_8px_20px_rgba(249,115,22,0.3)] hover:bg-primary-hover hover:-translate-y-0.5 disabled:bg-[#27272a] disabled:text-[#a1a1aa] disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none" disabled={isSubmitting}>
            <span>{isSubmitting ? 'กำลังดำเนินการ...' : 'ยืนยันการสั่งซื้อ'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
