import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Filter, Grid, List, Package,
  AlertCircle, X, ChevronDown,
  Loader2, Plus,
} from 'lucide-react';
import { useInventoryQuery } from '../hooks/useInventoryQuery';
import { useInventorySocket } from '../hooks/useInventorySocket';
import { useFiltersQuery } from '../hooks/useFiltersQuery';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency } from '../utils/formatters';
import ProductCard from '../components/inventory/ProductCard';
import { useCategoriesQuery } from '../hooks/useCategoriesQuery';
import CategoryPills from '../components/inventory/CategoryPills';
import RestockModal from '../components/inventory/RestockModal';
import DeleteConfirmModal from '../components/inventory/DeleteConfirmModal';
import AddProductDropdown from '../components/inventory/AddProductDropdown';
import BarcodeComingSoonModal from '../components/inventory/BarcodeComingSoonModal';
import CsvUploadModal from '../components/inventory/CsvUploadModal';

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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- State ---
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [restockProduct, setRestockProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [attrFilters, setAttrFilters] = useState({ size: '', color: '', brand: '' });
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const loadMoreRef = useRef(null);

  // --- Read URL filter param (e.g., ?filter=low_stock from Dashboard) ---
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam) {
      // Normalize: support both "low-stock" (hyphen) and "low_stock" (underscore)
      const normalized = filterParam.replace(/-/g, '_');
      const validStatuses = ['in_stock', 'low_stock', 'out_of_stock'];
      if (validStatuses.includes(normalized)) {
        setSelectedStockStatus(normalized);
      }
      // Also support category filter
      const categoryParam = searchParams.get('category');
      if (categoryParam) {
        setSelectedCategory(categoryParam);
      }
      // Clean URL params after applying
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Data ---
  const filters = useMemo(() => ({
    search: debouncedSearch,
    category: selectedCategory,
    stockStatus: selectedStockStatus,
    sortBy,
    sortOrder,
    page,
    ...attrFilters,
  }), [debouncedSearch, selectedCategory, selectedStockStatus, sortBy, sortOrder, page, attrFilters]);

  const { data, isLoading, isError, error, refetch } = useInventoryQuery(filters);

  // Socket.io real-time updates
  useInventorySocket(data?.shopId);

  // Dynamic filters from backend
  const { data: filtersData } = useFiltersQuery();

  // Shop categories from settings (matches business type from onboarding)
  const { data: categoriesData } = useCategoriesQuery();
  const shopCategories = categoriesData?.categories || [];

  const products = data?.products || [];
  const hasData = data?.hasData || false;
  const totalPages = data?.totalPages || 1;
  const hasMore = data?.hasMore ?? false;
  const total = data?.total || 0;

  // Dynamic attributes from filters endpoint
  const dynamicAttributes = filtersData?.attributes || {};

  // Check if any filter is active
  const hasActiveFilters = selectedCategory !== 'all' ||
    selectedStockStatus !== 'all' ||
    searchTerm.length > 0 ||
    attrFilters.size ||
    attrFilters.color ||
    attrFilters.brand;

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedStockStatus('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setAttrFilters({ size: '', color: '', brand: '' });
    setPage(1);
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
            {/* Search skeleton */}
            <div className="h-11 bg-neutral-200 rounded-xl w-full md:w-80" />
            {/* 6 pill skeletons */}
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
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
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-neutral-900">Inventory</h1>
            <AddProductDropdown
              onBarcodeClick={() => setShowBarcodeModal(true)}
              onCsvClick={() => setShowCsvModal(true)}
            />
          </div>

          {/* Filter bar (simplified) */}
          <div className="bg-white rounded-2xl border border-neutral-200 py-4">
            <div className="px-4">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 border border-neutral-300 rounded-xl text-sm placeholder-neutral-400 focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none"
                />
              </div>
            </div>

            <CategoryPills
              categories={shopCategories}
              total={0}
              selected={selectedCategory}
              onSelect={(cat) => setSelectedCategory(cat)}
            />
          </div>

          {/* Empty card */}
          <div className="flex flex-col items-center justify-center py-16 md:py-20 sm:max-w-[450px] sm:mx-auto bg-white rounded-2xl border border-neutral-200">
            <Package size={56} className="text-neutral-200 sm:hidden" />
            <Package size={64} className="text-neutral-200 hidden sm:block lg:hidden" />
            <Package size={80} className="text-neutral-200 hidden lg:block" />
            <h3 className="lg:text-[22px] sm:text-xl text-lg font-bold text-neutral-900 mt-6">
              Your inventory is empty
            </h3>
            <p className="lg:text-[15px] text-sm text-neutral-500 mt-2 text-center max-w-[400px] px-4">
              Add your first product to start tracking stock levels, sales, and profits.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-7 w-full sm:w-auto px-4 sm:px-0">
              <button
                onClick={() => navigate('/dashboard/inventory/add')}
                className="flex items-center justify-center gap-2 h-12 px-6 bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] transition-colors font-medium text-sm sm:w-auto w-full"
              >
                <Package size={18} />
                <span>Add Your First Product</span>
              </button>
              <button
                onClick={() => setShowBarcodeModal(true)}
                className="flex items-center justify-center gap-2 h-12 px-6 border border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors font-medium text-sm sm:w-auto w-full"
              >
                <span>📷 Scan Barcode</span>
              </button>
            </div>
            <a href="#" className="text-sm text-[#312E81] hover:underline mt-5 font-medium">
              Need help? View our inventory guide →
            </a>
          </div>

          {/* FAB */}
          <button
            onClick={() => navigate('/dashboard/inventory/add')}
            className="fixed md:bottom-6 md:right-6 bottom-20 right-4 w-14 h-14 rounded-2xl bg-[#312E81] text-white shadow-lg hover:bg-[#1E1B4B] hover:scale-105 hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40"
            aria-label="Add product"
          >
            <Package size={24} />
          </button>
        </div>
      </div>
    );
  }

  // ========================
  // EMPTY CATEGORY (Selected category has 0 products)
  // ========================
  const isCategoryOnlyFilter = selectedCategory !== 'all' &&
    selectedStockStatus === 'all' &&
    !searchTerm &&
    !attrFilters.size &&
    !attrFilters.color &&
    !attrFilters.brand;

  if (isCategoryOnlyFilter && products.length === 0 && hasData) {
    return (
      <div className="w-full max-w-full overflow-hidden">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-neutral-900">Inventory</h1>
            <AddProductDropdown
              onBarcodeClick={() => setShowBarcodeModal(true)}
              onCsvClick={() => setShowCsvModal(true)}
            />
          </div>

          {/* Filter bar with CategoryPills */}
          <div className="bg-white rounded-2xl border border-neutral-200 py-4">
            <div className="px-4">
              <div className="relative w-full md:w-80">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 border border-neutral-300 rounded-xl text-sm placeholder-neutral-400 focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none"
                />
              </div>
            </div>
            <CategoryPills
              categories={shopCategories}
              total={total}
              selected={selectedCategory}
              onSelect={(cat) => { setSelectedCategory(cat); setPage(1); }}
            />
          </div>

          {/* Empty category card */}
          <div className="flex flex-col items-center justify-center py-16 md:py-20 bg-white rounded-2xl border border-neutral-200">
            <Package size={56} className="text-neutral-200 mb-4" />
            <h3 className="text-lg font-semibold text-[#1E293B] mb-1">
              No products in {selectedCategory}
            </h3>
            <p className="text-sm text-[#64748B] mb-6 text-center max-w-sm px-4">
              Add your first product in this category
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <button
                onClick={() => navigate(`/dashboard/inventory/add?category=${encodeURIComponent(selectedCategory)}`)}
                className="flex items-center justify-center gap-2 h-11 px-6 bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] transition-colors text-sm font-medium"
              >
                <Plus size={18} />
                <span>Add Product in {selectedCategory}</span>
              </button>
              <button
                onClick={clearAllFilters}
                className="text-sm font-medium text-[#312E81] hover:underline"
              >
                Or Clear Filter to see all products
              </button>
            </div>
          </div>

          {/* FAB */}
          <button
            onClick={() => navigate('/dashboard/inventory/add')}
            className="fixed md:bottom-6 md:right-6 bottom-20 right-4 w-14 h-14 rounded-2xl bg-[#312E81] text-white shadow-lg hover:bg-[#1E1B4B] hover:scale-105 hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40"
            aria-label="Add product"
          >
            <Package size={24} />
          </button>
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
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-neutral-900">Inventory</h1>
            <AddProductDropdown
              onBarcodeClick={() => setShowBarcodeModal(true)}
              onCsvClick={() => setShowCsvModal(true)}
            />
          </div>

          {/* Filter bar (simplified) */}
          <div className="bg-white rounded-2xl border border-neutral-200 py-4">
            <div className="px-4">
              <div className="relative w-full md:w-80">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 border border-neutral-300 rounded-xl text-sm placeholder-neutral-400 focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none"
                />
              </div>
            </div>
            <CategoryPills
              categories={shopCategories}
              total={total}
              selected={selectedCategory}
              onSelect={(cat) => { setSelectedCategory(cat); setPage(1); }}
            />
          </div>

          {/* No results */}
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-neutral-200">
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

          {/* FAB */}
          <button
            onClick={() => navigate('/dashboard/inventory/add')}
            className="fixed md:bottom-6 md:right-6 bottom-20 right-4 w-14 h-14 rounded-2xl bg-[#312E81] text-white shadow-lg hover:bg-[#1E1B4B] hover:scale-105 hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40"
            aria-label="Add product"
          >
            <Package size={24} />
          </button>
        </div>
      </div>
    );
  }

  // ========================
  // DATA STATE (Products exist)
  // ========================
  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Inventory</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {total} product{total !== 1 ? 's' : ''} across {shopCategories.length} categor{shopCategories.length !== 1 ? 'ies' : 'y'}
            </p>
          </div>
          <div className="flex gap-2">
            <AddProductDropdown
              onBarcodeClick={() => setShowBarcodeModal(true)}
              onCsvClick={() => setShowCsvModal(true)}
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-neutral-200 py-4">
          {/* Search + Controls row */}
          <div className="flex flex-col sm:flex-row gap-3 px-4">
            <div className="relative w-full md:w-80">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full h-11 pl-10 pr-4 border border-neutral-300 rounded-xl text-sm placeholder-neutral-400 focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none"
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
                    setPage(1);
                  }}
                  className="appearance-none pl-3 pr-8 py-2.5 border border-[#CBD5E1] rounded-lg text-sm cursor-pointer hover:bg-neutral-50 focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none bg-white"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="stock-asc">Stock: Low to High</option>
                  <option value="stock-desc">Stock: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
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
          <CategoryPills
            categories={shopCategories}
            total={total}
            selected={selectedCategory}
            onSelect={(cat) => { setSelectedCategory(cat); setPage(1); }}
          />

          {/* Stock status pills */}
          <div className="flex gap-2 overflow-x-auto px-4 mt-2 scrollbar-none">
            {[
              { value: 'all', label: 'All Stock' },
              { value: 'in_stock', label: 'In Stock' },
              { value: 'low_stock', label: 'Low Stock' },
              { value: 'out_of_stock', label: 'Out of Stock' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setSelectedStockStatus(opt.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedStockStatus === opt.value
                    ? 'bg-[#312E81] text-white'
                    : 'bg-neutral-100 text-[#64748B] hover:bg-neutral-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Attribute filter dropdowns — dynamically generated */}
          {Object.keys(dynamicAttributes).length > 0 && (
            <div className="flex gap-2 overflow-x-auto px-4 mt-2 scrollbar-none">
              {Object.entries(dynamicAttributes).map(([attrKey, attrValues]) => {
                if (!attrValues || attrValues.length === 0) return null;
                const label = attrKey.charAt(0).toUpperCase() + attrKey.slice(1);
                const filterKey = attrKey === 'size' ? 'size' : attrKey === 'color' ? 'color' : attrKey === 'brand' ? 'brand' : attrKey;
                return (
                  <div key={attrKey} className="relative">
                    <select
                      value={attrFilters[filterKey] || ''}
                      onChange={(e) => { setAttrFilters(prev => ({ ...prev, [filterKey]: e.target.value })); setPage(1); }}
                      className="appearance-none pl-3 pr-8 py-1.5 border border-[#CBD5E1] rounded-lg text-[13px] cursor-pointer hover:bg-neutral-50 hover:border-[#312E81] focus:border-[#312E81] focus:ring-2 focus:ring-[#312E81]/10 outline-none bg-white text-neutral-700"
                    >
                      <option value="">{label}: All</option>
                      {attrValues.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-[#EEF2FF] border border-[#312E81]/10 rounded-xl">
            <span className="text-xs font-medium text-[#312E81]">Active Filters:</span>
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#312E81]/20 rounded-full text-xs text-[#312E81]">
                Category: {selectedCategory}
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
            {attrFilters.size && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#312E81]/20 rounded-full text-xs text-[#312E81]">
                Size: {attrFilters.size}
                <button onClick={() => setAttrFilters(prev => ({ ...prev, size: '' }))}>
                  <X size={12} />
                </button>
              </span>
            )}
            {attrFilters.color && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#312E81]/20 rounded-full text-xs text-[#312E81]">
                Color: {attrFilters.color}
                <button onClick={() => setAttrFilters(prev => ({ ...prev, color: '' }))}>
                  <X size={12} />
                </button>
              </span>
            )}
            {attrFilters.brand && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#312E81]/20 rounded-full text-xs text-[#312E81]">
                Brand: {attrFilters.brand}
                <button onClick={() => setAttrFilters(prev => ({ ...prev, brand: '' }))}>
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
              onClick={() => { clearAllFilters(); setAttrFilters({ size: '', color: '', brand: '' }); }}
              className="ml-auto text-xs font-medium text-[#312E81] hover:underline"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Product Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onEdit={(p) => navigate(`/inventory/${p._id}`)}
                onRestock={setRestockProduct}
                onDuplicate={(p) => navigate(`/dashboard/inventory/add?duplicate=${p._id}`)}
                onDelete={setDeleteProduct}
              />
            ))}
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
                      <tr key={product._id} onClick={() => navigate(`/inventory/${product._id}`)} className="border-t border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer">
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

        {/* Pagination (Desktop) / Load More (Mobile) */}
        {totalPages > 1 && (
          <>
            {/* Desktop pagination */}
            <div className="hidden sm:flex items-center justify-between">
              <p className="text-sm text-[#64748B]">
                Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total} products
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const pageNum = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        pageNum === page
                          ? 'bg-[#312E81] text-white'
                          : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Mobile Load More */}
            <div className="flex sm:hidden justify-center">
              {hasMore ? (
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-2 px-8 py-3 bg-white border border-[#CBD5E1] rounded-xl text-sm font-medium text-[#64748B] hover:bg-neutral-50 transition-colors"
                >
                  <Loader2 size={16} className="animate-spin hidden" />
                  Load More Products
                </button>
              ) : (
                <p className="text-sm text-[#64748B]">
                  Showing all {total} products
                </p>
              )}
            </div>
          </>
        )}

        {/* FAB */}
        <button
          onClick={() => navigate('/dashboard/inventory/add')}
          className="fixed md:bottom-6 md:right-6 bottom-20 right-4 w-14 h-14 rounded-2xl bg-[#312E81] text-white shadow-lg hover:bg-[#1E1B4B] hover:scale-105 hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40"
          aria-label="Add product"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Restock Modal */}
      {restockProduct && (
        <RestockModal
          product={restockProduct}
          onClose={() => setRestockProduct(null)}
          onConfirm={(data) => {
            console.log('Restock:', data);
            setRestockProduct(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteProduct && (
        <DeleteConfirmModal
          product={deleteProduct}
          onClose={() => setDeleteProduct(null)
             
          }
          onConfirm={(product) => {
            console.log('Delete:', product._id);
            setDeleteProduct(null);
          }}
        />
      )}

      {/* Barcode Coming Soon Modal */}
      {showBarcodeModal && (
        <BarcodeComingSoonModal onClose={() => setShowBarcodeModal(false)} />
      )}

      {/* CSV Upload Modal */}
      {showCsvModal && (
        <CsvUploadModal
          onClose={() => setShowCsvModal(false)}
          onImportComplete={() => {
            setShowCsvModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default InventoryPage;
