import React from 'react';

// Salad dressing selection modal before cart insertion
export default function DressingModal({ isOpen, onClose, dressings, onConfirm, selectedDressing, setSelectedDressing }) {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-end sm:items-center z-[1000] p-0 sm:p-4 transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div className={`bg-[#131317] border border-white/10 w-full max-w-[440px] rounded-t-2xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300 shadow-2xl max-h-[85vh] flex flex-col ${isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-full sm:scale-95'}`}>
        
        {/* Mobile Drag Indicator */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-2.5 sm:hidden cursor-pointer" onClick={onClose}></div>
        
        <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">เลือกน้ำสลัด</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold border border-primary/30">
              ฟรี 1 อย่าง
            </span>
          </div>
          <button className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center text-xs cursor-pointer transition-colors" onClick={onClose}>✕</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-0.5 custom-scrollbar">
          {dressings.map(d => {
            const isSelected = selectedDressing?.id === d.id;
            const isAvailable = d.is_available !== false;

            return (
              <div 
                key={d.id} 
                className={`p-2.5 sm:p-3 border rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                  isSelected 
                    ? 'border-primary bg-primary/15 shadow-sm' 
                    : isAvailable 
                      ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]' 
                      : 'border-white/5 bg-black/20 opacity-40 cursor-not-allowed'
                }`}
                onClick={() => { if (isAvailable) setSelectedDressing(d); }}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    isSelected ? 'border-primary bg-primary' : 'border-white/30'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black"></div>}
                  </div>
                  <span className={`text-xs sm:text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {d.name}
                  </span>
                </div>

                {!isAvailable && (
                  <span className="text-[10px] text-red-400 font-semibold px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                    หมด
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-white/10 mt-2.5 flex-shrink-0">
          <button 
            className="w-full bg-primary text-white py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-all hover:bg-primary-hover active:scale-98 shadow-md" 
            onClick={onConfirm}
          >
            <span>ยืนยันเพิ่มใส่ตะกร้า</span>
          </button>
        </div>

      </div>
    </div>
  );
}

