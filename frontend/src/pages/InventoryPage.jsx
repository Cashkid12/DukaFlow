import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Grid, List, Package, AlertTriangle, TrendingDown, TrendingUp, X, CheckCircle, XCircle, Clock, ChevronDown, SortAsc, SortDesc, Camera } from 'lucide-react';
import { useProducts, useInventoryStats } from '../hooks/useProducts';
import { useDebounce } from '../hooks/useDebounce';
import { BUSINESS_TYPES, BUSINESS_CATEGORIES, BUSINESS_FILTERS, getStockStatus, isExpiringSoon, isExpired } from '../utils/inventoryConfig';
import { getInventoryPermissions } from '../utils/inventoryPermissions';
import QuickActionsMenu from '../components/inventory/QuickActionsMenu';
import RestockModal from '../components/inventory/RestockModal';
import BarcodeScanningModal from '../components/inventory/BarcodeScanningModal';
import { formatCurrency } from '../utils/formatters';

const InventoryPage = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState('all');
  const [businessFilters, setBusinessFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  // Modals state
  const [restockProduct, setRestockProduct] = useState(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);

  // User role (would come from auth context)
  const userRole = 'owner'; // TODO: Get from user context
  const permissions = getInventoryPermissions(userRole);

  // Debounce search term (300ms)
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fetch inventory stats
  const { data: statsData } = useInventoryStats();
  
  // Build filters object
  const filters = useMemo(() => ({
    search: debouncedSearch,
    category: selectedCategory,
    stockStatus: selectedStockStatus,
    sortBy,
    sortOrder,
    ...businessFilters,
  }), [debouncedSearch, selectedCategory, selectedStockStatus, sortBy, sortOrder, businessFilters]);

  // Fetch products with filters
  const { data, isLoading, error, refetch } = useProducts(filters);

  const products = data?.products || [];
  const categories = data?.categories || [];
  const businessType = data?.shop?.businessType || BUSINESS_TYPES.OTHER;
  const pagination = data?.pagination;

  // Get business-type specific categories
  const defaultCategories = BUSINESS_CATEGORIES[businessType] || [];
  const allCategories = ['all', ...new Set([...defaultCategories, ...categories])];

  // Get business-type specific filters
  const activeFilters = BUSINESS_FILTERS[businessType]?.filters || [];

  // Check if any filters are active
  const hasActiveFilters = selectedCategory !== 'all' || 
                           selectedStockStatus !== 'all' || 
                           Object.keys(businessFilters).length > 0 ||
                           debouncedSearch;

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedStockStatus('all');
    setBusinessFilters({});
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  // Quick action handlers
  const handleEditProduct = (product) => {
    // TODO: Navigate to edit page or open edit modal
    console.log('Edit product:', product);
    alert(`Edit product: ${product.name}\n(Navigation to edit page coming soon)`);
  };

  const handleRestockProduct = (product) => {
    setRestockProduct(product);
  };

  const handleDuplicateProduct = (product) => {
    // TODO: Open add product modal with pre-filled data
    console.log('Duplicate product:', product);
    alert(`Duplicate product: ${product.name}\n(Add product modal with pre-filled data coming soon)`);
  };

  const handleDeleteProduct = (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      // TODO: Call delete API
      console.log('Delete product:', product);
      alert(`Product "${product.name}" deleted successfully`);
      refetch();
    }
  };

  const handleConfirmRestock = async (data) => {
    try {
      // TODO: Call restock API
      console.log('Restock data:', data);
      alert(`Successfully restocked ${data.quantity} units`);
      setRestockProduct(null);
      refetch();
    } catch (error) {
      alert('Failed to restock product');
      console.error(error);
    }
  };

  // Format expiry date
  const formatExpiryDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-KE', { month: 'short', year: '2-digit' });
  };

  // Highlight matching text in search results
  const highlightText = (text, highlight) => {
    if (!highlight || !text) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-inherit">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Render stock badge
  const renderStockBadge = (stock, threshold = 10) => {
    const { label, bgColor, textColor, icon: iconName } = getStockStatus(stock, threshold);
    
    const IconComponent = iconName === 'CheckCircle' ? CheckCircle : 
                          iconName === 'AlertTriangle' ? AlertTriangle : XCircle;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        <IconComponent size={12} />
        <span>{label}</span>
      </span>
    );
  };

  // Render expiry warning
  const renderExpiryBadge = (expiryDate) => {
    if (!expiryDate) return null;

    if (isExpired(expiryDate)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <span>⚠️</span>
          <span>Expired</span>
        </span>
      );
    }

    if (isExpiringSoon(expiryDate)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
          <span>⌛</span>
          <span>Expiring Soon</span>
        </span>
      );
    }

    return (
      <span className="text-xs text-neutral-600">
        Exp: {formatExpiryDate(expiryDate)}
      </span>
    );
  };

  // Render product card for Clothing
  const renderClothingCard = (product) => (
    <div key={product._id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow relative">
      {/* Quick Actions Menu */}
      {permissions.showQuickActions && (
        <div className="absolute top-2 right-2 z-10">
          <QuickActionsMenu
            product={product}
            userRole={userRole}
            onEdit={handleEditProduct}
            onRestock={handleRestockProduct}
            onDuplicate={handleDuplicateProduct}
            onDelete={handleDeleteProduct}
          />
        </div>
      )}
      <div className="aspect-square bg-neutral-100 flex items-center justify-center">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package size={48} className="text-neutral-400" />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-neutral-900 mb-2 truncate">
          {debouncedSearch ? highlightText(product.name, debouncedSearch) : product.name}
        </h3>
        <div className="flex gap-2 mb-3 text-xs">
          {product.attributes?.size && (
            <span className="px-2 py-1 bg-neutral-100 rounded">Size: {product.attributes.size}</span>
          )}
          {product.attributes?.color && (
            <span className="px-2 py-1 bg-neutral-100 rounded">Color: {product.attributes.color}</span>
          )}
        </div>
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Buy:</span>
            <span className="font-medium number-font">{formatCurrency(product.costPrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Sell:</span>
            <span className="font-semibold text-[#E8835C] number-font">{formatCurrency(product.price)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          {renderStockBadge(product.stock, data?.shop?.settings?.lowStockThreshold)}
        </div>
      </div>
    </div>
  );

  // Render product card for Pharmacy
  const renderPharmacyCard = (product) => (
    <div key={product._id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-neutral-100 flex items-center justify-center relative">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package size={48} className="text-neutral-400" />
        )}
        {product.attributes?.prescriptionRequired && (
          <span className="absolute top-2 right-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
            ⚕️ Rx
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-neutral-900 mb-1 truncate">{product.name}</h3>
        {product.attributes?.strength && (
          <p className="text-sm text-neutral-600 mb-2">{product.attributes.strength}</p>
        )}
        <div className="space-y-2 mb-3">
          <div className="flex gap-2 text-xs">
            {product.attributes?.form && (
              <span className="px-2 py-1 bg-neutral-100 rounded">Form: {product.attributes.form}</span>
            )}
          </div>
          {renderExpiryBadge(product.attributes?.expiryDate)}
        </div>
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Buy:</span>
            <span className="font-medium number-font">{formatCurrency(product.costPrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Sell:</span>
            <span className="font-semibold text-[#E8835C] number-font">{formatCurrency(product.price)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          {renderStockBadge(product.stock, data?.shop?.settings?.lowStockThreshold)}
        </div>
      </div>
    </div>
  );

  // Render product card for Hardware
  const renderHardwareCard = (product) => (
    <div key={product._id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-neutral-100 flex items-center justify-center">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package size={48} className="text-neutral-400" />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-neutral-900 mb-2 truncate">{product.name}</h3>
        <div className="space-y-1 mb-3 text-xs text-neutral-600">
          {product.attributes?.specifications && (
            <p>{product.attributes.specifications}</p>
          )}
          <div className="flex gap-2">
            {product.attributes?.material && (
              <span className="px-2 py-1 bg-neutral-100 rounded">Material: {product.attributes.material}</span>
            )}
            {product.attributes?.unit && (
              <span className="px-2 py-1 bg-neutral-100 rounded">Unit: {product.attributes.unit}</span>
            )}
          </div>
        </div>
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Buy:</span>
            <span className="font-medium number-font">{formatCurrency(product.costPrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Sell:</span>
            <span className="font-semibold text-[#E8835C] number-font">{formatCurrency(product.price)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          {renderStockBadge(product.stock, data?.shop?.settings?.lowStockThreshold)}
        </div>
      </div>
    </div>
  );

  // Generic product card for other business types
  const renderGenericCard = (product) => (
    <div key={product._id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-neutral-100 flex items-center justify-center">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package size={48} className="text-neutral-400" />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-neutral-900 mb-2 truncate">{product.name}</h3>
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Buy:</span>
            <span className="font-medium number-font">{formatCurrency(product.costPrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Sell:</span>
            <span className="font-semibold text-[#E8835C] number-font">{formatCurrency(product.price)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          {renderStockBadge(product.stock, data?.shop?.settings?.lowStockThreshold)}
        </div>
      </div>
    </div>
  );

  // Render product card based on business type
  const renderProductCard = (product) => {
    switch (businessType) {
      case BUSINESS_TYPES.CLOTHING:
        return renderClothingCard(product);
      case BUSINESS_TYPES.PHARMACY:
        return renderPharmacyCard(product);
      case BUSINESS_TYPES.HARDWARE:
        return renderHardwareCard(product);
      default:
        return renderGenericCard(product);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded w-72"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-neutral-200 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-80 bg-neutral-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle size={48} className="text-red-500 mb-4" />
        <p className="text-lg font-medium text-neutral-900 mb-2">Failed to load inventory</p>
        <p className="text-sm text-neutral-600 mb-4">{error.message}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-[#312E81] text-white rounded-lg hover:bg-[#1E1B4B] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state: No products at all
  const renderEmptyState = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="h2 text-neutral-900 mb-2">Inventory</h1>
          <p className="text-neutral-600">Manage your products and stock levels.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#312E81] text-white rounded-lg hover:bg-[#1E1B4B] transition-colors">
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-neutral-200">
        <Package size={64} className="text-neutral-300 mb-4" />
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">Your inventory is empty</h3>
        <p className="text-sm text-neutral-600 mb-6 text-center max-w-md">
          Add your first product to start tracking stock
        </p>
        <button className="flex items-center gap-2 px-6 py-3 bg-[#312E81] text-white rounded-lg hover:bg-[#1E1B4B] transition-colors mb-4">
          <Plus size={18} />
          <span>Add Your First Product</span>
        </button>
        <p className="text-xs text-neutral-500">
          You can also scan barcodes (coming soon)
        </p>
      </div>
    </div>
  );

  // Empty state: No results found (after search/filter)
  const renderNoResultsState = () => (
    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-neutral-200">
      <Search size={64} className="text-neutral-300 mb-4" />
      <h3 className="text-xl font-semibold text-neutral-900 mb-2">No products match your search</h3>
      <p className="text-sm text-neutral-600 mb-6 text-center max-w-md">
        Try adjusting your filters or search term
      </p>
      <div className="flex gap-3">
        <button
          onClick={clearAllFilters}
          className="flex items-center gap-2 px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          <X size={18} />
          <span>Clear All Filters</span>
        </button>
        <button className="flex items-center gap-2 px-6 py-3 bg-[#312E81] text-white rounded-lg hover:bg-[#1E1B4B] transition-colors">
          <Plus size={18} />
          <span>Add New Product</span>
        </button>
      </div>
    </div>
  );

  const stats = statsData?.stats || {};

  // Determine which empty state to show
  const isInitialLoad = !hasActiveFilters && products.length === 0;
  const isNoResults = hasActiveFilters && products.length === 0;

  if (isInitialLoad) {
    return renderEmptyState();
  }

  if (isNoResults) {
    return renderNoResultsState();
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="h2 text-neutral-900 mb-2">Inventory</h1>
          <p className="text-neutral-600">Manage your products and stock levels.</p>
        </div>
        <div className="flex gap-2">
          {/* Barcode Scan Button */}
          <button
            onClick={() => setShowBarcodeModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
            title="Scan barcode (Coming soon)"
          >
            <Camera size={18} />
            <span className="hidden sm:inline">Scan</span>
          </button>
          {permissions.canAdd && (
            <button className="flex items-center gap-2 px-4 py-2 bg-[#312E81] text-white rounded-lg hover:bg-[#1E1B4B] transition-colors">
              <Plus size={18} />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-neutral-200">
          <p className="text-xs text-neutral-500 mb-1">Total Products</p>
          <p className="text-2xl font-bold text-neutral-900 number-font">{stats.totalProducts || products.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-neutral-200">
          <p className="text-xs text-neutral-500 mb-1">In Stock</p>
          <p className="text-2xl font-bold text-green-600 number-font">{stats.inStock || 0}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-neutral-200">
          <p className="text-xs text-neutral-500 mb-1">Low Stock</p>
          <p className="text-2xl font-bold text-orange-600 number-font">{stats.lowStock || 0}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-neutral-200">
          <p className="text-xs text-neutral-500 mb-1">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600 number-font">{stats.outOfStock || 0}</p>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-900">Active Filters:</span>
          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-300 rounded-full text-sm text-blue-800">
              Category: {selectedCategory}
              <button onClick={() => setSelectedCategory('all')} className="hover:text-blue-600">
                <X size={14} />
              </button>
            </span>
          )}
          {selectedStockStatus !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-300 rounded-full text-sm text-blue-800">
              Stock: {selectedStockStatus.replace('_', ' ')}
              <button onClick={() => setSelectedStockStatus('all')} className="hover:text-blue-600">
                <X size={14} />
              </button>
            </span>
          )}
          {Object.entries(businessFilters).map(([key, value]) => (
            value && (
              <span key={key} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-300 rounded-full text-sm text-blue-800 capitalize">
                {key}: {value}
                <button onClick={() => setBusinessFilters(prev => { const next = {...prev}; delete next[key]; return next; })} className="hover:text-blue-600">
                  <X size={14} />
                </button>
              </span>
            )
          ))}
          <button
            onClick={clearAllFilters}
            className="ml-auto text-sm font-medium text-blue-700 hover:text-blue-900"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-lg p-4 border border-neutral-200">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search products by name, SKU, brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#312E81] focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {/* Sorting Dropdown */}
            <div className="relative">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="appearance-none pl-3 pr-10 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-[#312E81] focus:border-transparent cursor-pointer hover:bg-neutral-50"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="stock-asc">Stock: Low to High</option>
                <option value="stock-desc">Stock: High to Low</option>
                {(businessType === BUSINESS_TYPES.PHARMACY || businessType === BUSINESS_TYPES.GROCERY) && (
                  <option value="expiry-asc">Expiry: Soonest First</option>
                )}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <Filter size={18} />
              <span>Filters</span>
            </button>
            <div className="flex border border-neutral-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-[#312E81] text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-[#312E81] text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#312E81] text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>

        {/* Stock Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'All Stock' },
            { value: 'in_stock', label: 'In Stock' },
            { value: 'low_stock', label: 'Low Stock' },
            { value: 'out_of_stock', label: 'Out of Stock' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedStockStatus(option.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedStockStatus === option.value
                  ? 'bg-[#E8835C] text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Business-Type Specific Filters */}
        {showFilters && activeFilters.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <p className="text-sm font-medium text-neutral-900 mb-3">{BUSINESS_FILTERS[businessType]?.label}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeFilters.map((filter) => (
                <div key={filter.key}>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">{filter.label}</label>
                  <select
                    value={businessFilters[filter.key] || ''}
                    onChange={(e) => setBusinessFilters(prev => ({ ...prev, [filter.key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-[#312E81] focus:border-transparent"
                  >
                    <option value="">All</option>
                    {filter.options.map((option) => {
                      const value = typeof option === 'object' ? option.value : option;
                      const label = typeof option === 'object' ? option.label : option;
                      return (
                        <option key={value} value={value}>{label}</option>
                      );
                    })}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Products Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => renderProductCard(product))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Cost</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Price</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Stock</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-t border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 px-4 text-sm text-neutral-900 font-medium">{product.name}</td>
                    <td className="py-3 px-4 text-sm text-neutral-600">{product.category}</td>
                    <td className="py-3 px-4 text-sm number-font">{formatCurrency(product.costPrice)}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-[#E8835C] number-font">{formatCurrency(product.price)}</td>
                    <td className="py-3 px-4 text-sm number-font">{product.stock}</td>
                    <td className="py-3 px-4">
                      {renderStockBadge(product.stock, data?.shop?.settings?.lowStockThreshold)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={pagination.current === 1}
            className="px-4 py-2 border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-600">
            Page {pagination.current} of {pagination.pages}
          </span>
          <button
            disabled={!pagination.hasMore}
            className="px-4 py-2 border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Restock Modal */}
      {restockProduct && (
        <RestockModal
          product={restockProduct}
          onClose={() => setRestockProduct(null)}
          onConfirm={handleConfirmRestock}
        />
      )}

      {/* Barcode Scanning Modal */}
      {showBarcodeModal && (
        <BarcodeScanningModal
          onClose={() => setShowBarcodeModal(false)}
        />
      )}
    </div>
  );
};

export default InventoryPage;
