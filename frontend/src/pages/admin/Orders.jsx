import React, { useState, useEffect } from 'react';
import { sendApiRequest, getApiUrl } from '../../api/api.js';
import { useAlert } from '../../context/AlertContext';
import { useSSE } from '../../hooks/useSSE.js';
export default function Orders() {
  const { showAlert, showPrompt } = useAlert();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('admin_orders_view') || 'kanban'); // 'table' | 'kanban'
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const statuses = ['ทั้งหมด', 'รอดำเนินการ', 'รับออเดอร์แล้ว', 'กำลังเตรียมอาหาร', 'พร้อมรับอาหาร', 'กำลังจัดส่ง', 'รับอาหารแล้ว', 'จัดส่งแล้ว'];

  // Timer ticker every 5 seconds for elapsed time calculation
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Save view mode preference
  const toggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('admin_orders_view', mode);
  };

  // Real-time SSE Events (Primary Channel)
  const { data: sseData, isConnected: isSSEConnected } = useSSE(getApiUrl('/admin/events'));

  useEffect(() => {
    if (sseData) {
      if (sseData.event === 'new_order' || sseData.event === 'order_status_updated') {
        fetchOrders(false);
      }
    }
  }, [sseData]);

  // Smart Fallback Polling (Activated only when SSE connection is interrupted)
  useEffect(() => {
    let fallbackTimer = null;
    if (!isSSEConnected) {
      fallbackTimer = setInterval(() => {
        fetchOrders(false);
      }, 10000); // Poll every 10s when SSE is disconnected
    }
    return () => {
      if (fallbackTimer) clearInterval(fallbackTimer);
    };
  }, [isSSEConnected, statusFilter]);

  useEffect(() => {
    fetchOrders();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [statusFilter]);

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await sendApiRequest(`/admin/orders?status=${statusFilter}&limit=100&_t=${Date.now()}`);
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    let payload = { status: newStatus };
    if (newStatus === 'ยกเลิก') {
      const reason = await showPrompt('กรุณาระบุเหตุผลการยกเลิก (1-20 ตัวอักษร):');
      if (!reason || reason.trim().length === 0) return;
      payload.cancel_reason = reason.trim();
    }

    try {
      const res = await sendApiRequest(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(null);
        }
        fetchOrders(false);
      }
    } catch (err) {
      showAlert(err.message || 'อัปเดตสถานะออเดอร์ไม่สำเร็จ');
    }
  };

  const getNextStatusAction = (order) => {
    const isPickup = order.delivery_type === 'รับเองที่ร้าน';
    switch (order.status) {
      case 'รอดำเนินการ':
        return { label: 'รับออเดอร์แล้ว', nextStatus: 'รับออเดอร์แล้ว', color: 'bg-blue-500 hover:bg-blue-600' };
      case 'รับออเดอร์แล้ว':
        return { label: 'กำลังเตรียมอาหาร', nextStatus: 'กำลังเตรียมอาหาร', color: 'bg-orange-500 hover:bg-orange-600' };
      case 'กำลังเตรียมอาหาร':
        return isPickup 
          ? { label: 'พร้อมรับอาหาร', nextStatus: 'พร้อมรับอาหาร', color: 'bg-emerald-500 hover:bg-emerald-600' }
          : { label: 'กำลังจัดส่ง', nextStatus: 'กำลังจัดส่ง', color: 'bg-purple-500 hover:bg-purple-600' };
      case 'พร้อมรับอาหาร':
        return { label: 'รับอาหารแล้ว', nextStatus: 'รับอาหารแล้ว', color: 'bg-primary hover:bg-primary-hover' };
      case 'กำลังจัดส่ง':
        return { label: 'จัดส่งแล้ว', nextStatus: 'จัดส่งแล้ว', color: 'bg-primary hover:bg-primary-hover' };
      default:
        return null;
    }
  };

  const getElapsedTimeInfo = (createdAt) => {
    const diffMs = currentTime - new Date(createdAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);

    let style = 'bg-white/5 border-white/10 text-gray-400';
    let isUrgent = false;

    if (diffMins >= 15) {
      style = 'bg-red-500/20 border-red-500/40 text-red-400 font-bold animate-pulse';
      isUrgent = true;
    } else if (diffMins >= 10) {
      style = 'bg-amber-500/20 border-amber-500/40 text-amber-400 font-bold';
    }

    return {
      text: `${diffMins}m ${diffSecs}s`,
      mins: diffMins,
      style,
      isUrgent
    };
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'รอดำเนินการ': return 'bg-amber-500 text-white';
      case 'รับออเดอร์แล้ว': return 'bg-blue-500 text-white';
      case 'กำลังเตรียมอาหาร': return 'bg-orange-500 text-white';
      case 'พร้อมรับอาหาร': return 'bg-emerald-500 text-white';
      case 'กำลังจัดส่ง': return 'bg-purple-500 text-white';
      case 'รับอาหารแล้ว':
      case 'จัดส่งแล้ว': return 'bg-primary text-white';
      case 'ยกเลิก': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Kanban Columns Data (Synchronized with exact system statuses)
  const kanbanColumns = [
    {
      id: 'pending',
      title: 'รอดำเนินการ / รับออเดอร์แล้ว',
      icon: '⏳',
      color: 'border-amber-500/40',
      badgeColor: 'bg-amber-500/20 text-amber-400',
      orders: orders.filter(o => o.status === 'รอดำเนินการ' || o.status === 'รับออเดอร์แล้ว')
    },
    {
      id: 'cooking',
      title: 'กำลังเตรียมอาหาร',
      icon: '🍳',
      color: 'border-orange-500/40',
      badgeColor: 'bg-orange-500/20 text-orange-400',
      orders: orders.filter(o => o.status === 'กำลังเตรียมอาหาร')
    },
    {
      id: 'ready',
      title: 'พร้อมรับอาหาร / กำลังจัดส่ง',
      icon: '🛵',
      color: 'border-purple-500/40',
      badgeColor: 'bg-purple-500/20 text-purple-400',
      orders: orders.filter(o => o.status === 'พร้อมรับอาหาร' || o.status === 'กำลังจัดส่ง')
    },
    {
      id: 'completed',
      title: 'รับอาหารแล้ว / จัดส่งแล้ว',
      icon: '✅',
      color: 'border-primary/40',
      badgeColor: 'bg-primary/20 text-primary',
      orders: orders.filter(o => o.status === 'รับอาหารแล้ว' || o.status === 'จัดส่งแล้ว')
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface/60 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/10 shadow-lg relative overflow-hidden">
        {/* Subtle accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/40 via-primary to-teal-500/40 opacity-70"></div>

        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              จัดการออเดอร์
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/10 font-bold">
              {orders.length} ออเดอร์
            </span>
          </div>
          <p className="text-gray-400 mt-0.5 text-xs sm:text-sm">
            ระบบบริหารจัดการคิวและสถานะออเดอร์แบบเรียลไทม์
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-black/40 border border-white/10 p-1 rounded-2xl shadow-inner">
            <button
              onClick={() => toggleViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'kanban' ? 'bg-primary text-white shadow-sm shadow-primary/30' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>🍱 กระดานครัว</span>
            </button>
            <button
              onClick={() => toggleViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-primary text-white shadow-sm shadow-primary/30' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>ตาราง</span>
            </button>
          </div>

          {/* Status Filter for Table View */}
          {viewMode === 'table' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3.5 rounded-xl border border-white/10 bg-black/40 text-white text-xs font-medium focus:outline-none focus:border-primary cursor-pointer shadow-inner"
            >
              {statuses.map(s => <option key={s} value={s} className="bg-[#18181b]">{s}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading && orders.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 flex flex-col items-center justify-center text-gray-400">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-medium">กำลังโหลดข้อมูลออเดอร์...</p>
        </div>
      ) : viewMode === 'kanban' ? (
        
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
          {kanbanColumns.map(column => (
            <div 
              key={column.id}
              className={`glass-card rounded-3xl border ${column.color} p-4 flex flex-col max-h-[85vh] bg-surface/50`}
            >
              {/* Column Header */}
              <div className="flex justify-between items-center pb-3 mb-3 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{column.icon}</span>
                  <h3 className="font-bold text-sm text-white">{column.title}</h3>
                </div>
                <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${column.badgeColor}`}>
                  {column.orders.length}
                </span>
              </div>

              {/* Column Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                {column.orders.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 text-xs border border-dashed border-white/5 rounded-2xl">
                    ไม่มีออเดอร์ในหมวดนี้
                  </div>
                ) : (
                  column.orders.map(order => {
                    const elapsed = getElapsedTimeInfo(order.created_at);
                    const nextAction = getNextStatusAction(order);

                    return (
                      <div 
                        key={order.id}
                        className="bg-[#18181f] border border-white/10 hover:border-white/25 rounded-2xl p-4 transition-all shadow-md group relative overflow-hidden"
                      >
                        {/* Urgent highlight bar */}
                        {elapsed.isUrgent && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse"></div>
                        )}

                        {/* Card Header: Queue & Elapsed Time */}
                        <div className="flex justify-between items-start mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black bg-primary/20 text-primary border border-primary/40 px-2.5 py-1 rounded-xl shadow-sm">
                              คิว #{order.sequence_number || '-'}
                            </span>
                            <span className="text-[11px] font-mono text-gray-400">
                              {order.order_number}
                            </span>
                          </div>

                          <div className={`text-[10px] px-2 py-0.5 rounded-lg border flex items-center gap-1 ${elapsed.style}`}>
                            <span>⏱️</span>
                            <span>{elapsed.text}</span>
                          </div>
                        </div>

                        {/* Customer & Delivery Metadata */}
                        <div className="text-xs text-gray-300 mb-3 flex items-center justify-between">
                          <span className="font-semibold text-white truncate max-w-[120px]">
                            {order.customer_name}
                          </span>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                            order.delivery_type === 'รับเองที่ร้าน' 
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}>
                            {order.delivery_type === 'รับเองที่ร้าน' ? '🛍️ รับหน้าร้าน' : '🛵 จัดส่ง'}
                          </span>
                        </div>

                        {/* Ordered Items List */}
                        <div className="space-y-1.5 mb-3 bg-black/30 p-2.5 rounded-xl border border-white/5 text-xs">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="pb-1 border-b border-white/5 last:border-0 last:pb-0">
                              <div className="flex justify-between font-medium text-white">
                                <span><span className="text-primary font-bold">x{item.quantity}</span> {item.menu_item_name}</span>
                                <span className="text-gray-400 text-[11px]">{parseInt(item.unit_price * item.quantity, 10)} ฿</span>
                              </div>
                              {item.dressing_name && item.dressing_name !== 'ไม่รับน้ำสลัด' && (
                                <div className="text-[10px] text-primary/80 pl-4">
                                  + น้ำสลัด: {item.dressing_name}
                                </div>
                              )}
                              {item.item_notes && (
                                <div className="text-[10px] text-orange-400 font-bold bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                  📝 {item.item_notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Total Amount */}
                        <div className="flex justify-between items-center text-xs font-bold mb-3 px-1">
                          <span className="text-gray-400">ยอดรวม:</span>
                          <span className="text-sm font-extrabold text-primary">{parseInt(order.total_amount, 10)} ฿</span>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="flex gap-2 pt-2 border-t border-white/10">
                          {nextAction && (
                            <button
                              onClick={() => updateOrderStatus(order.id, nextAction.nextStatus)}
                              className={`flex-1 py-2 px-3 text-xs rounded-xl font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer ${nextAction.color}`}
                            >
                              {nextAction.label} →
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            title="ดูรายละเอียดเพิ่มเติม"
                            className="p-2 bg-white/5 hover:bg-white/15 border border-white/10 text-blue-400 hover:text-blue-300 rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            🔍
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>

      ) : (

        /* Table View */
        <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-lg">
          {/* Mobile/Tablet Scroll Hint */}
          <div className="xl:hidden px-5 py-2.5 bg-black/40 border-b border-white/5 text-[11px] text-gray-400 flex items-center justify-between">
            <span>💡 เลื่อนซ้าย-ขวาเพื่อดูข้อมูลทั้งหมด</span>
            <span className="text-primary font-medium">ทั้งหมด {orders.length} ออเดอร์</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-black/50 text-gray-300 text-xs tracking-wider uppercase border-b border-white/10 font-bold">
                  <th className="p-4 sm:p-5 text-center min-w-[110px] whitespace-nowrap">ลำดับคิว</th>
                  <th className="p-4 sm:p-5 text-center min-w-[170px] whitespace-nowrap">รหัสออเดอร์</th>
                  <th className="p-4 sm:p-5 text-center min-w-[200px] whitespace-nowrap">ลูกค้า & การจัดส่ง</th>
                  <th className="p-4 sm:p-5 text-center min-w-[130px] whitespace-nowrap">ระยะเวลารอ</th>
                  <th className="p-4 sm:p-5 text-center min-w-[150px] whitespace-nowrap">สถานะ</th>
                  <th className="p-4 sm:p-5 text-center min-w-[120px] whitespace-nowrap">ยอดเงิน</th>
                  <th className="p-4 sm:p-5 text-center min-w-[250px] whitespace-nowrap">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-16 text-center text-gray-500">
                      <div className="text-3xl mb-2">📋</div>
                      <p className="text-sm font-medium">ไม่มีออเดอร์ในสถานะนี้</p>
                    </td>
                  </tr>
                ) : (
                  orders.map(order => {
                    const elapsed = getElapsedTimeInfo(order.created_at);
                    const nextAction = getNextStatusAction(order);

                    return (
                      <tr key={order.id} className="hover:bg-white/5 transition-colors">
                        {/* Queue Number */}
                        <td className="p-4 sm:p-5 text-center align-middle whitespace-nowrap">
                          <span className="text-base sm:text-lg font-black text-primary bg-primary/10 border border-primary/30 px-3 py-1.5 rounded-2xl inline-block shadow-sm">
                            คิว #{order.sequence_number || '-'}
                          </span>
                        </td>

                        {/* Order Number */}
                        <td className="p-4 sm:p-5 text-center align-middle whitespace-nowrap">
                          <span className="font-mono font-bold text-white text-xs sm:text-sm bg-black/40 px-2.5 py-1 rounded-xl border border-white/5">
                            {order.order_number}
                          </span>
                        </td>

                        {/* Customer & Delivery Type */}
                        <td className="p-4 sm:p-5 text-center align-middle">
                          <div className="flex flex-col items-center justify-center">
                            <span className="font-bold text-white text-sm sm:text-base mb-1">
                              {order.customer_name}
                            </span>
                            <div className="flex items-center justify-center gap-1.5 flex-wrap text-xs text-gray-400">
                              <span className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${
                                order.delivery_type === 'รับเองที่ร้าน' 
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                  : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              }`}>
                                {order.delivery_type === 'รับเองที่ร้าน' ? '🛍️ รับหน้าร้าน' : '🛵 จัดส่ง'}
                              </span>
                              <span>•</span>
                              <span className="font-mono text-gray-300">{order.customer_phone}</span>
                            </div>
                          </div>
                        </td>

                        {/* Elapsed Timer */}
                        <td className="p-4 sm:p-5 text-center align-middle whitespace-nowrap">
                          <span className={`text-xs px-2.5 py-1 rounded-xl border inline-flex items-center gap-1 font-medium ${elapsed.style}`}>
                            <span>⏱️</span>
                            <span>{elapsed.text}</span>
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="p-4 sm:p-5 text-center align-middle whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold shadow-sm ${getStatusBgColor(order.status)}`}>
                            {order.status === 'รอดำเนินการ' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                            {order.status}
                          </span>
                        </td>

                        {/* Total Amount */}
                        <td className="p-4 sm:p-5 text-center align-middle whitespace-nowrap">
                          <span className="text-base sm:text-lg font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-xl inline-block">
                            {parseInt(order.total_amount, 10)} ฿
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="p-4 sm:p-5 text-center align-middle whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {nextAction && (
                              <button
                                onClick={() => updateOrderStatus(order.id, nextAction.nextStatus)}
                                className={`py-2 px-3.5 text-xs rounded-xl font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer ${nextAction.color}`}
                              >
                                {nextAction.label}
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="py-2 px-3.5 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-500 hover:text-white transition-all font-semibold cursor-pointer"
                            >
                              รายละเอียด
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[1000] p-4 animate-in fade-in duration-200">
          <div className="glass-card bg-[#141419] w-full max-w-[620px] rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 relative">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-primary bg-primary/20 px-3 py-1 rounded-xl">
                    คิว #{selectedOrder.sequence_number || '-'}
                  </span>
                  <h2 className="text-xl font-bold text-white font-mono">{selectedOrder.order_number}</h2>
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  สั่งเมื่อ {new Date(selectedOrder.created_at).toLocaleString('th-TH')}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors cursor-pointer border border-white/10"
              >
                ✕
              </button>
            </div>

            {/* Customer Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 bg-black/40 p-4 rounded-2xl border border-white/5 text-xs sm:text-sm">
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">ลูกค้า</div>
                <div className="font-bold text-white">{selectedOrder.customer_name}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">เบอร์โทรศัพท์</div>
                <div className="font-bold text-white">{selectedOrder.customer_phone}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">ประเภท</div>
                <div className="font-bold text-primary">{selectedOrder.delivery_type}</div>
              </div>
              {selectedOrder.delivery_type === 'จัดส่ง' && selectedOrder.address && (
                <div className="col-span-2 md:col-span-3 pt-3 border-t border-white/10">
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">ที่อยู่จัดส่ง</div>
                  <div className="text-white text-xs leading-relaxed">{selectedOrder.address}</div>
                </div>
              )}
            </div>

            {/* Ordered Items */}
            <h3 className="font-bold mb-3 text-base text-white flex items-center gap-2">
              <span>🥗</span>
              <span>รายการอาหารในออเดอร์</span>
            </h3>
            <div className="mb-6 space-y-2.5 bg-black/20 p-4 rounded-2xl border border-white/5">
              {(selectedOrder.items || []).map(item => (
                <div key={item.id} className="flex justify-between py-2 border-b border-white/5 last:border-0 text-sm">
                  <div>
                    <div className="font-bold text-white">
                      <span className="text-primary mr-2">x{item.quantity}</span> {item.menu_item_name}
                    </div>
                    {item.dressing_name && item.dressing_name !== 'ไม่รับน้ำสลัด' && (
                      <div className="text-xs text-primary/80 mt-1 pl-4">
                        + น้ำสลัด: {item.dressing_name}
                      </div>
                    )}
                    {item.item_notes && (
                      <div className="text-xs text-orange-400 mt-1 font-semibold bg-orange-500/10 px-2 py-0.5 rounded inline-block">
                        📝 {item.item_notes}
                      </div>
                    )}
                  </div>
                  <div className="font-bold text-white">{parseInt(item.unit_price * item.quantity, 10)} ฿</div>
                </div>
              ))}
            </div>

            {/* Total Amount */}
            <div className="flex justify-between items-center text-lg font-bold mb-6 pt-3 border-t border-white/10">
              <span className="text-white">ยอดรวมทั้งสิ้น</span>
              <span className="text-2xl text-primary font-black">{parseInt(selectedOrder.total_amount, 10)} ฿</span>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2.5 flex-wrap pt-2 border-t border-white/10">
              {getNextStatusAction(selectedOrder) && (
                <button 
                  onClick={() => updateOrderStatus(selectedOrder.id, getNextStatusAction(selectedOrder).nextStatus)} 
                  className={`flex-1 py-3 px-4 text-sm rounded-xl cursor-pointer font-bold text-white transition-all ${getNextStatusAction(selectedOrder).color}`}
                >
                  {getNextStatusAction(selectedOrder).label}
                </button>
              )}

              {(selectedOrder.status === 'รอดำเนินการ' || selectedOrder.status === 'รับออเดอร์แล้ว') && (
                <button 
                  onClick={() => updateOrderStatus(selectedOrder.id, 'ยกเลิก')} 
                  className="py-3 px-4 text-sm rounded-xl cursor-pointer font-bold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors"
                >
                  ยกเลิกออเดอร์
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
