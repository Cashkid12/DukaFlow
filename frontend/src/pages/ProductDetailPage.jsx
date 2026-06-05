import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Package, Camera, Clock, TrendingUp,
  AlertTriangle, Copy, Trash2, CheckCircle, XCircle,
  Loader2, X, ChevronDown, Plus, Image, PackagePlus,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import {
  useProductDetail,
  usePriceHistory,
  useStockHistory,
  useUpdateProduct,
  useDeleteProduct,
  useRestockProduct,
  useUploadImage,
} from '../hooks/useProductDetail';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import RestockModal from '../components/inventory/RestockModal';
import DeleteConfirmModal from '../components/inventory/DeleteConfirmModal';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'priceHistory', label: 'Price History' },
  { key: 'stockHistory', label: 'Stock History' },
  { key: 'variants', label: 'Variants' },
  { key: 'batches', label: 'Batches' },
];

// ── Helpers ────────────────────────────────────────────
const getStatusBadge = (status, stock) => {
  switch (status) {
    case 'in_stock':
      return {
        bg: 'bg-[#D1FAE5]', text: 'text-[#10B981]',
        label: `${stock} in stock`, icon: CheckCircle,
      };
    case 'low_stock':
      return {
        bg: 'bg-[#FEF3C7]', text: 'text-[#F59E0B]',
        label: `${stock} left`, icon: AlertTriangle,
      };
    default:
      return {
        bg: 'bg-[#FEE2E2]', text: 'text-[#EF4444]',
        label: 'Out of stock', icon: XCircle,
      };
  }
};

const getStockBarColor = (status) => {
  if (status === 'in_stock') return 'bg-[#10B981]';
  if (status === 'low_stock') return 'bg-[#F59E0B]';
  return 'bg-[#EF4444]';
};

const getProfitColor = (margin) => {
  if (margin >= 20) return 'text-[#10B981]';
  if (margin >= 10) return 'text-[#F59E0B]';
  return 'text-[#EF4444]';
};

const getStockTypeStyle = (type) => {
  switch (type) {
    case 'added':
    case 'restock':
      return { bg: 'bg-[#D1FAE5]', text: 'text-[#10B981]', sign: '+' };
    case 'sold':
      return { bg: 'bg-[#DBEAFE]', text: 'text-[#3B82F6]', sign: '-' };
    case 'adjusted':
      return { bg: 'bg-[#FEF3C7]', text: 'text-[#F59E0B]', sign: '±' };
    case 'returned':
      return { bg: 'bg-purple-100', text: 'text-purple-700', sign: '+' };
    default:
      return { bg: 'bg-neutral-100', text: 'text-neutral-600', sign: '' };
  }
};

