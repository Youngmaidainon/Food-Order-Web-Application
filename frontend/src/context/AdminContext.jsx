import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { sendApiRequest } from '../api/api.js';

const AdminContext = createContext(null);

// Provider จัดการสถานะการเข้าสู่ระบบของผู้ดูแลระบบ (Admin Auth State)
export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // ตรวจสอบสิทธิ์และดึงข้อมูลแอดมินจากเซิร์ฟเวอร์
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await sendApiRequest('/admin/me');
      if (res.success) {
        setAdmin(res.admin);
      } else {
        setAdmin(null);
      }
    } catch (err) {
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ส่งข้อมูลล็อกอินและรีเฟรชสถานะเมื่อสำเร็จ
  const login = async (username, password) => {
    const res = await sendApiRequest('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (res.success) {
      await checkAuth();
    }
    return res;
  };

  // ลบ Session ออกจากระบบและล้างสถานะแอดมินฝั่ง Client
  const logout = async () => {
    try {
      await sendApiRequest('/admin/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    setAdmin(null);
  };

  return (
    <AdminContext.Provider value={{ admin, isLoading, login, logout, checkAuth }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
