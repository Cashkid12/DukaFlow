import React from 'react';
import { X } from 'lucide-react';

export const Drawer = ({ isOpen, onClose, title, children, width = 'md' }) => {
  if (!isOpen) return null;

  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-[480px]',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative ${widths[width]} w-full bg-white shadow-xl h-full overflow-y-auto`}>
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 sticky top-0 bg-white z-10">
          <h3 className="text-xl font-semibold text-neutral-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-500"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