// ── Skeleton Loader ────────────────────────────────────
const DetailSkeleton = () => (
  <div className="w-full max-w-full overflow-hidden animate-pulse space-y-6">
    <div className="h-4 w-32 bg-neutral-200 rounded" />
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-[60%] space-y-4">
        <div className="h-80 bg-neutral-200 rounded-2xl" />
        <div className="h-6 w-48 bg-neutral-200 rounded" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 bg-neutral-200 rounded" />
              <div className="h-4 w-24 bg-neutral-200 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="lg:w-[40%] space-y-4">
        <div className="bg-white rounded-2xl p-5 space-y-3 border border-neutral-200">
          <div className="h-5 w-20 bg-neutral-200 rounded" />
          <div className="h-4 w-full bg-neutral-200 rounded" />
          <div className="h-6 w-32 bg-neutral-200 rounded" />
          <div className="h-2 w-full bg-neutral-200 rounded" />
        </div>
        <div className="bg-white rounded-2xl p-5 space-y-3 border border-neutral-200">
          <div className="h-5 w-16 bg-neutral-200 rounded" />
          <div className="h-8 w-24 bg-neutral-200 rounded" />
          <div className="h-3 w-full bg-neutral-200 rounded" />
        </div>
        <div className="bg-white rounded-2xl p-5 space-y-3 border border-neutral-200">
          <div className="h-10 w-full bg-neutral-200 rounded-xl" />
          <div className="h-10 w-full bg-neutral-200 rounded-xl" />
          <div className="h-10 w-full bg-neutral-200 rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

// ── Error State ────────────────────────────────────────
const DetailError = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-[#FEE2E2] flex items-center justify-center mb-4">
      <AlertTriangle size={32} className="text-[#EF4444]" />
    </div>
    <h2 className="text-xl font-bold text-[#1E293B] mb-2">Failed to Load Product</h2>
    <p className="text-sm text-[#64748B] max-w-md mb-6">
      {error?.message || 'Unable to load product details. Please check your connection and try again.'}
    </p>
    <button
      onClick={onRetry}
      className="px-6 py-3 bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] transition-colors font-medium"
    >
      Try Again
    </button>
  </div>
);

// ── Not Found ──────────────────────────────────────────
const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
        <Package size={32} className="text-neutral-400" />
      </div>
      <h2 className="text-xl font-bold text-[#1E293B] mb-2">Product Not Found</h2>
      <p className="text-sm text-[#64748B] mb-6">
        This product may have been deleted or doesn't exist.
      </p>
      <button
        onClick={() => navigate('/dashboard/inventory')}
        className="px-6 py-3 bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] transition-colors font-medium"
      >
        Back to Inventory
      </button>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────
const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  // Data
  const queryClient = useQueryClient();
  const { data: product, isLoading, isError, error, refetch } = useProductDetail(productId);
  const { data: priceHistory = [] } = usePriceHistory(productId);
  const { data: stockHistory = [] } = useStockHistory(productId);

  // Mutations
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const restockProduct = useRestockProduct();
  const uploadImage = useUploadImage();

  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Edit form state
  const [form, setForm] = useState({});

  // Initialize form when product loads
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        category: product.category || '',
        buyingPrice: product.costPrice ?? '',
        sellingPrice: product.price ?? '',
        quantity: product.stock ?? 0,
        lowStockThreshold: product.lowStockThreshold ?? 10,
        supplier: product.supplier || '',
        description: product.description || '',
        notes: product.notes || '',
        sku: product.sku || '',
        size: product.attributes?.size || '',
        color: product.attributes?.color || '',
        material: product.attributes?.material || '',
        brand: product.attributes?.brand || '',
        form: product.attributes?.form || '',
        strength: product.attributes?.strength || '',
        unit: product.attributes?.unit || '',
        condition: product.attributes?.condition || '',
        model: product.attributes?.model || '',
      });
    }
  }, [product]);

  // Real-time socket updates for this product
  const socketRef = useRef(null);
  useEffect(() => {
    if (!productId) return;

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('product:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId, 'priceHistory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    socket.on('stock:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId, 'stockHistory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    socket.on('sale:completed', () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId, 'stockHistory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    return () => {
      if (socket.connected) socket.disconnect();
    };
  }, [productId, queryClient]);

  // ── Handlers ───────────────────────────────────────
  const handleEditSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setEditError('');
    try {
      await updateProduct({
        productId,
        data: {
          name: form.name,
          category: form.category,
          costPrice: Number(form.buyingPrice),
          price: Number(form.sellingPrice),
          stock: Number(form.quantity),
          lowStockThreshold: Number(form.lowStockThreshold),
          supplier: form.supplier,
          description: form.description,
          notes: form.notes,
          sku: form.sku,
          attributes: {
            size: form.size,
            color: form.color,
            material: form.material,
            brand: form.brand,
            form: form.form,
            strength: form.strength,
            unit: form.unit,
            condition: form.condition,
            model: form.model,
          },
        },
      });
      setEditMode(false);
    } catch (err) {
      setEditError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (prod) => {
    try {
      await deleteProduct(prod._id);
      navigate('/dashboard/inventory');
    } catch {
      alert('Failed to delete product');
    }
  };

  const handleRestock = async (data) => {
    try {
      await restockProduct({
        productId,
        quantity: data.quantity,
        newCostPrice: data.newBuyingPrice,
        newSellingPrice: data.newSellingPrice,
        supplier: form.supplier || '',
      });
      setShowRestock(false);
    } catch (err) {
      alert(err.message || 'Failed to restock');
    }
  };

  const handleDuplicate = async () => {
    // Navigate to add-product page with pre-filled data from query params
    const params = new URLSearchParams({
      name: `${product.name} (Copy)`,
      category: product.category || '',
      buyingPrice: product.costPrice || '',
      sellingPrice: product.price || '',
      supplier: product.supplier || '',
    });
    navigate(`/dashboard/inventory/add?${params.toString()}`);
  };

  const handleImageUpload = () => {
    const url = prompt('Enter image URL:');
    if (url?.trim()) {
      uploadImage({ productId, imageUrl: url.trim() });
    }
  };

  // ── Render States ──────────────────────────────────
  if (isLoading) return <DetailSkeleton />;
  if (isError) {
    if (error?.message === 'Product not found') return <NotFound />;
    return <DetailError error={error} onRetry={() => refetch()} />;
  }
  if (!product) return <NotFound />;

  // ── Computed Values ───────────────────────────────
  const statusInfo = getStatusBadge(product.status, product.stock);
  const StatusIcon = statusInfo.icon;
  const profit = (product.price || 0) - (product.costPrice || 0);
  const profitMargin = product.price > 0
    ? ((profit / product.price) * 100).toFixed(1)
    : 0;
  const allImages = product.images?.length
    ? product.images
    : product.image ? [product.image] : [];
  const currentImage = allImages[selectedImage] || null;
  const stockPercent = product.lowStockThreshold > 0
    ? Math.min(100, (product.stock / (product.lowStockThreshold * 2)) * 100)
    : 50;
  const hasAttributes = product.attributes && Object.keys(product.attributes).filter(
    k => product.attributes[k]
  ).length > 0;
  const hasVariants = product.variants?.length > 0;
  const hasBatches = product.batches?.length > 0;

  // ── EDIT MODE ──────────────────────────────────────
  if (editMode) {
    return (
      <div className="w-full max-w-full overflow-hidden space-y-6">
        {/* Back + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setEditMode(false)}
            className="flex items-center gap-1 text-sm text-[#64748B] hover:text-[#312E81] transition-colors py-2"
          >
            <ArrowLeft size={16} />
            <span>Cancel Edit</span>
          </button>
          <h1 className="text-xl font-bold text-[#1E293B]">Edit {product.name}</h1>
        </div>

        {editError && (
          <div className="bg-[#FEE2E2] border border-[#EF4444] text-[#EF4444] px-4 py-3 rounded-xl text-sm">
            {editError}
          </div>
        )}

        <form onSubmit={handleEditSave} className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-base font-semibold text-[#1E293B] mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Product Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Category *</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">SKU</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full px-4 py-3 border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Supplier</label>
                <input
                  type="text"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  className="w-full px-4 py-3 border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="border-t border-neutral-200 pt-5">
            <h3 className="text-base font-semibold text-[#1E293B] mb-4">Pricing & Stock</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Buying Price (KSh)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.buyingPrice}
                  onChange={(e) => setForm({ ...form, buyingPrice: e.target.value })}
                  className="w-full px-4 py-3 border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent text-sm number-font"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Selling Price (KSh) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.sellingPrice}
                  onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent text-sm number-font"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Current Stock</label>
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full px-4 py-3 border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent text-sm number-font"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Low Stock Alert</label>
                <input
                  type="number"
                  min="0"
                  value={form.lowStockThreshold}
                  onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                  className="w-full px-4 py-3 border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Attributes */}
          <div className="border-t border-neutral-200 pt-5">
            <h3 className="text-base font-semibold text-[#1E293B] mb-4">Attributes</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Size</label>
                <input type="text" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Color</label>
                <input type="text" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Material</label>
                <input type="text" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Brand</label>
                <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Form</label>
                <input type="text" value={form.form} onChange={(e) => setForm({ ...form, form: e.target.value })} className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Unit</label>
                <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent text-sm" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-neutral-200 pt-5">
            <h3 className="text-base font-semibold text-[#1E293B] mb-4">Additional Info</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Description</label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Notes</label>
                <textarea
                  rows="3"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-neutral-200 pt-5 flex gap-3">
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="flex-1 px-4 py-3 border border-[#CBD5E1] text-[#64748B] rounded-xl hover:bg-neutral-50 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.name || !form.category}
              className="flex-1 px-4 py-3 bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" /> Saving...
                </span>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── VIEW MODE ──────────────────────────────────────
  return (
    <div className="w-full max-w-full overflow-hidden space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/dashboard/inventory')}
        className="flex items-center gap-1 text-sm text-[#64748B] hover:text-[#312E81] transition-colors py-2"
      >
        <ArrowLeft size={16} />
        <span>Back to Inventory</span>
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl lg:text-[28px] font-bold text-[#1E293B] truncate">
              {product.name}
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.text}`}>
              <StatusIcon size={14} />
              {statusInfo.label}
            </span>
          </div>
          {product.sku && (
            <p className="text-[13px] text-[#64748B]">SKU: {product.sku}</p>
          )}
        </div>
        <button
          onClick={() => setEditMode(true)}
          className="flex items-center gap-2 px-4 py-2.5 border border-[#CBD5E1] text-[#64748B] rounded-xl hover:bg-neutral-50 transition-colors text-sm font-medium whitespace-nowrap"
        >
          <Pencil size={16} />
          <span>Edit Product</span>
        </button>
      </div>

      {/* Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column (60%) */}
        <div className="lg:w-[60%] space-y-6">
          {/* Image Gallery */}
          <div className="space-y-3">
            <div className="w-full h-64 sm:h-80 lg:h-[400px] bg-neutral-100 rounded-2xl overflow-hidden flex items-center justify-center relative">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package size={64} className="text-neutral-300" />
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-none">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-[60px] h-[60px] rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                      i === selectedImage ? 'border-[#312E81]' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleImageUpload}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#CBD5E1] text-[#64748B] rounded-xl hover:bg-neutral-50 transition-colors text-sm font-medium"
            >
              <Camera size={16} />
              <span>Change Image</span>
            </button>
          </div>

          {/* Product Attributes */}
          {hasAttributes && (
            <div>
              <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Product Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(product.attributes).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <div key={key}>
                      <p className="text-[13px] text-[#64748B] uppercase tracking-wide">{key}</p>
                      <p className="text-[15px] font-medium text-[#1E293B] mt-0.5">{String(value)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Category */}
          <div>
            <p className="text-[13px] text-[#64748B] mb-1">Category</p>
            <span className="inline-block px-4 py-1.5 bg-neutral-100 text-[#334155] rounded-full text-sm font-medium">
              {product.category}
            </span>
          </div>

          {/* Notes */}
          {product.notes && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
              <p className="text-[13px] text-[#64748B] mb-1">Notes</p>
              <p className="text-sm text-[#64748B] italic">{product.notes}</p>
            </div>
          )}

          {/* Meta Info */}
          <div className="text-xs text-[#64748B] space-y-1">
            {product.createdBy?.fullName && (
              <p>Added by {product.createdBy.fullName}</p>
            )}
            <p>Created {formatDateTime(product.createdAt)}</p>
            <p>Last updated {formatDateTime(product.updatedAt)}</p>
          </div>
        </div>

        {/* Right Column (40%) */}
        <div className="lg:w-[40%] space-y-4">
          {/* Pricing Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
            <h3 className="text-base font-semibold text-[#1E293B]">Pricing</h3>

            <div className="flex justify-between items-center">
              <span className="text-sm text-[#64748B]">Buying Price</span>
              <span className="text-lg font-semibold text-[#1E293B] number-font">
                {formatCurrency(product.costPrice)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#64748B]">Selling Price</span>
              <span className="text-[22px] font-bold text-[#312E81] number-font">
                {formatCurrency(product.price)}
              </span>
            </div>

            {/* Profit */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#64748B]">Profit Margin</span>
              <span className={`text-sm font-semibold number-font ${getProfitColor(Number(profitMargin))}`}>
                {formatCurrency(profit)} ({profitMargin}%)
              </span>
            </div>

            {/* Profit Bar */}
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  Number(profitMargin) >= 20
                    ? 'bg-[#10B981]'
                    : Number(profitMargin) >= 10
                    ? 'bg-[#F59E0B]'
                    : 'bg-[#EF4444]'
                }`}
                style={{ width: `${Math.min(100, Number(profitMargin) * 2)}%` }}
              />
            </div>

            {/* Price History Link */}
            <button
              onClick={() => setActiveTab('priceHistory')}
              className="text-[13px] text-[#312E81] hover:underline font-medium"
            >
              View price history →
            </button>
          </div>

          {/* Stock Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
            <h3 className="text-base font-semibold text-[#1E293B]">Stock</h3>

            <div>
              <span className={`text-2xl font-bold number-font ${statusInfo.text}`}>
                {product.stock} units
              </span>
            </div>

            <p className="text-sm text-[#64748B]">
              Alert below {product.lowStockThreshold || 10} units
            </p>

            {/* Stock Bar */}
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getStockBarColor(product.status)}`}
                style={{ width: `${stockPercent}%` }}
              />
            </div>

            {/* Last Restock */}
            {stockHistory.length > 0 && (
              <p className="text-[13px] text-[#64748B]">
                Last restock: {formatDateTime(stockHistory[0].createdAt)}
              </p>
            )}

            {/* Restock Button */}
            <button
              onClick={() => setShowRestock(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] transition-colors font-medium text-sm"
            >
              <PackagePlus size={18} />
              <span>Restock</span>
            </button>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-2">
            <h3 className="text-base font-semibold text-[#1E293B] mb-2">Quick Actions</h3>
            <button
              onClick={() => setEditMode(true)}
              className="w-full flex items-center gap-3 px-4 py-3 border border-[#CBD5E1] text-[#64748B] rounded-xl hover:bg-neutral-50 transition-colors text-sm font-medium"
            >
              <Pencil size={16} />
              <span>Edit Product</span>
            </button>
            <button
              onClick={handleDuplicate}
              className="w-full flex items-center gap-3 px-4 py-3 border border-[#CBD5E1] text-[#64748B] rounded-xl hover:bg-neutral-50 transition-colors text-sm font-medium"
            >
              <Copy size={16} />
              <span>Duplicate Product</span>
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="w-full flex items-center gap-3 px-4 py-3 border border-[#FEE2E2] text-[#EF4444] rounded-xl hover:bg-[#FEE2E2] transition-colors text-sm font-medium"
            >
              <Trash2 size={16} />
              <span>Delete Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── TABS ─────────────────────────────────────── */}
      <div className="border-b border-neutral-200 mt-2">
        <div className="flex gap-0 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            // Conditionally show variants/batches tabs
            if (tab.key === 'variants' && !hasVariants) return null;
            if (tab.key === 'batches' && !hasBatches) return null;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap border-b-[3px] transition-all ${
                  activeTab === tab.key
                    ? 'border-[#312E81] text-[#312E81]'
                    : 'border-transparent text-[#64748B] hover:text-[#334155]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pb-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {product.description && (
              <div>
                <h4 className="text-sm font-medium text-[#64748B] mb-2">Description</h4>
                <p className="text-[15px] text-[#1E293B]">{product.description}</p>
              </div>
            )}
            {product.supplier && (
              <div>
                <h4 className="text-sm font-medium text-[#64748B] mb-1">Supplier</h4>
                <p className="text-[15px] text-[#1E293B]">{product.supplier}</p>
              </div>
            )}
          </div>
        )}

        {/* Price History Tab */}
        {activeTab === 'priceHistory' && (
          <div>
            {priceHistory.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Clock size={40} className="text-neutral-300 mb-3" />
                <p className="text-sm text-[#64748B]">No price changes yet</p>
              </div>
            ) : (
              <div className="table-wrapper overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-3 text-[13px] font-medium text-[#64748B]">Date</th>
                      <th className="text-left py-3 px-3 text-[13px] font-medium text-[#64748B]">Changed By</th>
                      <th className="text-right py-3 px-3 text-[13px] font-medium text-[#64748B]">Old Buying</th>
                      <th className="text-right py-3 px-3 text-[13px] font-medium text-[#64748B]">New Buying</th>
                      <th className="text-right py-3 px-3 text-[13px] font-medium text-[#64748B]">Old Selling</th>
                      <th className="text-right py-3 px-3 text-[13px] font-medium text-[#64748B]">New Selling</th>
                      <th className="text-left py-3 px-3 text-[13px] font-medium text-[#64748B]">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceHistory.map((entry) => (
                      <tr key={entry._id} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="py-3 px-3 text-[13px] text-[#64748B] whitespace-nowrap">
                          {formatDateTime(entry.createdAt)}
                        </td>
                        <td className="py-3 px-3 text-[13px] text-[#334155]">
                          {entry.changedBy?.fullName || '—'}
                        </td>
                        <td className="py-3 px-3 text-[13px] text-[#64748B] text-right number-font">
                          {entry.oldCostPrice != null ? formatCurrency(entry.oldCostPrice) : '—'}
                        </td>
                        <td className="py-3 px-3 text-sm font-medium text-[#1E293B] text-right number-font">
                          {entry.newCostPrice != null ? formatCurrency(entry.newCostPrice) : '—'}
                        </td>
                        <td className="py-3 px-3 text-[13px] text-[#64748B] text-right number-font">
                          {entry.oldSellingPrice != null ? formatCurrency(entry.oldSellingPrice) : '—'}
                        </td>
                        <td className="py-3 px-3 text-sm font-medium text-[#1E293B] text-right number-font">
                          {entry.newSellingPrice != null ? formatCurrency(entry.newSellingPrice) : '—'}
                        </td>
                        <td className="py-3 px-3 text-[13px] text-[#64748B]">
                          {entry.reason || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Stock History Tab */}
        {activeTab === 'stockHistory' && (
          <div>
            {stockHistory.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Package size={40} className="text-neutral-300 mb-3" />
                <p className="text-sm text-[#64748B]">No stock history yet</p>
              </div>
            ) : (
              <div className="table-wrapper overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-3 text-[13px] font-medium text-[#64748B]">Date</th>
                      <th className="text-left py-3 px-3 text-[13px] font-medium text-[#64748B]">Type</th>
                      <th className="text-right py-3 px-3 text-[13px] font-medium text-[#64748B]">Change</th>
                      <th className="text-right py-3 px-3 text-[13px] font-medium text-[#64748B]">New Total</th>
                      <th className="text-left py-3 px-3 text-[13px] font-medium text-[#64748B]">Reference</th>
                      <th className="text-left py-3 px-3 text-[13px] font-medium text-[#64748B]">By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockHistory.map((entry) => {
                      const style = getStockTypeStyle(entry.type);
                      return (
                        <tr key={entry._id} className="border-b border-neutral-100 hover:bg-neutral-50">
                          <td className="py-3 px-3 text-[13px] text-[#64748B] whitespace-nowrap">
                            {formatDateTime(entry.createdAt)}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                              {entry.type}
                            </span>
                          </td>
                          <td className={`py-3 px-3 text-sm font-medium text-right number-font ${
                            entry.quantity >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                          }`}>
                            {entry.quantity >= 0 ? '+' : ''}{entry.quantity}
                          </td>
                          <td className="py-3 px-3 text-sm font-medium text-[#1E293B] text-right number-font">
                            {entry.newStock} units
                          </td>
                          <td className="py-3 px-3 text-[13px] text-[#64748B] max-w-[160px] truncate">
                            {entry.reference || '—'}
                          </td>
                          <td className="py-3 px-3 text-[13px] text-[#334155] whitespace-nowrap">
                            {entry.performedBy?.fullName || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Variants Tab */}
        {activeTab === 'variants' && (
          <div>
            {!hasVariants ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Package size={40} className="text-neutral-300 mb-3" />
                <p className="text-sm text-[#64748B] max-w-xs">
                  This product has no variants. Add sizes, colors, or other variations.
                </p>
                <button className="mt-4 flex items-center gap-2 px-4 py-2.5 border border-[#CBD5E1] text-[#64748B] rounded-xl hover:bg-neutral-50 transition-colors text-sm font-medium">
                  <Plus size={16} />
                  <span>Add Variant</span>
                </button>
              </div>
            ) : (
              <div>
                <div className="flex justify-end mb-3">
                  <button className="flex items-center gap-2 px-4 py-2.5 border border-[#CBD5E1] text-[#64748B] rounded-xl hover:bg-neutral-50 transition-colors text-sm font-medium">
                    <Plus size={16} />
                    <span>Add Variant</span>
                  </button>
                </div>
                <div className="table-wrapper overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-3 px-3 text-[13px] font-medium text-[#64748B]">Name</th>
                        <th className="text-left py-3 px-3 text-[13px] font-medium text-[#64748B]">SKU</th>
                        <th className="text-right py-3 px-3 text-[13px] font-medium text-[#64748B]">Qty</th>
                        <th className="text-right py-3 px-3 text-[13px] font-medium text-[#64748B]">Buying</th>
                        <th className="text-right py-3 px-3 text-[13px] font-medium text-[#64748B]">Selling</th>
                        <th className="text-left py-3 px-3 text-[13px] font-medium text-[#64748B]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((v, i) => {
                        const vStatus = v.quantity <= 0 ? 'out_of_stock' : v.quantity <= (product.lowStockThreshold || 10) ? 'low_stock' : 'in_stock';
                        const vBadge = getStatusBadge(vStatus, v.quantity);
                        const VIcon = vBadge.icon;
                        return (
                          <tr key={v.sku || i} className="border-b border-neutral-100 hover:bg-neutral-50">
                            <td className="py-3 px-3 text-sm font-medium text-[#1E293B]">{v.name || '—'}</td>
                            <td className="py-3 px-3 text-[13px] text-[#64748B] font-mono">{v.sku || '—'}</td>
                            <td className="py-3 px-3 text-sm text-[#1E293B] text-right number-font">{v.quantity || 0}</td>
                            <td className="py-3 px-3 text-[13px] text-[#64748B] text-right number-font">{formatCurrency(v.buyingPrice)}</td>
                            <td className="py-3 px-3 text-[13px] text-[#64748B] text-right number-font">{formatCurrency(v.sellingPrice)}</td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${vBadge.bg} ${vBadge.text}`}>
                                <VIcon size={12} />
                                {vBadge.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Batches Tab */}
        {activeTab === 'batches' && (
          <div>
            {!hasBatches ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Package size={40} className="text-neutral-300 mb-3" />
                <p className="text-sm text-[#64748B] max-w-xs">
                  No batches yet. Track batch numbers and expiry dates here.
                </p>
                <button className="mt-4 flex items-center gap-2 px-4 py-2.5 border border-[#CBD5E1] text-[#64748B] rounded-xl hover:bg-neutral-50 transition-colors text-sm font-medium">
                  <Plus size={16} />
                  <span>Receive Batch</span>
                </button>
              </div>
            ) : (
              <div>
                <div className="flex justify-end mb-3">
                  <button className="flex items-center gap-2 px-4 py-2.5 border border-[#CBD5E1] text-[#64748B] rounded-xl hover:bg-neutral-50 transition-colors text-sm font-medium">
                    <Plus size={16} />
                    <span>Receive Batch</span>
                  </button>
                </div>
                <div className="table-wrapper overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-3 px-3 text-[13px] font-medium text-[#64748B]">Batch #</th>
                        <th className="text-left py-3 px-3 text-[13px] font-medium text-[#64748B]">Received</th>
                        <th className="text-right py-3 px-3 text-[13px] font-medium text-[#64748B]">Initial</th>
                        <th className="text-right py-3 px-3 text-[13px] font-medium text-[#64748B]">Remaining</th>
                        <th className="text-left py-3 px-3 text-[13px] font-medium text-[#64748B]">Expiry</th>
                        <th className="text-left py-3 px-3 text-[13px] font-medium text-[#64748B]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.batches.map((b, i) => {
                        const now = new Date();
                        const expiry = b.expiryDate ? new Date(b.expiryDate) : null;
                        const isExpired = expiry && expiry < now;
                        const isExpiringSoon = expiry && !isExpired && (expiry - now) < 30 * 24 * 60 * 60 * 1000;
                        return (
                          <tr key={b.batchNumber || i} className="border-b border-neutral-100 hover:bg-neutral-50">
                            <td className="py-3 px-3 text-sm font-mono text-[#1E293B]">{b.batchNumber || '—'}</td>
                            <td className="py-3 px-3 text-[13px] text-[#64748B] whitespace-nowrap">
                              {b.receivedDate ? formatDateTime(b.receivedDate) : '—'}
                            </td>
                            <td className="py-3 px-3 text-sm text-[#1E293B] text-right number-font">{b.initialQuantity || 0}</td>
                            <td className="py-3 px-3 text-sm text-[#1E293B] text-right number-font">{b.remainingQuantity ?? 0}</td>
                            <td className={`py-3 px-3 text-[13px] whitespace-nowrap ${
                              isExpired ? 'text-[#EF4444] font-medium' : isExpiringSoon ? 'text-[#F59E0B] font-medium' : 'text-[#64748B]'
                            }`}>
                              {expiry ? formatDateTime(expiry) : '—'}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                b.status === 'active' ? 'bg-[#D1FAE5] text-[#10B981]' :
                                b.status === 'expired' ? 'bg-[#FEE2E2] text-[#EF4444]' :
                                'bg-neutral-100 text-[#64748B]'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODALS ───────────────────────────────────── */}
      {showRestock && (
        <RestockModal
          product={product}
          onClose={() => setShowRestock(false)}
          onConfirm={handleRestock}
        />
      )}

      {showDelete && (
        <DeleteConfirmModal
          product={product}
          onClose={() => setShowDelete(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};

export default ProductDetailPage;
