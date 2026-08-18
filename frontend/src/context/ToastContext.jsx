import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

// Provider สำหรับแสดง Popup แจ้งเตือนมุมขวาบน (Global Toast Notification)
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // แสดง Toast แจ้งเตือน และตั้งเวลาให้หายไปอัตโนมัติภายใน 3 วินาที (ปิดเสียงแจ้งเตือนแล้ว)
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random(); // ป้องกันรหัสซ้ำกัน
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[10000] flex flex-col gap-3">
        {toasts.map(toast => {
          let bgClass = 'bg-primary';
          if (toast.type === 'success') bgClass = 'bg-secondary';
          if (toast.type === 'error') bgClass = 'bg-red-500';
          if (toast.type === 'info') bgClass = 'bg-blue-500';

          return (
            <div key={toast.id} className={`py-3.5 px-5 rounded-lg text-white flex items-center justify-between gap-4 min-w-[250px] shadow-[0_4px_12px_rgba(0,0,0,0.3)] font-semibold animate-slide-in-right ${bgClass}`}>
              <span>{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="bg-transparent border-none text-white text-2xl cursor-pointer p-0 leading-none opacity-80 hover:opacity-100 transition-opacity">&times;</button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
