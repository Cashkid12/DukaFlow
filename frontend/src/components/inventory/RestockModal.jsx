import React, { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { getStockBadge } from '../../utils/stockBadge';
import Spinner from '../common/Spinner';

// ── Shared sub-components (module-level, stable identity) ──

const ProductInfoRow = ({ product, badge, currentStock }) => (
  <div className="bg-neutral-50 rounded-xl p-3 sm:p-4 w-full">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
        <Package size={20} className="text-neutral-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-900 truncate">{product?.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs sm:text-sm text-neutral-500">
            Current: {currentStock} units
          </p>
          <span className="text-neutral-300">|</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            <span className={`text-xs font-medium ${badge.text}`}>{badge.label}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const QuantityInput = ({ quantity, setQuantity, compact, newStock }) => (
  <div>
    <label className={`block ${compact ? 'text-sm mb-1.5' : 'text-sm mb-2'} font-medium text-neutral-900`}>
      Quantity to Add <span className="text-red-500">*</span>
    </label>
    <input
      type="number"
      min="1"
      value={quantity}
      onChange={(e) => setQuantity(e.target.value)}
      className="w-full h-12 px-4 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent text-lg font-medium outline-none text-center"
      placeholder="Enter quantity"
      autoFocus
    />
    {quantity && parseInt(quantity) > 0 && (
      <p className={`mt-2 text-[13px] text-neutral-500 ${compact ? 'text-center' : ''}`}>
        New stock: <span className="font-semibold text-green-600">{newStock} units</span>
      </p>
    )}
  </div>
);

const BuyingPriceInput = ({ newBuyingPrice, setNewBuyingPrice, currentBuyingPrice, compact }) => (
  <div>
    <label className={`block ${compact ? 'text-sm mb-1.5' : 'text-sm mb-2'} font-medium text-neutral-900`}>
      New Buying Price <span className="text-neutral-400 font-normal">(Optional)</span>
    </label>
    <input
      type="number"
      min="0"
      step="0.01"
      value={newBuyingPrice}
      onChange={(e) => setNewBuyingPrice(e.target.value)}
      className={`w-full ${compact ? 'py-2.5' : 'py-3'} px-4 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent outline-none`}
      placeholder={currentBuyingPrice > 0 ? formatCurrency(currentBuyingPrice) : '0'}
    />
    {currentBuyingPrice > 0 && (
      <p className={`mt-1 text-[12px] text-neutral-500 ${compact ? 'text-center' : ''}`}>
        Previous: {formatCurrency(currentBuyingPrice)}
      </p>
    )}
  </div>
);

// ── Main component ──────────────────────────────────────────

/**
 * Restock Modal — Beautiful, responsive restock flow.
 *
 * Mobile:  Bottom sheet with drag handle, slides up from bottom
 * Desktop: Centered card, max-w-[440px], scale-in animation
 *
 * Mobile excludes the margin-update checkbox for cleaner UX.
 */
const RestockModal = ({ product, onClose, onConfirm, loading }) => {
  const [quantity, setQuantity] = useState('');
  const [newBuyingPrice, setNewBuyingPrice] = useState('');
  const [updateSellingPrice, setUpdateSellingPrice] = useState(false);
  const [suggestedSellingPrice, setSuggestedSellingPrice] = useState(null);

  const currentStock = product?.stock ?? 0;
  const currentBuyingPrice = product?.costPrice ?? 0;
  const currentSellingPrice = product?.price ?? 0;
  const newStock = currentStock + (parseInt(quantity) || 0);
  const badge = getStockBadge(product?.status);

  // Calculate suggested selling price when buying price changes
  useEffect(() => {
    if (newBuyingPrice && currentBuyingPrice > 0 && currentSellingPrice > 0) {
      const currentMargin = (currentSellingPrice - currentBuyingPrice) / currentBuyingPrice;
      const suggested = Math.round(newBuyingPrice * (1 + currentMargin));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestedSellingPrice(suggested);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestedSellingPrice(null);
    }
  }, [newBuyingPrice, currentBuyingPrice, currentSellingPrice]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!quantity || parseInt(quantity) <= 0) {
      return;
    }

    onConfirm({
      productId: product._id,
      quantity: parseInt(quantity),
      newCostPrice: newBuyingPrice ? parseFloat(newBuyingPrice) : null,
      newSellingPrice: updateSellingPrice && suggestedSellingPrice ? suggestedSellingPrice : null,
    });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 animate-fade-in" />

      {/* ── Mobile: Bottom Sheet ──────────────────────────── */}
      <form
        className="relative bg-white rounded-t-3xl sm:hidden w-full shadow-2xl p-6 animate-[slideUp_0.25s_ease-out] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        {/* Drag Handle */}
        <div className="w-9 h-1 bg-neutral-300 rounded-full mx-auto mb-4" />

        {/* Title */}
        <h2 className="text-lg font-bold text-neutral-900 mb-4">
          Restock Product
        </h2>

        {/* Product Info */}
        <div className="mb-5">
          <ProductInfoRow product={product} badge={badge} currentStock={currentStock} />
        </div>

        {/* Quantity */}
        <div className="mb-5">
          <QuantityInput
            quantity={quantity}
            setQuantity={setQuantity}
            compact
            newStock={newStock}
          />
        </div>

        {/* New Buying Price */}
        <div className="mb-6">
          <BuyingPriceInput
            newBuyingPrice={newBuyingPrice}
            setNewBuyingPrice={setNewBuyingPrice}
            currentBuyingPrice={currentBuyingPrice}
            compact
          />
        </div>

        {/* Actions */}
        <button
          type="submit"
          disabled={!quantity || parseInt(quantity) <= 0 || loading}
          className="w-full h-11 bg-[#312E81] text-white font-semibold rounded-xl hover:bg-[#1E1B4B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <Spinner />
              Restocking...
            </>
          ) : (
            'Confirm Restock'
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="w-full h-10 border border-neutral-300 text-neutral-700 font-medium rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50 text-sm mt-2"
        >
          Cancel
        </button>
      </form>

      {/* ── Desktop: Centered Card ────────────────────────── */}
      <form
        className="relative bg-white rounded-3xl shadow-2xl w-[90%] max-w-[400px] md:max-w-[440px] mx-auto p-6 md:p-8 animate-[scaleIn_0.2s_ease-out] max-h-[90vh] overflow-y-auto hidden sm:block"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X size={18} className="text-neutral-400" />
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold text-neutral-900 mb-5">
          Restock Product
        </h2>

        {/* Product Info */}
        <div className="mb-5">
          <ProductInfoRow product={product} badge={badge} currentStock={currentStock} />
        </div>

        {/* Quantity */}
        <div className="mb-5">
          <QuantityInput
            quantity={quantity}
            setQuantity={setQuantity}
            newStock={newStock}
          />
        </div>

        {/* New Buying Price */}
        <div className="mb-5">
          <BuyingPriceInput
            newBuyingPrice={newBuyingPrice}
            setNewBuyingPrice={setNewBuyingPrice}
            currentBuyingPrice={currentBuyingPrice}
          />
        </div>

        {/* Margin Update Checkbox (desktop only) */}
        {newBuyingPrice && suggestedSellingPrice && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={updateSellingPrice}
                onChange={(e) => setUpdateSellingPrice(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-[#312E81] border-neutral-300 rounded focus:ring-[#312E81]"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">
                  Update selling price to maintain margin
                </p>
                <p className="text-[13px] text-neutral-500 mt-1">
                  Suggested: <span className="font-semibold">{formatCurrency(suggestedSellingPrice)}</span> (currently {formatCurrency(currentSellingPrice)})
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Actions */}
        <button
          type="submit"
          disabled={!quantity || parseInt(quantity) <= 0 || loading}
          className="w-full h-11 bg-[#312E81] text-white font-semibold rounded-xl hover:bg-[#1E1B4B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <Spinner />
              Restocking...
            </>
          ) : (
            'Confirm Restock'
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="w-full h-10 border border-neutral-300 text-neutral-700 font-medium rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50 text-sm mt-2"
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default RestockModal;
