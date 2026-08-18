import React, { useState } from 'react';
import { sendApiRequest } from '../api/api.js';

// Modal สำหรับกรอกข้อมูลส่วนตัวและยืนยันการสั่งซื้อ
export default function CheckoutModal({ isOpen, onClose, cartItems, totalPrice, onCheckoutSuccess }) {
  const [deliveryType, setDeliveryType] = useState('รับเองที่ร้าน');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // ส่งข้อมูลคำสั่งซื้อไปยัง API หลังบ้าน
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
    <div className={`fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-end sm:items-center z-[1000] p-0 sm:p-4 transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div className={`bg-[#131317] border border-white/10 w-full max-w-[480px] rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 shadow-2xl max-h-[90vh] overflow-y-auto ${isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-full sm:scale-95'}`}>
        
        {/* Mobile Drag Indicator */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3 sm:hidden cursor-pointer" onClick={onClose}></div>
        
        <div className="flex justify-between items-center mb-4 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary text-sm shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/></svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">ยืนยันข้อมูลคำสั่งซื้อ</h3>
              <p className="text-[11px] text-gray-400">กรุณาระบุรายละเอียดผู้สั่งซื้อ</p>
            </div>
          </div>
          <button className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center text-xs cursor-pointer transition-colors" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold mb-1.5 text-gray-300 text-xs">รูปแบบการรับสินค้า</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button" 
                className={`py-2 px-3 border rounded-xl font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 text-xs ${deliveryType === 'รับเองที่ร้าน' ? 'border-primary bg-primary/15 text-primary shadow-sm' : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'}`}
                onClick={() => setDeliveryType('รับเองที่ร้าน')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                <span>รับเองที่ร้าน</span>
              </button>
              <button 
                type="button" 
                className={`py-2 px-3 border rounded-xl font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 text-xs ${deliveryType === 'จัดส่ง' ? 'border-primary bg-primary/15 text-primary shadow-sm' : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'}`}
                onClick={() => setDeliveryType('จัดส่ง')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="13" x="1" y="6" rx="2"/><polygon points="17 8 20 8 23 11 23 16 17 16 17 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <span>จัดส่งเดลิเวอรี่</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-300 text-xs">ชื่อผู้สั่งซื้อ *</label>
            <input 
              type="text" 
              className="w-full py-2 px-3 border border-white/10 rounded-xl text-xs sm:text-sm transition-all bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" 
              placeholder="ระบุชื่อของคุณ"
              value={name}
              onChange={e => setName(e.target.value.replace(/[^A-Za-zก-ฮะ-์\s]/g, ''))}
              required 
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-300 text-xs">เบอร์โทรศัพท์ *</label>
            <input 
              type="tel" 
              className="w-full py-2 px-3 border border-white/10 rounded-xl text-xs sm:text-sm font-mono transition-all bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" 
              placeholder="08xxxxxxxx"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              maxLength="10"
              required 
            />
          </div>

          {deliveryType === 'จัดส่ง' && (
            <div>
              <label className="block font-semibold mb-1 text-gray-300 text-xs">ที่อยู่สำหรับจัดส่ง *</label>
              <textarea 
                className="w-full py-2 px-3 border border-white/10 rounded-xl text-xs sm:text-sm transition-all bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" 
                rows="2"
                placeholder="บ้านเลขที่, ถนน, ซอย, จุดสังเกต..."
                value={address}
                onChange={e => setAddress(e.target.value)}
                required
              />
            </div>
          )}

          {/* Price Summary */}
          <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs sm:text-sm">
            <span className="text-gray-400">ยอดชำระเงินรวม</span>
            <span className="text-lg font-black text-primary font-mono">{parseInt(totalPrice, 10)} ฿</span>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-primary text-white border-none py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-all shadow-md hover:bg-primary-hover active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5" 
            disabled={isSubmitting}
          >
            <span>{isSubmitting ? 'กำลังดำเนินการ...' : 'ยืนยันการสั่งซื้อ'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

