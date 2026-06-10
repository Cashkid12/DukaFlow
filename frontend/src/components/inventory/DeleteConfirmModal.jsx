import React from 'react';
import { X, Trash2, Package } from 'lucide-react';
import Spinner from '../common/Spinner';

/**
 * DeleteConfirmModal — Beautiful, responsive delete confirmation.
 *
 * Mobile:  Bottom sheet with drag handle, slides up from bottom
 * Tablet:  Centered card, max-w-[400px], p-6
 * Desktop: Centered card, max-w-[440px], p-8
 */
const DeleteConfirmModal = ({ product, onClose, onConfirm, loading }) => {
  if (!product) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const stock = product.stock ?? product.quantity ?? 0;
  const sku = product.sku || 'N/A';
  const category = product.category || '—';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 animate-fade-in" />

      {/* ── Mobile: Bottom Sheet ──────────────────────────── */}
      <div
        className="relative bg-white rounded-t-3xl sm:hidden w-full shadow-2xl p-6 animate-[slideUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="w-9 h-1 bg-neutral-300 rounded-full mx-auto mb-4" />

        {/* Icon Circle — 56px mobile */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-[#FEE2E2] flex items-center justify-center">
            <Trash2 size={32} className="text-[#EF4444]" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-neutral-900 text-center mb-3">
          Delete This Product?
        </h2>

        {/* Product Info Card */}
        <div className="bg-neutral-50 rounded-xl p-3 mb-3 w-full">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
              <Package size={20} className="text-neutral-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate">{product.name}</p>
              <p className="text-xs text-neutral-500">SKU: {sku}</p>
              <p className="text-xs text-neutral-500">Category: {category}</p>
              <p className="text-xs text-neutral-500">Current Stock: {stock} unit{stock !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Warning */}
        <p className="text-[13px] text-neutral-500 text-center mb-5">
          ⚠️  This cannot be undone. This product will be permanently deleted.
        </p>

        {/* Actions */}
        <button
          onClick={() => onConfirm(product)}
          disabled={loading}
          className="w-full h-11 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <Spinner />
              Deleting...
            </>
          ) : (
            'Yes, Delete Product'
          )}
        </button>
        <button
          onClick={onClose}
          disabled={loading}
          className="w-full h-10 border border-neutral-300 text-neutral-700 font-medium rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50 text-sm mt-2"
        >
          Cancel
        </button>
      </div>

      {/* ── Tablet/Desktop: Centered Card ──────────────────── */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-[90%] max-w-[400px] md:max-w-[440px] mx-auto p-6 md:p-8 animate-[scaleIn_0.2s_ease-out] hidden sm:block"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X size={18} className="text-neutral-400" />
        </button>

        {/* Icon Circle — 64px desktop */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-[#FEE2E2] flex items-center justify-center">
            <Trash2 size={36} className="text-[#EF4444]" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-neutral-900 text-center mb-4">
          Delete This Product?
        </h2>

        {/* Product Info Card */}
        <div className="bg-neutral-50 rounded-xl p-4 mb-4 w-full">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
              <Package size={20} className="text-neutral-400" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-neutral-900 truncate">{product.name}</p>
              <p className="text-sm text-neutral-500">SKU: {sku}</p>
              <p className="text-sm text-neutral-500">Category: {category}</p>
              <p className="text-sm text-neutral-500">Current Stock: {stock} unit{stock !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="text-center mb-6">
          <p className="text-[13px] text-neutral-500">⚠️  This action cannot be undone.</p>
          <p className="text-[13px] text-neutral-500">This product and all its history will be permanently deleted.</p>
        </div>

        {/* Actions */}
        <button
          onClick={() => onConfirm(product)}
          disabled={loading}
          className="w-full h-11 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <Spinner />
              Deleting...
            </>
          ) : (
            'Yes, Delete Product'
          )}
        </button>
        <button
          onClick={onClose}
          disabled={loading}
          className="w-full h-10 border border-neutral-300 text-neutral-700 font-medium rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50 text-sm mt-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
