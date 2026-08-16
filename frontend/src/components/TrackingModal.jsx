import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sendApiRequest } from '../api/api.js';
import { useAlert } from '../context/AlertContext';
import { useToast } from '../context/ToastContext';

// Modal สำหรับติดตามสถานะคำสั่งซื้อแบบ Real-time พร้อมระบบขอยกเลิก
export default function TrackingModal({ isOpen, onClose, initialOrderNum }) {
  const { showAlert, showPrompt } = useAlert();
  const { showToast } = useToast();
  const [orderNum, setOrderNum] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState('');

  // อัปเดตข้อมูลเลขออเดอร์เมื่อเปิดหน้าต่างครั้งแรก
  useEffect(() => {
    if (isOpen) {
      setOrderNum(initialOrderNum || '');
      setTrackingData(null);
      setError('');
    }
  }, [isOpen, initialOrderNum]);

  // แจ้งเตือนผ่าน Toast เมื่อสถานะออเดอร์มีการเปลี่ยนแปลง
  const prevStatusRef = useRef(null);
  useEffect(() => {
    if (trackingData) {
      const currentStatus = trackingData.status;
      if (prevStatusRef.current && prevStatusRef.current !== currentStatus) {
        showToast(`ออเดอร์ ${trackingData.order_number} อัพเดทสถานะเป็น ${currentStatus}`, 'info');
      }
      prevStatusRef.current = currentStatus;
    } else {
      prevStatusRef.current = null;
    }
  }, [trackingData, showToast]);

  const handleSearch = useCallback(async (searchNum) => {
    const numToSearch = searchNum || orderNum;
    if (!numToSearch) return;
    setError('');
    
    try {
      const res = await sendApiRequest(`/orders/track/${numToSearch}`);
      if (res.success) {
        setTrackingData(res.data);
      }
    } catch (err) {
      setError('ไม่พบออเดอร์ หรือ เกิดข้อผิดพลาด');
      setTrackingData(null);
    }
  }, [orderNum]);

  // ค้นหาอัตโนมัติเมื่อเปิดหน้าต่างพร้อมเลขออเดอร์เริ่มต้น
  useEffect(() => {
    if (isOpen && initialOrderNum && !trackingData) {
      handleSearch(initialOrderNum);
    }
  }, [isOpen, initialOrderNum, handleSearch, trackingData]);

  // ตั้งเวลา Refresh ข้อมูลสถานะอัตโนมัติ (Polling) เพื่อให้อัพเดทเสมอ
  useEffect(() => {
    let intervalId;
    if (isOpen && trackingData) {
      const status = trackingData.status;
      if (status !== 'เสร็จสิ้น' && status !== 'ยกเลิก') {
        intervalId = setInterval(() => {
          if (document.visibilityState === 'visible') {
            handleSearch(trackingData.order_number || orderNum);
          }
        }, 3000);
      }
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, trackingData, handleSearch, orderNum]);

  const handleCopy = () => {
    if (orderNum) {
      navigator.clipboard.writeText(orderNum);
      showToast('คัดลอกเลขออเดอร์แล้ว', 'success');
    }
  };

  // แจ้งขอยกเลิกออเดอร์ไปยังเซิร์ฟเวอร์ พร้อมให้ลูกค้าระบุเหตุผล
  const handleCancel = async () => {
    if (!trackingData) return;
    const reason = await showPrompt('กรุณาระบุเหตุผลการยกเลิก (1-20 ตัวอักษร):');
    if (!reason || reason.trim().length === 0) return;
    
    try {
      const res = await sendApiRequest(`/orders/${trackingData.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ยกเลิก', cancel_reason: reason })
      });
      if (res.success) {
        showAlert('ยกเลิกออเดอร์สำเร็จ');
        handleSearch(); // Refresh data
      }
    } catch (err) {
      showAlert(err.message || 'เกิดข้อผิดพลาดในการยกเลิกออเดอร์');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-end md:items-center z-[1000] transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div className={`bg-surface w-full max-w-[500px] rounded-t-3xl md:rounded-2xl p-8 transition-transform duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)] shadow-glass-md max-h-[90vh] overflow-y-auto ${isOpen ? 'translate-y-0 md:scale-100' : 'translate-y-full md:scale-95'}`}>
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6 md:hidden"></div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-2xl font-bold text-text-main">ติดตามสถานะออเดอร์</span>
          <button className="bg-surface border border-border w-9 h-9 rounded-full text-2xl text-text-main flex items-center justify-center cursor-pointer transition-all hover:bg-background hover:text-red-500" onClick={onClose}>&times;</button>
        </div>

        <div className="flex gap-2 mb-4">
          <div className="relative w-full">
            <input 
              type="text" 
              className="w-full p-3 pr-12 border border-border rounded-xl text-base transition-all bg-surface text-text-main focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background" 
              value={orderNum}
              onChange={e => setOrderNum(e.target.value)}
              placeholder="ระบุรหัสสั่งซื้อ (เช่น ORD-1234)"
            />
            <button 
              onClick={handleCopy}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
              title="คัดลอกเลขออเดอร์"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
          </div>
          <button className="bg-primary text-white py-1.5 px-3 rounded-xl text-sm font-semibold cursor-pointer transition-all shadow-[0_4px_12px_rgba(249,115,22,0.3)] hover:bg-primary-hover whitespace-nowrap" onClick={() => handleSearch()}>ค้นหา</button>
        </div>

        <div>
          {error && <div className="text-center p-6 text-red-500 bg-surface/50 rounded-2xl border border-dashed border-red-500/30">{error}</div>}
          {!error && !trackingData && (
            <div className="text-center p-6 text-text-muted bg-surface/50 rounded-2xl border border-dashed border-border">กรอกรหัสสั่งซื้อเพื่อตรวจสอบสถานะออเดอร์ของคุณ</div>
          )}
          {trackingData && (
            <div className="bg-white/5 p-4 rounded-xl border border-border mt-4 relative overflow-hidden">
              {trackingData.status !== 'เสร็จสิ้น' && trackingData.status !== 'ยกเลิก' && (
                <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                  กำลังอัพเดท
                </div>
              )}
              <h4 className="mb-2.5 text-lg font-semibold mt-1">สถานะปัจจุบัน <span className={trackingData.status === 'ยกเลิก' ? 'text-red-500' : 'text-amber-500'}>{trackingData.status}</span></h4>
              <div className="mb-2 text-text-muted">สั่งเมื่อ {new Date(trackingData.created_at).toLocaleString('th-TH')}</div>
              <div className="mb-4">ยอดรวม <span className="font-bold text-primary">{trackingData.total_amount}</span> บาท</div>
              
              {trackingData.status === 'รอดำเนินการ' && (
                <button 
                  onClick={handleCancel}
                  className="w-full bg-transparent border border-red-500 text-red-500 py-1.5 rounded-lg cursor-pointer text-sm font-semibold hover:bg-red-500/10 transition-colors"
                >
                  ขอยกเลิกออเดอร์
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
