import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [message, type, onClose]);

  const bgClass = 
    type === 'success' 
      ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_8px_32px_rgba(16,185,129,0.3)]'
      : type === 'error' 
      ? 'bg-red-600 border-red-500 text-white shadow-[0_8px_32px_rgba(239,68,68,0.3)]'
      : 'bg-purple-600 border-purple-500 text-white shadow-[0_8px_32px_rgba(147,51,234,0.3)]';

  const icon = 
    type === 'success' ? '✅'
    : type === 'error' ? '❌'
    : '✦';

  return (
    <div className={`fixed bottom-6 right-6 z-[99999] px-5 py-3.5 rounded-xl border backdrop-blur-md flex items-center gap-3 font-bold text-xs select-none transition-all duration-300 transform translate-y-0 animate-slide-up ${bgClass}`}>
      <span className="text-sm select-none">{icon}</span>
      <span className="select-text tracking-wide">{message}</span>
    </div>
  );
}

