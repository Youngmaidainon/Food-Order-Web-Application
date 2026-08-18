import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSSE } from '../hooks/useSSE.js';
import { sendApiRequest, getApiUrl } from '../api/api.js';
import { useAlert } from '../context/AlertContext';
import { useToast } from '../context/ToastContext';
import { customerSoundAlert } from '../utils/audio.js';
import OrderSlipModal from './OrderSlipModal.jsx';

export default function TrackingModal({ isOpen, onClose, initialOrderNum }) {
  const { showAlert, showPrompt } = useAlert();
  const { showToast } = useToast();
  const [orderNum, setOrderNum] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Update order number when opened and automatically fetch latest state
  useEffect(() => {
    if (isOpen) {
      const targetNum = initialOrderNum || localStorage.getItem('activeOrder') || localStorage.getItem('lastTrackedOrder') || '';
      const cleanNum = targetNum.trim();
      setOrderNum(cleanNum);
      if (cleanNum) {
        handleSearch(cleanNum);
      } else {
        setTrackingData(null);
        setError('');
      }
    }
  }, [isOpen, initialOrderNum]);

  const handleSearch = useCallback(async (searchNum) => {
    const numToSearch = (searchNum || orderNum || '').trim();
    if (!numToSearch) return;
    setError('');
    setIsLoading(true);

    try {
      const res = await sendApiRequest(`/orders/track/${numToSearch}`);
      if (res.success && res.data) {
        setTrackingData(res.data);
        localStorage.setItem('lastTrackedOrder', res.data.order_number);
      } else {
        setError(res.message || 'ไม่พบออเดอร์ที่ระบุ');
        setTrackingData(null);
      }
    } catch (err) {
      setError(err.message || 'ไม่พบออเดอร์ หรือเกิดข้อผิดพลาดในการดึงข้อมูล');
      setTrackingData(null);
    } finally {
      setIsLoading(false);
    }
  }, [orderNum]);

  // SSE Live Updates (Active on tracked order)
  const currentTrackNum = trackingData?.order_number || (orderNum && orderNum.trim() ? orderNum.trim() : null);
  const sseUrl = (isOpen && currentTrackNum)
    ? getApiUrl(`/orders/events/${currentTrackNum}`)
    : null;
  const { data: sseData } = useSSE(sseUrl);

  useEffect(() => {
    if (sseData && sseData.event === 'order_status_updated' && currentTrackNum) {
      handleSearch(currentTrackNum);
    }
  }, [sseData, handleSearch, currentTrackNum]);

  const handleCopyOrderNumber = () => {
    if (!trackingData?.order_number) return;
    navigator.clipboard.writeText(trackingData.order_number);
    setIsCopied(true);
    showToast('คัดลอกรหัสออเดอร์เรียบร้อยแล้ว', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCancel = async () => {
    if (!trackingData) return;
    const reason = await showPrompt('กรุณาระบุเหตุผลการยกเลิก (1-20 ตัวอักษร):');
    if (!reason || reason.trim().length === 0) return;

    try {
      const res = await sendApiRequest(`/orders/${trackingData.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ยกเลิก', cancel_reason: reason.trim() })
      });
      if (res.success) {
        showAlert('ยกเลิกออเดอร์เรียบร้อยแล้ว');
        handleSearch(trackingData.order_number);
      }
    } catch (err) {
      showAlert(err.message || 'เกิดข้อผิดพลาดในการยกเลิกออเดอร์');
    }
  };

  if (!isOpen) return null;

  // Stepper Steps Definition (Synchronized with Admin & Database Statuses)
  const isPickup = trackingData?.delivery_type === 'รับเองที่ร้าน';
  const steps = [
    { key: 'รอดำเนินการ', stepNo: '1', label: 'รอดำเนินการ', desc: 'ร้านได้รับออเดอร์และกำลังจัดคิว', est: '~1-3 นาที' },
    { key: 'รับออเดอร์แล้ว', stepNo: '2', label: 'รับออเดอร์แล้ว', desc: 'ยืนยันคิวและเริ่มเตรียมวัตถุดิบ', est: '~3-5 นาที' },
    { key: 'กำลังเตรียมอาหาร', stepNo: '3', label: 'กำลังเตรียมอาหาร', desc: 'ครัวกำลังทำอาหารสดใหม่', est: '~10-15 นาที' },
    {
      key: isPickup ? 'พร้อมรับอาหาร' : 'กำลังจัดส่ง',
      stepNo: '4',
      label: isPickup ? 'พร้อมรับอาหาร' : 'กำลังจัดส่ง',
      desc: isPickup ? 'สามารถมารับที่หน้าร้านได้เลย' : 'ไรเดอร์กำลังเดินทางไปส่งตามที่อยู่',
      est: isPickup ? 'พร้อมรับ' : '~10-20 นาที'
    },
    {
      key: isPickup ? 'รับอาหารแล้ว' : 'จัดส่งแล้ว',
      stepNo: '5',
      label: isPickup ? 'รับอาหารแล้ว' : 'จัดส่งแล้ว',
      desc: isPickup ? 'ลูกค้ารับอาหารที่ร้านเรียบร้อยแล้ว' : 'จัดส่งอาหารถึงมือลูกค้าเรียบร้อยแล้ว',
      est: isPickup ? 'รับอาหารแล้ว' : 'จัดส่งแล้ว'
    },
  ];

  const getStepStatus = (stepIndex) => {
    if (!trackingData) return 'upcoming';
    if (trackingData.status === 'ยกเลิก') return 'canceled';

    const statusMap = {
      'รอดำเนินการ': 0,
      'รับออเดอร์แล้ว': 1,
      'กำลังเตรียมอาหาร': 2,
      'พร้อมรับอาหาร': 3,
      'กำลังจัดส่ง': 3,
      'รับอาหารแล้ว': 4,
      'จัดส่งแล้ว': 4
    };

    const currentStepIndex = statusMap[trackingData.status] ?? 0;
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'active';
    return 'upcoming';
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'รอดำเนินการ':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'รับออเดอร์แล้ว':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'กำลังเตรียมอาหาร':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'พร้อมรับอาหาร':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'กำลังจัดส่ง':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'รับอาหารแล้ว':
      case 'จัดส่งแล้ว':
        return 'bg-primary/20 text-primary border-primary/40';
      case 'ยกเลิก':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      default:
        return 'bg-primary/15 text-primary border-primary/30';
    }
  };

  return (
    <div className={`fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-end sm:items-center z-[1000] p-0 sm:p-4 transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div className={`bg-[#131317] border border-white/10 w-full max-w-[480px] rounded-t-2xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300 shadow-2xl max-h-[90vh] flex flex-col relative overflow-hidden ${isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-full sm:scale-95'}`}>

        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-primary to-teal-400 opacity-80"></div>

        {/* Mobile Drag Indicator */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-2.5 sm:hidden flex-shrink-0 cursor-pointer" onClick={onClose}></div>

        {/* Header */}
        <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary text-sm shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">ติดตามสถานะออเดอร์</h3>
              <p className="text-[10px] sm:text-xs text-gray-400">ระบบอัปเดตสถานะอัตโนมัติแบบเรียลไทม์</p>
            </div>
          </div>
          <button
            className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/15 flex items-center justify-center text-xs cursor-pointer transition-colors active:scale-95"
            onClick={onClose}
            title="ปิดหน้าต่าง"
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-1.5 mb-3 flex-shrink-0">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <input
              type="text"
              className="w-full py-1.5 pl-8 pr-7 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-mono"
              value={orderNum}
              onChange={e => setOrderNum(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="ค้นหา เช่น ORD-20260818-001"
            />
            {orderNum && (
              <button
                onClick={() => setOrderNum('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-500 hover:text-gray-300 text-[10px] transition-colors"
                title="ล้างข้อความ"
              >
                ✕
              </button>
            )}
          </div>
          <button
            disabled={isLoading || !orderNum.trim()}
            className="bg-primary text-white px-3.5 rounded-xl text-xs font-bold hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1 shadow-sm cursor-pointer"
            onClick={() => handleSearch()}
          >
            {isLoading ? (
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span>ค้นหา</span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-0.5 space-y-2.5 custom-scrollbar text-xs">
          {error && (
            <div className="text-center p-4 text-red-400 bg-red-500/10 rounded-xl border border-red-500/25 text-xs animate-in fade-in">
              <div className="flex items-center justify-center gap-1.5 font-bold mb-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                <span>{error}</span>
              </div>
              <p className="text-[10px] text-gray-400">กรุณาตรวจสอบรหัสคำสั่งซื้อใหม่อีกครั้ง</p>
            </div>
          )}

          {!error && !trackingData && !isLoading && (
            <div className="text-center py-8 px-4 text-gray-400 bg-white/5 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary/70 mb-2 border border-white/5">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <p className="text-xs font-bold text-white mb-0.5">กรอกรหัสสั่งซื้อเพื่อตรวจสอบสถานะ</p>
              <p className="text-[10px] text-gray-400 max-w-[240px]">
                เช่น <span className="font-mono text-primary font-semibold">ORD-20260818-001</span> เพื่อดูคิวและขั้นตอนการทำอาหาร
              </p>
            </div>
          )}

          {trackingData && (
            <div className="space-y-2.5 animate-in fade-in duration-200">

              {/* Order Info & Hero Card */}
              <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-xl p-3 sm:p-3.5 relative overflow-hidden backdrop-blur-sm shadow-sm">
                <div className="flex flex-col gap-2.5">
                  
                  {/* Top Badges Row & Queue Number */}
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-primary/25 to-teal-500/20 text-primary font-extrabold border border-primary/40 shadow-sm">
                        คิว #{trackingData.sequence_number || '-'}
                      </span>
                      <span className={`text-[10.5px] px-2 py-0.5 rounded-lg font-bold border ${getStatusBadgeColor(trackingData.status)}`}>
                        {trackingData.status}
                      </span>
                    </div>

                    {/* Customer Delivery Type */}
                    <span className="text-[11px] text-gray-300 font-medium flex items-center gap-1">
                      {trackingData.delivery_type === 'รับเองที่ร้าน' ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                          <span>รับเองที่หน้าร้าน</span>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="16" height="13" x="1" y="6" rx="2"/><polygon points="17 8 20 8 23 11 23 16 17 16 17 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                          <span>บริการจัดส่งถึงที่</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Order Number Monospace Bar with Centered / Integrated Copy Button */}
                  <div className="flex items-center justify-between gap-2 bg-black/40 p-1.5 px-3 rounded-xl border border-white/10">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10.5px] text-gray-400">รหัสออเดอร์:</span>
                      <span className="font-mono text-xs text-white font-bold tracking-wide truncate">
                        {trackingData.order_number}
                      </span>
                    </div>

                    <button
                      onClick={handleCopyOrderNumber}
                      title="คัดลอกรหัสออเดอร์"
                      className={`py-1 px-2.5 rounded-lg text-[10.5px] font-medium transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 border flex-shrink-0 ${
                        isCopied 
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold' 
                          : 'bg-white/10 hover:bg-white/20 border-white/15 text-gray-200 hover:text-white'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                          <span>คัดลอกเลข</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Customer metadata */}
                  {trackingData.customer_name && (
                    <div className="text-[11px] text-gray-400 flex items-center gap-1 px-0.5">
                      <span>ผู้สั่งซื้อ:</span>
                      <span className="text-white font-medium">{trackingData.customer_name}</span>
                      {trackingData.customer_phone && (
                        <span className="text-gray-400 font-mono">({trackingData.customer_phone})</span>
                      )}
                    </div>
                  )}

                  {/* Cancelled Banner */}
                  {trackingData.status === 'ยกเลิก' && (
                    <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-[11px] flex items-start gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                      <div>
                        <span className="font-bold">ออเดอร์นี้ถูกยกเลิกแล้ว</span>
                        {trackingData.cancel_reason && (
                          <span className="block mt-0.5 text-gray-300">เหตุผล: {trackingData.cancel_reason}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Visual Step Progress Tracker (Only show if not canceled) */}
              {trackingData.status !== 'ยกเลิก' && (
                <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 rounded-xl p-3 sm:p-3.5 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-2.5">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
                      ขั้นตอนการดำเนินงาน
                    </h4>
                    <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-semibold">
                      {steps.find(s => s.key === trackingData.status)?.est || 'กำลังดำเนินการ'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {steps.map((step, idx) => {
                      const state = getStepStatus(idx);
                      const isLast = idx === steps.length - 1;

                      return (
                        <div 
                          key={step.key} 
                          className={`flex gap-2.5 relative p-1.5 rounded-lg transition-all duration-200 ${
                            state === 'active' 
                              ? 'bg-primary/10 border border-primary/30' 
                              : 'border border-transparent'
                          }`}
                        >
                          {/* Stepper Connector Line */}
                          {!isLast && (
                            <div 
                              className={`absolute left-[19px] top-[30px] bottom-[-10px] w-0.5 transition-colors duration-300 ${
                                state === 'completed' ? 'bg-primary' : 'bg-white/10'
                              }`} 
                            />
                          )}

                          {/* Stepper Circle / Number */}
                          <div className={`relative z-10 w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all duration-200 flex-shrink-0 font-mono font-bold ${
                            state === 'completed'
                              ? 'bg-primary text-white shadow-sm'
                              : state === 'active'
                                ? 'bg-gradient-to-br from-primary to-teal-600 text-white shadow-sm ring-1 ring-primary/40'
                                : 'bg-white/5 border border-white/10 text-gray-500'
                          }`}>
                            {state === 'completed' ? '✓' : step.stepNo}
                          </div>

                          {/* Step Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className={`text-[11px] sm:text-xs font-bold ${
                                state === 'active' 
                                  ? 'text-primary' 
                                  : state === 'completed' 
                                    ? 'text-white' 
                                    : 'text-gray-400'
                              }`}>
                                {step.label}
                              </span>
                              {state === 'active' && (
                                <span className="text-[8.5px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-primary text-black">
                                  ขั้นตอนนี้
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{step.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ordered Items Preview */}
              {trackingData.items && trackingData.items.length > 0 && (
                <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 rounded-xl p-3 sm:p-3.5 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-[10.5px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>รายการสินค้า</span>
                      <span className="bg-white/10 text-gray-400 px-1.5 py-0.2 rounded text-[10px] font-mono">
                        {trackingData.items.length}
                      </span>
                    </h4>
                  </div>
                  
                  <div className="divide-y divide-white/5">
                    {trackingData.items.map((item, idx) => (
                      <div key={idx} className="py-1.5 flex justify-between items-start text-xs gap-1.5">
                        <div className="flex-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-primary text-[10.5px] bg-primary/10 px-1.5 py-0.2 rounded">
                              x{item.quantity}
                            </span>
                            <span className="font-semibold text-white text-[11.5px]">
                              {item.menu_item_name}
                            </span>
                          </div>
                          
                          {item.dressing_name && item.dressing_name !== 'ไม่รับน้ำสลัด' && (
                            <div className="mt-0.5 pl-5 text-[10px] text-gray-300 flex items-center gap-1">
                              <span className="text-primary font-bold">•</span>
                              <span>น้ำสลัด: <span className="text-white font-medium">{item.dressing_name}</span></span>
                            </div>
                          )}
                          
                          {item.item_notes && (
                            <div className="mt-0.5 pl-5 text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded inline-block">
                              หมายเหตุ: {item.item_notes}
                            </div>
                          )}
                        </div>
                        
                        <span className="font-bold text-gray-200 text-xs whitespace-nowrap pt-0.5">
                          {parseInt(item.unit_price * item.quantity, 10)} ฿
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order Total Summary */}
                  <div className="flex justify-between items-center font-bold pt-2.5 mt-1.5 border-t border-white/10">
                    <span className="text-gray-300 text-xs font-semibold">ยอดรวมทั้งสิ้น</span>
                    <span className="text-lg text-primary font-black tracking-tight">
                      {parseInt(trackingData.total_amount, 10)} ฿
                    </span>
                  </div>
                </div>
              )}

              {/* Customer Cancel Action */}
              {trackingData.status === 'รอดำเนินการ' && (
                <button
                  onClick={handleCancel}
                  className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  <span>ขอยกเลิกออเดอร์</span>
                </button>
              )}

              {/* View Slip Action (When Order is Completed) */}
              {(trackingData.status === 'เสร็จสิ้น' || trackingData.status === 'รับอาหารแล้ว' || trackingData.status === 'จัดส่งแล้ว') && (
                <button
                  onClick={() => setIsSlipOpen(true)}
                  className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md active:scale-98 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>
                  <span>ดูสลิปคำสั่งซื้อ (E-Receipt)</span>
                </button>
              )}

            </div>
          )}
        </div>

        {/* Customer Order Detail Slip Modal */}
        <OrderSlipModal
          isOpen={isSlipOpen}
          onClose={() => setIsSlipOpen(false)}
          order={trackingData}
        />
      </div>
    </div>
  );
}


