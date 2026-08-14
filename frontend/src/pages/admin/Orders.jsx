import React, { useState, useEffect } from 'react';
import { sendApiRequest } from '../../api/api.js';
import { useAlert } from '../../context/AlertContext';

export default function Orders() {
  const { showAlert, showPrompt } = useAlert();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const statuses = ['ทั้งหมด', 'รอดำเนินการ', 'รับออเดอร์แล้ว', 'กำลังเตรียมอาหาร', 'พร้อมรับอาหาร', 'กำลังจัดส่ง', 'รับอาหารแล้ว', 'จัดส่งแล้ว'];

  useEffect(() => {
    fetchOrders();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchOrders(false);
      }
    }, 3000); // Auto refresh every 3 seconds when visible

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [statusFilter]);

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await sendApiRequest(`/admin/orders?status=${statusFilter}&limit=50`);
      if (res.success) {
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
      const reason = await showPrompt('กรุณาระบุเหตุผลการยกเลิก');
      if (!reason) return;
      payload.cancel_reason = reason;
    }

    try {
      const res = await sendApiRequest(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        showAlert(res.message);
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (err) {
      showAlert(err.message || 'อัปเดตสถานะออเดอร์ไม่สำเร็จ');
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'รอดำเนินการ': return 'bg-amber-500 text-white';
      case 'รับอาหารแล้ว':
      case 'จัดส่งแล้ว': return 'bg-secondary text-white';
      case 'ยกเลิก': return 'bg-red-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  return (
    <div>
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight m-0">จัดการออเดอร์</h1>
        <p className="text-gray-400 mt-2 text-sm">ตรวจสอบและอัปเดตสถานะคำสั่งซื้อ</p>
      </div>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="py-2.5 px-5 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md text-white focus:outline-none focus:border-primary cursor-pointer font-medium shadow-sm transition-colors hover:bg-black/60"
      >
        {statuses.map(s => <option key={s} value={s} className="bg-[#18181b]">{s}</option>)}
      </select>
    </div>

    <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-lg">
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center text-gray-500">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <div>กำลังโหลดข้อมูลออเดอร์...</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-black/40 text-gray-400 text-sm tracking-wider uppercase border-b border-white/10">
                <th className="p-5 font-semibold min-w-[200px] text-center">รหัส / คิว</th>
                <th className="p-5 font-semibold min-w-[200px] whitespace-nowrap text-center">สถานะ</th>
                <th className="p-5 font-semibold min-w-[200px] whitespace-nowrap text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-16 text-center text-gray-500 flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" x2="15" y1="15" y2="15"/></svg>
                    ไม่มีออเดอร์ในสถานะนี้
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="p-5 text-center">
                      <div className="font-bold text-white text-lg flex items-center justify-center gap-2">
                        {order.order_number}
                      </div>
                      <div className="text-sm text-gray-400 mt-1 flex items-center justify-center gap-2">
                        <span className="bg-white/10 px-2 py-0.5 rounded text-xs">คิว #{order.sequence_number}</span>
                        <span>•</span>
                        <span>{order.delivery_type}</span>
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold shadow-sm ${getStatusBgColor(order.status)}`}>
                        {order.status === 'รอดำเนินการ' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                        {order.status}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex gap-2 justify-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="py-2 px-4 text-sm bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl cursor-pointer hover:bg-blue-500 hover:text-white transition-all font-medium whitespace-nowrap shadow-sm group-hover:shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                        >
                          รายละเอียด
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {selectedOrder && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 animate-in fade-in duration-200">
        <div className="glass-card w-full max-w-[600px] rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 relative">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">ออเดอร์ <span className="text-primary">{selectedOrder.order_number}</span></h2>
              <div className="text-gray-400 text-sm mt-1">คิว #{selectedOrder.sequence_number}</div>
            </div>
            <button onClick={() => setSelectedOrder(null)} className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-none rounded-full p-2 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 bg-black/40 p-5 rounded-2xl border border-white/5">
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
              <div className="font-bold text-blue-400">{selectedOrder.delivery_type}</div>
            </div>
            {selectedOrder.delivery_type === 'จัดส่ง' && (
              <div className="col-span-2 md:col-span-3 mt-2 pt-3 border-t border-white/10">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">ที่อยู่</div>
                <div className="text-white text-sm leading-relaxed">{selectedOrder.address}</div>
              </div>
            )}
          </div>

          <h3 className="font-bold mb-4 text-lg text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
            รายการอาหาร
          </h3>
          <div className="mb-6 space-y-3">
            {selectedOrder.items.map(item => (
              <div key={item.id} className="flex justify-between py-3 border-b border-white/5 last:border-0">
                <div>
                  <div className="font-bold text-white"><span className="text-primary mr-2">{item.quantity}x</span> {item.menu_item_name}</div>
                  <div className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                    <span className="bg-white/10 px-2 py-0.5 rounded text-xs">น้ำสลัด {item.dressing_name}</span>
                  </div>
                  {item.item_notes && <div className="text-sm text-orange-400 mt-1.5 bg-orange-500/10 inline-block px-2 py-1 rounded border border-orange-500/20">หมายเหตุ {item.item_notes}</div>}
                </div>
                <div className="font-bold text-white">{(item.unit_price * item.quantity).toFixed(2)} ฿</div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center text-xl font-bold mb-8 pt-5 border-t border-white/10">
            <span className="text-white">ยอดรวมทั้งหมด</span>
            <span className="text-3xl text-primary">{parseFloat(selectedOrder.total_amount).toFixed(2)} <span className="text-xl">฿</span></span>
          </div>

          <div className="flex gap-3 flex-wrap pt-4 border-t border-white/10">
            {selectedOrder.status === 'รอดำเนินการ' && <button onClick={() => updateOrderStatus(selectedOrder.id, 'รับออเดอร์แล้ว')} className="flex-1 py-3 px-4 text-sm rounded-xl cursor-pointer font-bold transition-all shadow-[0_4px_15px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 border-none bg-blue-500 text-white hover:bg-blue-600">รับออเดอร์</button>}
            {selectedOrder.status === 'รับออเดอร์แล้ว' && <button onClick={() => updateOrderStatus(selectedOrder.id, 'กำลังเตรียมอาหาร')} className="flex-1 py-3 px-4 text-sm rounded-xl cursor-pointer font-bold transition-all shadow-[0_4px_15px_rgba(245,158,11,0.3)] hover:-translate-y-0.5 border-none bg-amber-500 text-white hover:bg-amber-600">กำลังเตรียมอาหาร</button>}
            {selectedOrder.status === 'กำลังเตรียมอาหาร' && selectedOrder.delivery_type === 'รับเองที่ร้าน' && <button onClick={() => updateOrderStatus(selectedOrder.id, 'พร้อมรับอาหาร')} className="flex-1 py-3 px-4 text-sm rounded-xl cursor-pointer font-bold transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 border-none bg-primary text-white hover:bg-primary-hover">พร้อมรับอาหาร</button>}
            {selectedOrder.status === 'กำลังเตรียมอาหาร' && selectedOrder.delivery_type === 'จัดส่ง' && <button onClick={() => updateOrderStatus(selectedOrder.id, 'กำลังจัดส่ง')} className="flex-1 py-3 px-4 text-sm rounded-xl cursor-pointer font-bold transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 border-none bg-primary text-white hover:bg-primary-hover">กำลังจัดส่ง</button>}

            {(selectedOrder.status === 'พร้อมรับอาหาร' || selectedOrder.status === 'กำลังจัดส่ง') && <button onClick={() => updateOrderStatus(selectedOrder.id, selectedOrder.delivery_type === 'รับเองที่ร้าน' ? 'รับอาหารแล้ว' : 'จัดส่งแล้ว')} className="flex-1 py-3 px-4 text-sm rounded-xl cursor-pointer font-bold transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 border-none bg-primary text-white hover:bg-primary-hover">{selectedOrder.delivery_type === 'รับเองที่ร้าน' ? 'รับอาหารแล้ว (เสร็จสิ้น)' : 'จัดส่งแล้ว (เสร็จสิ้น)'}</button>}

            {(selectedOrder.status === 'รอดำเนินการ' || selectedOrder.status === 'รับออเดอร์แล้ว') && (
              <button onClick={() => updateOrderStatus(selectedOrder.id, 'ยกเลิก')} className="flex-1 py-3 px-4 text-sm rounded-xl cursor-pointer font-bold transition-colors bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white">ยกเลิกออเดอร์</button>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
  );
}
