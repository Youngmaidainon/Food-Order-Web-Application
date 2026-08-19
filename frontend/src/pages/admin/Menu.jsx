import React, { useState, useEffect } from 'react';
import { sendApiRequest } from '../../api/api.js';
import { useAlert } from '../../context/AlertContext';

// หน้าสำหรับจัดการข้อมูลและสถานะการพร้อมให้บริการของเมนูอาหารทั้งหมด
export default function Menu() {
  const { showAlert, showConfirm } = useAlert();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', image_url: '', category_id: 1 });
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    fetchMenu();
    fetchCategories();
  }, []);

  // โหลดรายการหมวดหมู่เมนูอาหารทั้งหมด
  const fetchCategories = async () => {
    try {
      const res = await sendApiRequest('/admin/categories');
      if (res.success) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  // โหลดข้อมูลรายการอาหารทั้งหมดจาก API
  const fetchMenu = async () => {
    setIsLoading(true);
    try {
      const res = await sendApiRequest('/admin/menu');
      if (res.success) {
        setMenuItems(res.data);
      }
    } catch (err) {
      console.error('Failed to load menu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // สลับสถานะเปิด/ปิดรับออเดอร์สำหรับเมนูนั้นๆ
  const toggleAvailability = async (item) => {
    // อัปเดตหน้าจอทันทีเพื่อความรวดเร็ว (Optimistic Update)
    setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, is_available: !m.is_available } : m));

    try {
      const res = await sendApiRequest(`/admin/menu/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_available: !item.is_available })
      });
      if (!res.success) {
        fetchMenu();
      }
    } catch (err) {
      showAlert(err.message || 'อัปเดตสถานะไม่สำเร็จ');
      fetchMenu();
    }
  };

  // ลบข้อมูลเมนูอาหารออกจากระบบ (ต้องกดยืนยันก่อน)
  const deleteItem = async (id) => {
    const isConfirmed = await showConfirm('ยืนยันการลบเมนู?');
    if (!isConfirmed) return;
    
    // อัปเดตหน้าจอทันทีเพื่อความรวดเร็ว (Optimistic Update)
    setMenuItems(prev => prev.filter(m => m.id !== id));

    try {
      const res = await sendApiRequest(`/admin/menu/${id}`, { method: 'DELETE' });
      if (!res.success) fetchMenu();
    } catch (err) {
      showAlert(err.message || 'ลบเมนูไม่สำเร็จ');
      fetchMenu();
    }
  };

  const openEditModal = (item) => {
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: item.image_url,
      category_id: item.category_id || 1,
      is_available: item.is_available ?? true
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setFormData({ name: '', description: '', price: '', image_url: '', category_id: categories.length > 0 ? categories[0].id : 1, is_available: true });
    setEditingId(null);
    setIsModalOpen(true);
  };

  // บันทึกข้อมูลการเพิ่มหรือแก้ไขเมนูอาหารไปยังฐานข้อมูล
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `/admin/menu/${editingId}` : '/admin/menu';
      const method = editingId ? 'PUT' : 'POST';
      const res = await sendApiRequest(url, {
        method: method,
        body: JSON.stringify(formData)
      });
      if (res.success) {
        setIsModalOpen(false);
        setFormData({ name: '', description: '', price: '', image_url: '', category_id: categories.length > 0 ? categories[0].id : 1, is_available: true });
        setEditingId(null);
        fetchMenu();
        showAlert(editingId ? 'แก้ไขเมนูสำเร็จ' : 'เพิ่มเมนูสำเร็จ');
      }
    } catch (err) {
      showAlert(err.message || 'บันทึกเมนูไม่สำเร็จ');
    }
  };

  // ลบข้อมูลหมวดหมู่เมนูอาหารออกจากระบบ (ต้องกดยืนยันก่อน)
  const handleDeleteCategory = async (id) => {
    const isConfirmed = await showConfirm('ยืนยันการลบหมวดหมู่นี้?');
    if (!isConfirmed) return;

    try {
      const res = await sendApiRequest(`/admin/categories/${id}`, { method: 'DELETE' });
      if (res.success) {
        setCategories(prev => prev.filter(cat => cat.id !== id));
        if (formData.category_id === id) {
          const remaining = categories.filter(cat => cat.id !== id);
          setFormData(prev => ({ ...prev, category_id: remaining.length > 0 ? remaining[0].id : 1 }));
        }
        showAlert('ลบหมวดหมู่สำเร็จ');
        fetchMenu();
      }
    } catch (err) {
      showAlert(err.message || 'ลบหมวดหมู่ไม่สำเร็จ');
    }
  };

  // เพิ่มหมวดหมู่เมนูอาหารใหม่
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName || newCategoryName.trim() === '') return;

    try {
      const res = await sendApiRequest('/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryName.trim() })
      });
      if (res.success) {
        const newCategory = res.data;
        setCategories(prev => [...prev, newCategory]);
        setFormData(prev => ({ ...prev, category_id: newCategory.id }));
        showAlert('เพิ่มหมวดหมู่สำเร็จ');
        setNewCategoryName('');
      }
    } catch (err) {
      showAlert(err.message || 'เพิ่มหมวดหมู่ไม่สำเร็จ');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight m-0">จัดการเมนู</h1>
          <p className="text-gray-400 mt-2 text-sm">เพิ่ม ลบ หรือแก้ไขรายการอาหารในร้าน</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsCategoryModalOpen(true)} className="flex items-center gap-2 py-2.5 px-4 text-sm bg-white/5 border border-white/10 text-white rounded-xl cursor-pointer font-semibold hover:bg-white/10 transition-all hover:-translate-y-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
            จัดการหมวดหมู่
          </button>
          <button onClick={openAddModal} className="flex items-center gap-2 py-2.5 px-5 text-sm bg-primary text-white border-none rounded-xl cursor-pointer font-bold hover:bg-primary-hover transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:-translate-y-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            เพิ่มเมนูใหม่
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-gray-500">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <div>กำลังโหลดข้อมูลเมนู...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-black/40 text-gray-400 text-sm tracking-wider uppercase border-b border-white/10">
                <th className="p-5 font-semibold w-24 text-center">รูป</th>
                <th className="p-5 font-semibold min-w-[300px] text-center">ชื่อเมนู</th>
                <th className="p-5 font-semibold min-w-[150px] whitespace-nowrap text-center">หมวดหมู่</th>
                <th className="p-5 font-semibold min-w-[150px] whitespace-nowrap text-center">ราคา</th>
                <th className="p-5 font-semibold min-w-[200px] whitespace-nowrap text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-16 text-center text-gray-500 flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    ยังไม่มีเมนูในระบบ
                  </td>
                </tr>
              ) : (
                menuItems.map(item => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="p-5 text-4xl text-center">
                      <div className="w-16 h-16 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
                        {item.image_url}
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <div className="font-bold text-white text-lg">{item.name}</div>
                      <div className="text-sm text-gray-400 mt-1 line-clamp-1 max-w-xs mx-auto">{item.description}</div>
                    </td>
                    <td className="p-5 text-gray-300 font-medium text-center">
                      <span className="bg-white/10 px-3 py-1 rounded-full text-xs">{item.category_name}</span>
                    </td>
                    <td className="p-5 text-center">
                      <div className="font-bold text-primary text-lg">{parseInt(item.price, 10)} ฿</div>
                      {!item.is_available && <span className="inline-block mt-1 text-xs text-red-400 bg-red-400/10 border border-red-400/20 py-0.5 px-2 rounded-full">หมดชั่วคราว</span>}
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex gap-2 justify-center whitespace-nowrap">
                        <button onClick={() => toggleAvailability(item)} className={`p-2 rounded-xl border transition-all ${item.is_available ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500 hover:text-white' : 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500 hover:text-white'}`} title={item.is_available ? "ปิดรับออเดอร์เมนูนี้" : "เปิดรับออเดอร์"}>
                          {item.is_available ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"/><path d="M12 2v20"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </button>
                        <button onClick={() => openEditModal(item)} className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl cursor-pointer hover:bg-blue-500 hover:text-white transition-all shadow-sm" title="แก้ไข">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl cursor-pointer hover:bg-red-500 hover:text-white transition-all shadow-sm" title="ลบ">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 animate-in fade-in duration-200">
          <div className="glass-card p-8 rounded-3xl w-full max-w-[500px] shadow-2xl max-h-[90vh] overflow-y-auto border border-white/10 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h2 className="text-2xl font-bold mb-6 text-white">{editingId ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="block mb-2 font-semibold text-gray-300 text-sm">หมวดหมู่</label>
                <div className="flex gap-2">
                  <select className="flex-1 p-3.5 border border-white/10 rounded-xl bg-black/40 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" value={formData.category_id} onChange={e => setFormData({...formData, category_id: parseInt(e.target.value)})} required>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id} className="bg-[#18181b]">{cat.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setIsCategoryModalOpen(true)} title="จัดการหมวดหมู่" className="px-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 font-medium whitespace-nowrap transition-colors flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                </div>
              </div>
              <div className="mb-5">
                <label className="block mb-2 font-semibold text-gray-300 text-sm">ชื่อเมนู</label>
                <input type="text" className="w-full p-3.5 border border-white/10 rounded-xl bg-black/40 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="mb-5">
                <label className="block mb-2 font-semibold text-gray-300 text-sm">คำอธิบาย</label>
                <input type="text" className="w-full p-3.5 border border-white/10 rounded-xl bg-black/40 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block mb-2 font-semibold text-gray-300 text-sm">ราคา (บาท)</label>
                  <input type="number" min="0" max="9999999" step="1" className="w-full p-3.5 border border-white/10 rounded-xl bg-black/40 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-mono" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value.replace(/[^0-9]/g, '').slice(0, 7)})} onKeyDown={e => { if (e.key === '.') e.preventDefault(); }} />
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-gray-300 text-sm">รูปภาพ (Emoji)</label>
                  <input type="text" className="w-full p-3.5 border border-white/10 rounded-xl bg-black/40 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-center text-xl" required value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
                </div>
              </div>
              <div className="mb-8 p-4 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setFormData({...formData, is_available: !formData.is_available})}>
                <div>
                  <div className="font-semibold text-white">สถานะพร้อมขาย</div>
                  <div className="text-sm text-gray-400">เปิดรับออเดอร์สำหรับเมนูนี้หรือไม่</div>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.is_available ? 'bg-primary' : 'bg-gray-600'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.is_available ? 'left-7' : 'left-1'}`}></div>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 px-5 text-sm bg-white/5 text-white border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors font-semibold">ยกเลิก</button>
                <button type="submit" className="flex-1 py-3.5 px-5 text-sm bg-primary text-white border-none rounded-xl cursor-pointer hover:bg-primary-hover transition-colors font-bold shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:-translate-y-0.5">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-[1100] p-4 animate-in fade-in duration-200">
          <div className="glass-card p-6 rounded-2xl w-full max-w-[440px] shadow-2xl border border-white/10 relative max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white m-0">จัดการหมวดหมู่</h2>
              <button 
                onClick={() => { setIsCategoryModalOpen(false); setNewCategoryName(''); }} 
                className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-1.5 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">หมวดหมู่ทั้งหมด ({categories.length})</label>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {categories.length === 0 ? (
                  <div className="text-gray-500 text-sm text-center py-4">ยังไม่มีหมวดหมู่</div>
                ) : (
                  categories.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <span className="text-sm font-medium text-white">{cat.name}</span>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteCategory(cat.id)} 
                        className="p-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                        title="ลบหมวดหมู่"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <hr className="border-white/10 mb-4" />

            <h3 className="text-sm font-semibold text-gray-300 mb-2">เพิ่มหมวดหมู่ใหม่</h3>
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 p-2.5 text-sm border border-white/10 rounded-xl bg-black/40 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                required 
                value={newCategoryName} 
                onChange={e => setNewCategoryName(e.target.value)} 
                placeholder="ชื่อหมวดหมู่..." 
              />
              <button 
                type="submit" 
                className="py-2.5 px-4 text-sm bg-primary text-white border-none rounded-xl cursor-pointer hover:bg-primary-hover transition-colors font-bold whitespace-nowrap shadow-sm"
              >
                เพิ่ม
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
