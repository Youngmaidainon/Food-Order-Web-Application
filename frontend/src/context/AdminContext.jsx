import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { sendApiRequest } from '../api/api.js';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
