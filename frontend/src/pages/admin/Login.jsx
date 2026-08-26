import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';

// Admin login view
export default function Login() {
  const { login } = useAdmin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-4">
      <div className="bg-surface p-8 sm:p-10 rounded-2xl shadow-xl border border-border w-full max-w-[400px]">
        <h2 className="text-center mb-8 text-3xl font-bold">ระบบจัดการร้าน</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 font-semibold text-text-main">ชื่อผู้ใช้ (Username)</label>
            <input 
              type="text" 
              className="w-full p-3 border border-border rounded-xl bg-background text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 font-semibold text-text-main">รหัสผ่าน (Password)</label>
            <input 
              type="password" 
              className="w-full p-3 border border-border rounded-xl bg-background text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          {error && <div className="text-red-500 mb-4 text-sm font-medium">{error}</div>}
          <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <span>{isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
