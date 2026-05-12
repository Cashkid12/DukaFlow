import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, CheckCircle, AlertTriangle, XCircle,
  MoreVertical, Pencil, PackagePlus, Trash2, Copy, Eye,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const getStockBadge = (status) => {
  switch (status) {
    case 'in_stock':
      return {
        label: 'In Stock', icon: CheckCircle,
        bg: 'bg-[#D1FAE5]', text: 'text-[#10B981]', dot: 'bg-[#10B981]',
      };
    case 'low_stock':
      return {
        label: 'Low Stock', icon: AlertTriangle,
        bg: 'bg-[#FEF3C7]', text: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]',
      };
    case 'out_of_stock':
      return {
        label: 'Out of Stock', icon: XCircle,
        bg: 'bg-[#FEE2E2]', text: 'text-[#EF4444]', dot: 'bg-[#EF4444]',
      };
    default:
      return {
        label: 'In Stock', icon: CheckCircle,
        bg: 'bg-[#D1FAE5]', text: 'text-[#10B981]', dot: 'bg-[#10B981]',
      };
  }
};

const getStockBarColor = (product) => {
  const stock = product.stock ?? product.quantity ?? 0;
  const threshold = product.lowStockThreshold ?? 10;
  if (stock <= 0) return '#EF4444';
  if (stock <= threshold) return '#F59E0B';
  return '#10B981';
};

const ProductCard = ({
  product, onEdit, onRestock, onDuplicate, onDelete,
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const badge = getStockBadge(product.status);
  const stock = product.stock ?? product.quantity ?? 0;
  const threshold = product.lowStockThreshold ?? 10;
  const stockPercent = Math.min(100, Math.max(0, (stock / (threshold * 2)) * 100));
  const stockBarColor = getStockBarColor(product);
  const BadgeIcon = badge.icon;

  const attrs = [];
  if (product.attributes?.color) attrs.push(product.attributes.color);
  if (product.attributes?.size) attrs.push(`Size ${product.attributes.size}`);
  if (product.attributes?.brand) attrs.push(product.attributes.brand);
  if (product.attributes?.material) attrs.push(product.attributes.material);
  const visibleAttrs = attrs.slice(0, 3);

  const handleCardClick = (e) => {
    if (e.target.closest('button') || e.target.closest('[data-menu]')) return;
    navigate(`/inventory/${product._id}`);
  };

  const handleMenuAction = (action) => {
    setMenuOpen(false);
    switch (action) {
      case 'edit': onEdit?.(product); break;
      case 'restock': onRestock?.(product); break;
      case 'duplicate': onDuplicate?.(product); break;
      case 'delete': onDelete?.(product); break;
      case 'view': navigate(`/inventory/${product._id}`); break;
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
    >
      {/* Image Area */}
      <div className="relative h-40 sm:h-36 md:h-40 bg-neutral-100 flex items-center justify-center">
        {product.image || product.images?.[0] ? (
          <img
            src={product.image || product.images?.[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <Package size={48} className="text-neutral-300" />
        )}

        {/* Stock Badge — top-left */}
        <span className={`absolute top-2 left-2 inline-flex items-center gap-1 ${badge.bg} ${badge.text} text-[11px] font-semibold px-2.5 py-1 rounded-full`}>
          <BadgeIcon size={12} />
          {badge.label}
        </span>

        {/* Three-dot menu — top-right */}
        <div className="absolute top-2 right-2" data-menu>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center hover:bg-neutral-100 transition-colors"
            aria-label="Product actions"
          >
            <MoreVertical size={16} className="text-neutral-600" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-[180px] bg-white rounded-xl shadow-lg border border-neutral-100 p-2 z-50">
              <button onClick={() => handleMenuAction('edit')} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
                <Pencil size={16} />
                Edit
              </button>
              <button onClick={() => handleMenuAction('duplicate')} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
                <Copy size={16} />
                Duplicate
              </button>
              <button onClick={() => handleMenuAction('view')} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
                <Eye size={16} />
                View Details
              </button>
              <div className="border-t border-neutral-200 my-1" />
              <button onClick={() => handleMenuAction('delete')} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#EF4444] hover:bg-red-50 transition-colors">
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3.5 sm:p-3 md:p-3.5">
        {/* Name */}
        <h3 className="text-[15px] sm:text-[13px] md:text-[15px] font-semibold text-[#1E293B] mb-2 line-clamp-2 leading-snug">
          {product.name}
        </h3>

        {/* Attribute Pills */}
        {visibleAttrs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {visibleAttrs.map((attr, i) => (
              <span key={i} className="px-2 py-[3px] bg-neutral-100 text-neutral-600 text-[12px] rounded-md">
                {attr}
              </span>
            ))}
          </div>
        )}

        {/* Category */}
        <p className="text-[12px] text-[#64748B] mt-1.5">
          {product.category}
        </p>

        {/* Price Row */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-[13px] text-[#64748B]">
            Buy: {formatCurrency(product.costPrice || product.buyingPrice || 0)}
          </span>
          <span className="text-base sm:text-sm md:text-base font-bold text-[#312E81]">
            {formatCurrency(product.price || product.sellingPrice || 0)}
          </span>
        </div>

        {/* Stock Status Bar */}
        <div className="mt-2.5">
          <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${stockPercent}%`, backgroundColor: stockBarColor }}
            />
          </div>
          <p className="text-[11px] mt-1 font-medium" style={{ color: stockBarColor }}>
            {stock} in stock
          </p>
        </div>
      </div>

      {/* Quick Action Bar — hidden on mobile */}
      <div className="hidden sm:flex border-t border-neutral-100">
        <button
          onClick={(e) => { e.stopPropagation(); handleMenuAction('edit'); }}
          className="flex-1 flex items-center justify-center h-10 text-neutral-500 hover:text-[#312E81] hover:bg-neutral-50 transition-colors"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleMenuAction('restock'); }}
          className="flex-1 flex items-center justify-center h-10 text-neutral-500 hover:text-[#312E81] hover:bg-neutral-50 transition-colors border-x border-neutral-100"
        >
          <PackagePlus size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleMenuAction('delete'); }}
          className="flex-1 flex items-center justify-center h-10 text-neutral-500 hover:text-[#EF4444] hover:bg-red-50 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
