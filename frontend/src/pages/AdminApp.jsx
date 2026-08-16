import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import Login from './admin/Login';
import Dashboard from './admin/Dashboard';
import Orders from './admin/Orders';
import Menu from './admin/Menu';
import Dressings from './admin/Dressings';
import Settings from './admin/Settings';

// หน้าหลักฝั่งแอดมิน: จัดการ Routing และ Layout (Sidebar) สำหรับระบบหลังบ้าน
export default function AdminApp() {
  const { admin, isLoading, logout } = useAdmin();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  if (isLoading) return <div style={{display:'flex', justifyContent:'center', marginTop:'50px'}}>กำลังโหลด...</div>;

  if (!admin) {
    return <Login />;
  }

  const getNavLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary/15 text-primary shadow-[inset_4px_0_0_0_rgba(16,185,129,1)] font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`;
  };

  return (
    <div className="flex min-h-screen bg-bg-color text-text-main selection:bg-primary/30 selection:text-white">
      {/* ฉากหลังสีดำสำหรับเมนูด้านข้างบนมือถือ */}
      <div 
        className={`xl:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* เมนูด้านข้าง (Sidebar) */}
      <div className={`fixed h-screen left-0 top-0 transform -translate-x-full xl:relative xl:h-auto xl:translate-x-0 w-[280px] glass border-r border-white/5 p-6 flex flex-col transition-transform duration-300 z-[100] shadow-2xl xl:shadow-none ${isSidebarOpen ? 'translate-x-0' : ''}`}>
        <div className="flex flex-col mb-10 gap-4 mt-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-md rounded-full"></div>
              <img src="/logo.svg" alt="Logo" className="w-12 h-12 relative z-10" />
            </div>
            <div>
              <h2 className="text-xl text-white font-bold tracking-tight m-0">Admin Panel</h2>
              <p className="text-xs text-gray-400 m-0 mt-1">ระบบจัดการร้านสปริงโรล</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 flex-grow">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-2">Main Menu</div>
          <Link to="/admin" className={getNavLinkClass('/admin')} onClick={() => setIsSidebarOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            ภาพรวมร้าน
          </Link>
          <Link to="/admin/orders" className={getNavLinkClass('/admin/orders')} onClick={() => setIsSidebarOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            จัดการออเดอร์
          </Link>
          <Link to="/admin/menu" className={getNavLinkClass('/admin/menu')} onClick={() => setIsSidebarOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            จัดการเมนูอาหาร
          </Link>
          <Link to="/admin/dressings" className={getNavLinkClass('/admin/dressings')} onClick={() => setIsSidebarOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            จัดการน้ำสลัด
          </Link>
          
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-2 mt-6">Settings</div>
          <Link to="/admin/settings" className={getNavLinkClass('/admin/settings')} onClick={() => setIsSidebarOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            ตั้งค่าร้าน
          </Link>
        </div>

        <button 
          onClick={logout} 
          className="flex items-center justify-center gap-2 w-full mt-auto bg-transparent border border-red-500/50 text-red-400 py-3 rounded-xl cursor-pointer font-medium hover:bg-red-500/10 hover:border-red-500 hover:text-red-300 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          ออกจากระบบ
        </button>
      </div>

      {/* พื้นที่เนื้อหาหลัก */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto min-h-[calc(100vh-64px)]">
        <button className="xl:hidden bg-transparent border-none text-text-main text-2xl cursor-pointer p-2 mb-4 inline-flex items-center" onClick={() => setIsSidebarOpen(true)}>
          ☰
        </button>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/dressings" element={<Dressings />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}
