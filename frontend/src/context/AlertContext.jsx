import React, { createContext, useContext, useState, useCallback } from 'react';

const AlertContext = createContext();

// Provider สำหรับจัดการ Modal Alert แบบ Custom ทั่วทั้งระบบ (Global Modal State)
export function AlertProvider({ children }) {
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    message: '',
    type: 'alert', // 'alert', 'confirm', 'prompt'
    onConfirm: null,
    onCancel: null,
  });
  
  const [promptValue, setPromptValue] = useState('');

  // แสดง Modal แจ้งเตือนแบบพื้นฐาน
  const showAlert = useCallback((message) => {
    setAlertConfig({
      isOpen: true,
      message,
      type: 'alert',
      onConfirm: () => closeAlert(),
      onCancel: null
    });
  }, []);

  // แสดง Modal ยืนยันการทำรายการ (คืนค่าเป็น Promise)
  const showConfirm = useCallback((message) => {
    return new Promise((resolve) => {
      setAlertConfig({
        isOpen: true,
        message,
        type: 'confirm',
        onConfirm: () => {
          closeAlert();
          resolve(true);
        },
        onCancel: () => {
          closeAlert();
          resolve(false);
        }
      });
    });
  }, []);

  // แสดง Modal รับค่าข้อมูลจากผู้ใช้ (มีช่อง Input)
  const showPrompt = useCallback((message, defaultValue = '') => {
    setPromptValue(defaultValue);
    return new Promise((resolve) => {
      setAlertConfig({
        isOpen: true,
        message,
        type: 'prompt',
        onConfirm: (val) => {
          closeAlert();
          resolve(val);
        },
        onCancel: () => {
          closeAlert();
          resolve(null);
        }
      });
    });
  }, []);

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleConfirmClick = () => {
    if (alertConfig.type === 'prompt') {
      alertConfig.onConfirm(promptValue);
    } else {
      alertConfig.onConfirm();
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-[9999] transition-all duration-300 ${alertConfig.isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className={`bg-surface w-full max-w-[400px] rounded-t-2xl md:rounded-2xl p-8 transform transition-transform duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] shadow-2xl max-h-[90vh] overflow-y-auto text-center ${alertConfig.isOpen ? 'translate-y-0 md:scale-100' : 'translate-y-full md:translate-y-0 md:scale-95'}`}>
          <div className="py-5">
            <p className="text-lg mb-6 font-medium text-text-main">{alertConfig.message}</p>
            
            {alertConfig.type === 'prompt' && (
              <input
                type="text"
                autoFocus
                className="w-full p-3 mb-6 border border-border rounded-xl text-base bg-background text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-center"
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmClick();
                }}
              />
            )}

            <div className="flex gap-3 justify-center">
              {(alertConfig.type === 'confirm' || alertConfig.type === 'prompt') && (
                <button 
                  onClick={alertConfig.onCancel}
                  className="py-2.5 px-6 rounded-xl border border-border bg-transparent text-text-main font-semibold cursor-pointer hover:bg-background transition-colors"
                >
                  ยกเลิก
                </button>
              )}
              <button 
                onClick={handleConfirmClick}
                className="py-2.5 px-6 rounded-xl border-none bg-primary text-white font-semibold cursor-pointer min-w-[100px] shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:bg-primary-hover hover:-translate-y-0.5 transition-all"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      </div>
    </AlertContext.Provider>
  );
}

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
