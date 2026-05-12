import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const DeleteConfirmModal = ({ product, onClose, onConfirm }) => {
  if (!product) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle size={24} className="text-[#EF4444]" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-[#1E293B] text-center mb-2">
          Delete {product.name}?
        </h2>

        {/* Warning */}
        <p className="text-sm text-[#64748B] text-center mb-6 px-4">
          This action cannot be undone. This product and its history will be permanently deleted.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-[#CBD5E1] text-[#64748B] rounded-xl hover:bg-neutral-50 transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(product)}
            className="flex-1 px-4 py-3 bg-[#EF4444] text-white rounded-xl hover:bg-red-600 transition-colors font-medium text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
