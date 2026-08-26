import React, { useState, useEffect } from 'react';
import { sendApiRequest } from '../../api/api.js';
import { useAlert } from '../../context/AlertContext';

// Admin salad dressings management
export default function Dressings() {
  const { showAlert, showConfirm } = useAlert();
  const [dressings, setDressings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', is_available: true });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchDressings();
  }, []);

  // Fetch all dressings
  const fetchDressings = async () => {
    setIsLoading(true);
    try {
      const res = await sendApiRequest('/admin/dressings');
      if (res.success) {
        setDressings(res.data);
      }
    } catch (err) {
      console.error('Failed to load dressings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle dressing availability
  const toggleAvailability = async (item) => {
    // Optimistic update
    setDressings(prev => prev.map(d => d.id === item.id ? { ...d, is_available: !d.is_available } : d));

    try {
      const res = await sendApiRequest(`/admin/dressings/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...item, is_available: !item.is_available })
      });
      if (!res.success) {
        fetchDressings();
      }
    } catch (err) {
      showAlert(err.message || 'อัปเดตสถานะไม่สำเร็จ');
      fetchDressings();
    }
  };

  // Delete dressing
  const deleteItem = async (id) => {
    const isConfirmed = await showConfirm('ยืนยันการลบน้ำสลัด?');
    if (!isConfirmed) return;
    
    // Optimistic update
    setDressings(prev => prev.filter(d => d.id !== id));

    try {
      const res = await sendApiRequest(`/admin/dressings/${id}`, { method: 'DELETE' });
      if (!res.success) {
        fetchDressings();
      }
    } catch (err) {
      showAlert(err.message || 'ลบน้ำสลัดไม่สำเร็จ');
      fetchDressings();
    }
  };

  // Save create/edit dressing
  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = editingId ? `/admin/dressings/${editingId}` : '/admin/dressings';
    const method = editingId ? 'PUT' : 'POST';
    const payload = formData;
    try {
      const res = await sendApiRequest(endpoint, {
        method,
        body: JSON.stringify(payload)
      });
      if (res.success) {
        setIsModalOpen(false);
        fetchDressings();
      }
    } catch (err) {
      showAlert(err.message || 'บันทึกน้ำสลัดไม่สำเร็จ');
    }
  };

  const openAddModal = () => {
    setFormData({ name: '', is_available: true });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setFormData({ name: item.name, is_available: item.is_available });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', is_available: true });
    setEditingId(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">จัดการน้ำสลัด</h1>
        <button onClick={openAddModal} className="py-2 px-4 text-sm bg-secondary text-white border-none rounded-xl cursor-pointer font-bold hover:bg-secondary-hover transition-colors shadow-sm">
          + เพิ่มน้ำสลัดใหม่
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-text-muted">กำลังโหลดข้อมูล...</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-background text-text-muted border-b border-border">
                <th className="p-4 font-semibold min-w-[150px] whitespace-nowrap text-center">รหัสน้ำสลัด (ID)</th>
                <th className="p-4 font-semibold min-w-[250px] text-center">ชื่อน้ำสลัด</th>
                <th className="p-4 font-semibold min-w-[200px] whitespace-nowrap text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {dressings.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-10 text-center text-text-muted">ยังไม่มีข้อมูลน้ำสลัด</td>
                </tr>
              ) : (
                dressings.map(item => (
                  <tr key={item.id} className="border-b border-border hover:bg-white/5 transition-colors">
                    <td className="p-4 text-text-muted text-center">#{item.id}</td>
                    <td className="p-4 font-bold text-center">
                      <div className="flex items-center justify-center gap-2">
                        {item.name}
                        {item.id !== 0 && !item.is_available && <span className="text-xs text-red-500 border border-red-500 py-0.5 px-1.5 rounded">ปิดใช้งาน</span>}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {item.id !== 0 && (
                        <div className="flex gap-2 justify-center whitespace-nowrap">
                          <button onClick={() => openEditModal(item)} className="py-1 px-3 text-sm bg-transparent text-blue-500 border border-blue-500 rounded-lg cursor-pointer hover:bg-blue-500/10 transition-colors font-medium">แก้ไข</button>
                          <button onClick={() => deleteItem(item.id)} className="py-1 px-3 text-sm bg-transparent text-red-500 border border-red-500 rounded-lg cursor-pointer hover:bg-red-500/10 transition-colors font-medium">ลบ</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[1000] p-4">
          <div className="bg-surface p-8 rounded-2xl w-full max-w-[400px] shadow-xl max-h-[90vh] overflow-y-auto border border-border">
            <h2 className="text-2xl font-bold mb-6">
              {editingId ? 'แก้ไขน้ำสลัด' : 'เพิ่มน้ำสลัดใหม่'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-2 font-semibold text-text-main">ชื่อน้ำสลัด</label>
                <input type="text" className="w-full p-3 border border-border rounded-xl bg-background text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="mb-6 flex items-center gap-2">
                <input type="checkbox" id="is_available" checked={formData.is_available} onChange={e => setFormData({...formData, is_available: e.target.checked})} className="w-4 h-4 cursor-pointer accent-primary" />
                <label htmlFor="is_available" className="m-0 cursor-pointer font-medium select-none">เปิดใช้งานน้ำสลัดนี้</label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="py-2.5 px-5 text-sm bg-transparent text-text-main border border-border rounded-xl cursor-pointer hover:bg-background transition-colors font-semibold">ยกเลิก</button>
                <button type="submit" className="py-2.5 px-5 text-sm bg-secondary text-white border-none rounded-xl cursor-pointer hover:bg-secondary-hover transition-colors font-semibold">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
