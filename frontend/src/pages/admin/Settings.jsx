import React, { useState, useEffect } from 'react';
import { sendApiRequest } from '../../api/api.js';
import { useAlert } from '../../context/AlertContext';

// หน้าสำหรับตั้งค่าข้อมูลทั่วไปของร้าน เช่น ชื่อร้าน และสถานะเปิด/ปิด
export default function Settings() {
  const { showAlert, showConfirm } = useAlert();
  const [storeStatus, setStoreStatus] = useState(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [originalIsOpen, setOriginalIsOpen] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  // โหลดข้อมูลการตั้งค่าปัจจุบันของร้าน
  const fetchSettings = async () => {
    try {
      const res = await sendApiRequest('/store/status');
      if (res.success) {
        setStoreStatus(res.data);
        setOriginalIsOpen(res.data.is_open);
        setRestaurantName(res.data.restaurant_name);
        setAnnouncement(res.data.announcement_message);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  // บันทึกการตั้งค่าใหม่ไปยังเซิร์ฟเวอร์
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!storeStatus) return;

    if (storeStatus.is_open === false && originalIsOpen === true) {
      const isConfirmed = await showConfirm('ยืนยันการปิดร้านและบันทึกการตั้งค่า? ข้อมูลออเดอร์ทั้งหมดจะถูกลบ คิวจะถูกรีเซ็ต และจะส่งรายงานสรุปยอดไปยัง Discord ทันที');
      if (!isConfirmed) return;
    }

    setIsSaving(true);
    const formData = {
      is_open: storeStatus.is_open,
      restaurant_name: restaurantName,
      announcement_message: announcement
    };
    try {
      const res = await sendApiRequest('/admin/store/status', {
        method: 'PATCH',
        body: JSON.stringify(formData)
      });
      if (res.success) {
        showAlert('บันทึกการตั้งค่าสำเร็จ');
        setOriginalIsOpen(storeStatus.is_open);
      }
    } catch (err) {
      showAlert(err.message || 'บันทึกการตั้งค่าไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };



  if (!storeStatus) return <div className="text-center p-10 text-text-muted">กำลังโหลดการตั้งค่า...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight m-0">การตั้งค่าร้าน</h1>
        <p className="text-gray-400 mt-2 text-sm">จัดการข้อมูลร้านและตั้งค่าระบบต่างๆ</p>
      </div>
      
      <div className="glass-card rounded-3xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          ข้อมูลทั่วไป
        </h2>
        
        <form onSubmit={handleSaveSettings} className="relative z-10">
          <div className="space-y-6">
            <div>
              <label className="block mb-2 font-semibold text-gray-300 text-sm">ชื่อร้าน</label>
              <input 
                type="text" 
                className="w-full p-4 border border-white/10 rounded-xl bg-black/40 backdrop-blur-md text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-inner" 
                value={restaurantName}
                onChange={e => setRestaurantName(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block mb-2 font-semibold text-gray-300 text-sm">ข้อความประกาศ (แสดงที่แถบด้านบน)</label>
              <input 
                type="text" 
                className="w-full p-4 border border-white/10 rounded-xl bg-black/40 backdrop-blur-md text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-inner" 
                value={announcement}
                onChange={e => setAnnouncement(e.target.value)}
                placeholder="เช่น ยินดีต้อนรับสู่ร้านของเรา! วันนี้มีเมนูพิเศษ..."
              />
            </div>
            
            <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-between mt-8 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setStoreStatus({...storeStatus, is_open: !storeStatus.is_open})}>
              <div className="pr-4">
                <div className="font-bold text-white mb-1 flex items-center gap-2">
                  สถานะร้าน (เปิดรับออเดอร์)
                  {storeStatus.is_open ? 
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span> : 
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  }
                </div>
                <div className="text-sm text-gray-400">ถ้าปิดร้าน คิวจะถูกรีเซ็ตและส่งรายงานยอดขายไปยัง Discord ทันที</div>
              </div>
              <div className={`w-14 h-7 rounded-full relative transition-colors duration-300 ease-in-out shrink-0 ${storeStatus.is_open ? 'bg-primary' : 'bg-gray-600'}`}>
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform duration-300 ease-in-out shadow-sm ${storeStatus.is_open ? 'left-8' : 'left-1'}`}></div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex justify-end">
            <button 
              type="submit" 
              disabled={isSaving}
              className="py-3 px-8 bg-blue-500 text-white border-none rounded-xl cursor-pointer font-bold hover:bg-blue-600 transition-all shadow-[0_4px_15px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  บันทึกการตั้งค่า
                </>
              )}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
