import React, { useState, useMemo } from 'react';
import {
  Plus, Search, Filter, Grid, List, Package,
  AlertCircle, X, ChevronDown, Camera,
} from 'lucide-react';
import { useInventoryQuery } from '../hooks/useInventoryQuery';
import { formatCurrency } from '../utils/formatters';

/**
 * Returns a stock status badge config for a product.
 */
const getStockBadge = (status) => {
  switch (status) {
    case 'in_stock':
      return { label: 'In Stock', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' };
    case 'low_stock':
      return { label: 'Low Stock', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' };
    case 'out_of_stock':
      return { label: 'Out of Stock', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' };
    default:
      return { label: 'In Stock', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' };
  }
};

const InventoryPage = () => {
  // --- State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // --- Data ---
  const filters = useMemo(() => ({
    search: searchTerm,
    category: selectedCategory,
    stockStatus: selectedStockStatus,
    sortBy,
    sortOrder,
  }), [searchTerm, selectedCategory, selectedStockStatus, sortBy, sortOrder]);

  const { data, isLoading, isError, error, refetch } = useInventoryQuery(filters);

  const products = data?.products || [];
  const categories = data?.categories || [];
  const hasData = data?.hasData || false;

  // Check if any filter is active
  const hasActiveFilters = selectedCategory !== 'all' ||
    selectedStockStatus !== 'all' ||
    searchTerm.length > 0;

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedStockStatus('all');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  // ========================
  // LOADING STATE (Skeleton)
  // ========================
  if (isLoading) {
    return (
      <div className="w-full max-w-full overflow-hidden">
        <div className="space-y-6 px-4 md:px-0">
          {/* Header skeleton */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-pulse">
            <div>
              <div className="h-8 bg-neutral-200 rounded w-36 mb-2" />
              <div className="h-4 bg-neutral-200 rounded w-64" />
            </div>
            <div className="h-10 bg-neutral-200 rounded-lg w-36" />
          </div>

          {/* Filter bar skeleton */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3 animate-pulse">
            <div className="flex gap-3">
              <div className="flex-1 h-10 bg-neutral-200 rounded-lg" />
              <div className="h-10 w-24 bg-neutral-200 rounded-lg" />
              <div className="h-10 w-24 bg-neutral-200 rounded-lg" />
              <div className="h-10 w-20 bg-neutral-200 rounded-lg" />
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 w-20 bg-neutral-200 rounded-full" />
              ))}
            </div>
          </div>

          {/* Product grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden animate-pulse">
                <div className="aspect-square bg-neutral-200" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-neutral-200 rounded w-3/4" />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-neutral-200 rounded" />
                    <div className="h-6 w-16 bg-neutral-200 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-10 bg-neutral-200 rounded" />
                      <div className="h-4 w-16 bg-neutral-200 rounded" />
                    </div>
                    <div className="flex justify-between">
                      <div className="h-4 w-10 bg-neutral-200 rounded" />
                      <div className="h-4 w-16 bg-neutral-200 rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-20 bg-neutral-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // ERROR STATE
  // ========================
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <AlertCircle size={48} className="text-neutral-300 mb-4" />
        <h2 className="text-lg font-semibold text-neutral-900 mb-1">
          Unable to load inventory
        </h2>
        <p className="text-sm text-neutral-500 mb-6 text-center max-w-sm">
          {error?.message || 'Please check your connection and try again'}
        </p>
        <button
          onClick={() => refetch()}
          className="px-6 py-2.5 bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] transition-colors font-medium text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ========================
  // EMPTY STATE (No products)
  // ========================
  if (!hasData) {
    return (
      <div className="w-full max-w-full overflow-hidden">
        <div className="space-y-6 px-4 md:px-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1E293B]">Inventory</h1>
              <p className="text-sm text-[#64748B] mt-1">Manage your products and stock levels.</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] transition-colors text-sm font-medium whitespace-nowrap">
              <Plus size={18} />
              <span>Add Product</span>
            </button>
          </div>

          {/* Empty card */}
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#CBD5E1]">
            <div className="w-20 h-20 rounded-full bg-neutral-50 flex items-center justify-center mb-5">
              <Package size={40} className="text-neutral-300" />
            </div>
            <h3 className="text-xl font-semibold text-[#1E293B] mb-2">
              Your inventory is empty
            </h3>
            <p className="text-sm text-[#64748B] mb-8 text-center max-w-sm px-4">
              Add your first product to start tracking stock and sales in real time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="flex items-center gap-2 px-6 py-3 bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] transition-colors">
                <Plus size={18} />
                <span className="font-medium">Add Your First Product</span>
              </button>
              <button className="flex items-center gap-2 px-6 py-3 border border-[#CBD5E1] text-[#64748B] rounded-xl hover:bg-neutral-50 transition-colors">
                <Camera size={18} />
                <span className="font-medium">Scan Barcode</span>
              </button>
            </div>
            <p className="text-xs text-neutral-400 mt-4">
              Barcode scanning coming soon
            </p>
          </div>

          {/* Quick tips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Add manually', desc: 'Enter product details, price, and stock level' },
              { title: 'Bulk import', desc: 'Upload CSV with multiple products at once' },
              { title: 'Scan barcode', desc: 'Use your camera to scan and auto-fill details' },
            ].map((tip, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#CBD5E1] p-5">
                <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center mb-3">
                  <span className="text-sm font-bold text-[#312E81]">{i + 1}</span>
                </div>
                <h4 className="text-sm font-semibold text-[#1E293B] mb-1">{tip.title}</h4>
                <p className="text-xs text-[#64748B]">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // NO RESULTS (Filters active, no matches)
  // ========================
  if (hasActiveFilters && products.length === 0) {
    return (
      <div className="w-full max-w-full overflow-hidden">
        <div className="space-y-6 px-4 md:px-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1E293B]">Inventory</h1>
              <p className="text-sm text-[#64748B] mt-1">Manage your products and stock levels.</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] transition-colors text-sm font-medium whitespace-nowrap">
              <Plus size={18} />
              <span>Add Product</span>
            </button>
          </div>

          {/* Filter bar (simplified) */}
          <div className="bg-white rounded-2xl border border-[#CBD5E1] p-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search products by name, SKU, brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-[#CBD5E1] rounded-xl text-sm focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none"
              />
            </div>
          </div>

          {/* No results */}
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#CBD5E1]">
            <Search size={48} className="text-neutral-300 mb-4" />
            <h3 className="text-lg font-semibold text-[#1E293B] mb-2">
              No products match your criteria
            </h3>
            <p className="text-sm text-[#64748B] mb-6 text-center max-w-sm px-4">
              Try adjusting your filters or search term
            </p>
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] transition-colors text-sm font-medium"
            >
              <X size={18} />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // DATA STATE (Products exist)
  // ========================
  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="space-y-6 px-4 md:px-0">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Inventory</h1>
            <p className="text-sm text-[#64748B] mt-1">
              {data?.total || 0} product{(data?.total || 0) !== 1 ? 's' : ''} across {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2.5 border border-[#CBD5E1] text-[#64748B] rounded-xl hover:bg-neutral-50 transition-colors text-sm font-medium whitespace-nowrap"
              title="Scan barcode (Coming soon)"
            >
              <Camera size={18} />
              <span className="hidden sm:inline">Scan</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] transition-colors text-sm font-medium whitespace-nowrap">
              <Plus size={18} />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-[#CBD5E1] p-4 space-y-4">
          {/* Search + Controls row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search products by name, SKU, brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-[#CBD5E1] rounded-xl text-sm focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none"
              />
            </div>
            <div className="flex gap-2">
              {/* Sort */}
              <div className="relative">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="appearance-none pl-3 pr-8 py-2.5 border border-[#CBD5E1] rounded-xl text-sm cursor-pointer hover:bg-neutral-50 focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none bg-white"
                >
                  <option value="createdAt-desc">Newest</option>
                  <option value="createdAt-asc">Oldest</option>
                  <option value="price-desc">Price ↓</option>
                  <option value="price-asc">Price ↑</option>
                  <option value="stock-asc">Stock ↓</option>
                  <option value="stock-desc">Stock ↑</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>

              {/* Filters toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  showFilters
                    ? 'bg-[#EEF2FF] border-[#312E81] text-[#312E81]'
                    : 'border-[#CBD5E1] text-[#64748B] hover:bg-neutral-50'
                }`}
              >
                <Filter size={18} />
                <span>Filters</span>
              </button>

              {/* View mode toggle */}
              <div className="flex border border-[#CBD5E1] rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[#312E81] text-white'
                      : 'bg-white text-neutral-400 hover:bg-neutral-50'
                  }`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-[#312E81] text-white'
                      : 'bg-white text-neutral-400 hover:bg-neutral-50'
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-[#312E81] text-white'
                  : 'bg-neutral-100 text-[#64748B] hover:bg-neutral-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#312E81] text-white'
                    : 'bg-neutral-100 text-[#64748B] hover:bg-neutral-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Stock status pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {[
              { value: 'all', label: 'All Stock' },
              { value: 'in_stock', label: 'In Stock' },
              { value: 'low_stock', label: 'Low Stock' },
              { value: 'out_of_stock', label: 'Out of Stock' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedStockStatus(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedStockStatus === opt.value
                    ? 'bg-[#E8835C] text-white'
                    : 'bg-neutral-100 text-[#64748B] hover:bg-neutral-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-[#EEF2FF] border border-[#312E81]/10 rounded-xl">
            <span className="text-xs font-medium text-[#312E81]">Active:</span>
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#312E81]/20 rounded-full text-xs text-[#312E81]">
                {selectedCategory}
                <button onClick={() => setSelectedCategory('all')}>
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedStockStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#312E81]/20 rounded-full text-xs text-[#312E81]">
                {selectedStockStatus === 'in_stock' ? 'In Stock' : selectedStockStatus === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                <button onClick={() => setSelectedStockStatus('all')}>
                  <X size={12} />
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#312E81]/20 rounded-full text-xs text-[#312E81]">
                "{searchTerm}"
                <button onClick={() => setSearchTerm('')}>
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="ml-auto text-xs font-medium text-[#312E81] hover:underline"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Product Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => {
              const badge = getStockBadge(product.status);
              return (
                <div
                  key={product._id}
                  className="bg-white rounded-2xl border border-[#CBD5E1] overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                >
                  {/* Image */}
                  <div className="aspect-square bg-neutral-50 flex items-center justify-center relative">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Package size={40} className="text-neutral-300" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-[#1E293B] mb-2 truncate text-sm">
                      {product.name}
                    </h3>

                    {/* Attributes */}
                    {(product.attributes?.size || product.attributes?.color) && (
                      <div className="flex gap-1.5 mb-3 flex-wrap">
                        {product.attributes?.size && (
                          <span className="px-2 py-0.5 bg-neutral-100 rounded-md text-[11px] text-[#64748B] font-medium">
                            {product.attributes.size}
                          </span>
                        )}
                        {product.attributes?.color && (
                          <span className="px-2 py-0.5 bg-neutral-100 rounded-md text-[11px] text-[#64748B] font-medium">
                            {product.attributes.color}
                          </span>
                        )}
                        {product.attributes?.brand && (
                          <span className="px-2 py-0.5 bg-neutral-100 rounded-md text-[11px] text-[#64748B] font-medium">
                            {product.attributes.brand}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Price row */}
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#64748B]">Buy</span>
                        <span className="font-medium text-[#1E293B]">
                          {formatCurrency(product.costPrice || product.buyingPrice || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#64748B]">Sell</span>
                        <span className="font-semibold text-[#E8835C]">
                          {formatCurrency(product.price || product.sellingPrice || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Stock badge */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${badge.bg} ${badge.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                      <span className="text-xs text-[#64748B] font-medium">
                        {product.stock || product.quantity || 0} left
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-2xl border border-[#CBD5E1] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-neutral-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Product</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Category</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Cost</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Price</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Stock</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const badge = getStockBadge(product.status);
                    return (
                      <tr key={product._id} className="border-t border-neutral-100 hover:bg-neutral-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-[#1E293B]">{product.name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-[#64748B]">{product.category}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm text-[#1E293B]">
                            {formatCurrency(product.costPrice || product.buyingPrice || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm font-semibold text-[#E8835C]">
                            {formatCurrency(product.price || product.sellingPrice || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm text-[#1E293B] font-medium">
                            {product.stock || product.quantity || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${badge.bg} ${badge.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
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

        {/* FAB - Mobile only */}
        <button className="fixed bottom-20 right-4 sm:hidden w-12 h-12 rounded-[14px] bg-[#312E81] text-white shadow-lg hover:bg-[#1E1B4B] hover:scale-105 transition-all duration-200 flex items-center justify-center z-40" aria-label="Add product">
          <Plus size={22} />
        </button>
      </div>
    </div>
  );
};

export default InventoryPage;
