import React, { useState, useEffect } from 'react';
import { X, Package, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

/**
 * Restock Modal Component
 * Quick restock action with optional price update
 */
const RestockModal = ({ product, onClose, onConfirm }) => {
  const [quantity, setQuantity] = useState('');
  const [newBuyingPrice, setNewBuyingPrice] = useState('');
  const [updateSellingPrice, setUpdateSellingPrice] = useState(false);
  const [suggestedSellingPrice, setSuggestedSellingPrice] = useState(null);

  const currentStock = product?.stock || 0;
  const currentBuyingPrice = product?.costPrice || 0;
  const currentSellingPrice = product?.price || 0;
  const newStock = currentStock + (parseInt(quantity) || 0);

  // Calculate suggested selling price when buying price changes
  useEffect(() => {
    if (newBuyingPrice && currentBuyingPrice > 0 && currentSellingPrice > 0) {
      // Calculate current margin
      const currentMargin = (currentSellingPrice - currentBuyingPrice) / currentBuyingPrice;
      // Apply same margin to new buying price
      const suggested = Math.round(newBuyingPrice * (1 + currentMargin));
      setSuggestedSellingPrice(suggested);
    } else {
      setSuggestedSellingPrice(null);
    }
  }, [newBuyingPrice, currentBuyingPrice, currentSellingPrice]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!quantity || parseInt(quantity) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    onConfirm({
      productId: product._id,
      quantity: parseInt(quantity),
      newBuyingPrice: newBuyingPrice ? parseFloat(newBuyingPrice) : null,
      newSellingPrice: updateSellingPrice && suggestedSellingPrice ? suggestedSellingPrice : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Restock Product</h2>
              <p className="text-sm text-neutral-600">{product?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-neutral-600" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Stock */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Current Stock:</span>{' '}
              <span className="font-semibold">{currentStock} units</span>
            </p>
          </div>

          {/* Quantity to Add */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              Quantity to Add <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#312E81] focus:border-transparent text-lg font-medium number-font"
              placeholder="Enter quantity"
              autoFocus
            />
            {quantity && parseInt(quantity) > 0 && (
              <p className="mt-2 text-sm text-neutral-600">
                New stock will be: <span className="font-semibold text-green-600 number-font">{newStock} units</span>
              </p>
            )}
          </div>

          {/* New Buying Price (Optional) */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              New Buying Price <span className="text-neutral-500 font-normal">(Optional)</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newBuyingPrice}
              onChange={(e) => setNewBuyingPrice(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#312E81] focus:border-transparent number-font"
              placeholder={formatCurrency(currentBuyingPrice)}
            />
            {currentBuyingPrice > 0 && (
              <p className="mt-1 text-xs text-neutral-500">
                Previous: {formatCurrency(currentBuyingPrice)}
              </p>
            )}
          </div>

          {/* Update Selling Price Checkbox */}
          {newBuyingPrice && suggestedSellingPrice && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateSellingPrice}
                  onChange={(e) => setUpdateSellingPrice(e.target.checked)}
                  className="mt-1 w-4 h-4 text-[#312E81] border-neutral-300 rounded focus:ring-[#312E81]"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">
                    Update selling price to maintain margin
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">
                    Suggested: <span className="font-semibold text-amber-700 number-font">{formatCurrency(suggestedSellingPrice)}</span>
                    {' '}(currently {formatCurrency(currentSellingPrice)})
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-neutral-200"></div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!quantity || parseInt(quantity) <= 0}
              className="flex-1 px-4 py-3 bg-[#312E81] text-white rounded-lg hover:bg-[#1E1B4B] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Restock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestockModal;
