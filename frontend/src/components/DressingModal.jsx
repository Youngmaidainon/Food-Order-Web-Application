import React from 'react';

export default function DressingModal({ isOpen, onClose, dressings, onConfirm, selectedDressing, setSelectedDressing }) {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-end md:items-center z-[1000] transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div className={`bg-surface w-full max-w-[500px] rounded-t-2xl md:rounded-3xl p-5 md:p-8 transition-transform duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)] shadow-glass-md max-h-[90vh] overflow-y-auto ${isOpen ? 'translate-y-0 md:scale-100' : 'translate-y-full md:scale-95'}`}>
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-4 md:mb-6 md:hidden"></div>
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <span className="text-xl md:text-2xl font-bold text-text-main">เลือกน้ำสลัด (ฟรี 1 อย่าง)</span>
          <button className="bg-surface border border-border w-9 h-9 rounded-full text-2xl text-text-main flex items-center justify-center cursor-pointer transition-all hover:bg-background hover:text-red-500" onClick={onClose}>&times;</button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {dressings.map(d => (
            <div 
              key={d.id} 
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex items-center hover:border-slate-500 ${selectedDressing?.id === d.id ? 'border-secondary bg-secondary/5' : 'border-border'}`}
              onClick={() => { if (d.is_available !== false) setSelectedDressing(d) }}
              style={{ opacity: d.is_available === false ? 0.5 : 1, cursor: d.is_available === false ? 'not-allowed' : 'pointer' }}
            >
              <div className={`font-semibold ${selectedDressing?.id === d.id ? 'text-secondary' : 'text-text-main'}`}>
                {d.name} {d.is_available === false && <span className="text-sm text-red-500">(หมด)</span>}
              </div>
            </div>
          ))}
        </div>
        <button className="w-full bg-primary text-white border-none py-2 px-4 rounded-xl text-sm font-bold cursor-pointer transition-all shadow-[0_8px_20px_rgba(249,115,22,0.3)] hover:bg-primary-hover hover:-translate-y-0.5 mt-6" onClick={onConfirm}>
          <span>ยืนยันเพิ่มใส่ตะกร้า</span>
        </button>
      </div>
    </div>
  );
}
