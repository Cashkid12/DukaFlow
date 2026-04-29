import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg max-w-sm animate-slide-in ${
            toast.type === 'success'
              ? 'bg-success-bg border-l-4 border-success'
              : toast.type === 'error'
              ? 'bg-danger-bg border-l-4 border-danger'
              : toast.type === 'warning'
              ? 'bg-warning-bg border-l-4 border-warning'
              : 'bg-info-bg border-l-4 border-info'
          }`}
        >
          {toast.type === 'success' && <CheckCircle size={20} className="text-success flex-shrink-0" />}
          {toast.type === 'error' && <XCircle size={20} className="text-danger flex-shrink-0" />}
          {toast.type === 'warning' && <AlertCircle size={20} className="text-warning flex-shrink-0" />}
          {toast.type === 'info' && <Info size={20} className="text-info flex-shrink-0" />}
          
          <p className="flex-1 text-sm text-neutral-900">{toast.message}</p>
          
          <button
            onClick={() => removeToast(toast.id)}
            className="text-neutral-500 hover:text-neutral-700 flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
