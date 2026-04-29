/**
 * Inventory Configuration by Business Type
 * Defines categories, filters, and display fields for each shop type
 */

export const BUSINESS_TYPES = {
  CLOTHING: 'clothing',
  ELECTRONICS: 'electronics',
  GROCERY: 'grocery',
  PHARMACY: 'pharmacy',
  HARDWARE: 'hardware',
  COSMETICS: 'cosmetics',
  OTHER: 'other',
};

// Categories for each business type
export const BUSINESS_CATEGORIES = {
  [BUSINESS_TYPES.CLOTHING]: [
    'Trousers', 'Shirts', 'Dresses', 'Jackets', 'Shoes', 
    'Accessories', 'Kids Wear', 'Sweaters', 'Skirts', 'Shorts'
  ],
  [BUSINESS_TYPES.ELECTRONICS]: [
    'Phones', 'Laptops', 'Accessories', 'Audio', 'Cameras',
    'Gaming', 'TVs', 'Wearables', 'Networking', 'Storage'
  ],
  [BUSINESS_TYPES.GROCERY]: [
    'Beverages', 'Dry Foods', 'Fresh Produce', 'Dairy', 'Snacks',
    'Canned Goods', 'Spices', 'Bakery', 'Frozen', 'Household'
  ],
  [BUSINESS_TYPES.PHARMACY]: [
    'Prescription', 'OTC', 'First Aid', 'Vitamins', 
    'Personal Care', 'Baby Care', 'Medical Devices', 'Supplements'
  ],
  [BUSINESS_TYPES.HARDWARE]: [
    'Tools', 'Paint', 'Electrical', 'Plumbing', 'Fasteners',
    'Building Materials', 'Safety Equipment', 'Garden', 'Automotive'
  ],
  [BUSINESS_TYPES.COSMETICS]: [
    'Makeup', 'Skincare', 'Hair Care', 'Fragrances', 
    'Nail Care', 'Bath & Body', 'Men\'s Grooming', 'Beauty Tools'
  ],
  [BUSINESS_TYPES.OTHER]: ['General'],
};

// Filter options for each business type
export const BUSINESS_FILTERS = {
  [BUSINESS_TYPES.CLOTHING]: {
    label: 'Clothing Filters',
    filters: [
      { key: 'size', label: 'Size', options: ['S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40'] },
      { key: 'color', label: 'Color', options: ['Black', 'White', 'Blue', 'Red', 'Green', 'Yellow', 'Gray', 'Brown', 'Pink', 'Purple'] },
      { key: 'material', label: 'Material', options: ['Cotton', 'Polyester', 'Denim', 'Leather', 'Silk', 'Wool', 'Linen'] },
      { key: 'brand', label: 'Brand', options: [] }, // Dynamic from products
    ],
  },
  [BUSINESS_TYPES.PHARMACY]: {
    label: 'Pharmacy Filters',
    filters: [
      { key: 'expiryStatus', label: 'Expiry Status', options: [
        { value: 'expiring_soon', label: 'Expiring Soon (<30 days)' },
        { value: 'expired', label: 'Expired' },
        { value: 'valid', label: 'Valid' }
      ]},
      { key: 'prescriptionRequired', label: 'Prescription Required', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ]},
      { key: 'form', label: 'Form', options: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment'] },
    ],
  },
  [BUSINESS_TYPES.HARDWARE]: {
    label: 'Hardware Filters',
    filters: [
      { key: 'unit', label: 'Unit', options: ['Piece', 'Box', 'Set', 'Meter', 'Kg', 'Roll', 'Bucket', 'Bag'] },
      { key: 'material', label: 'Material', options: ['Steel', 'Plastic', 'Wood', 'Copper', 'Aluminum', 'Brass'] },
      { key: 'brand', label: 'Brand', options: [] }, // Dynamic from products
    ],
  },
  [BUSINESS_TYPES.ELECTRONICS]: {
    label: 'Electronics Filters',
    filters: [
      { key: 'brand', label: 'Brand', options: ['Samsung', 'Apple', 'Huawei', 'Xiaomi', 'Sony', 'LG', 'HP', 'Dell'] },
      { key: 'condition', label: 'Condition', options: ['New', 'Refurbished', 'Used'] },
      { key: 'warranty', label: 'Warranty', options: ['1 Year', '2 Years', '3 Years', 'No Warranty'] },
    ],
  },
  [BUSINESS_TYPES.GROCERY]: {
    label: 'Grocery Filters',
    filters: [
      { key: 'expiryStatus', label: 'Expiry Status', options: [
        { value: 'expiring_soon', label: 'Expiring Soon' },
        { value: 'expired', label: 'Expired' },
        { value: 'valid', label: 'Valid' }
      ]},
      { key: 'brand', label: 'Brand', options: [] },
      { key: 'organic', label: 'Organic', options: [
        { value: 'true', label: 'Organic Only' }
      ]},
    ],
  },
  [BUSINESS_TYPES.COSMETICS]: {
    label: 'Cosmetics Filters',
    filters: [
      { key: 'brand', label: 'Brand', options: [] },
      { key: 'shade', label: 'Shade', options: [] }, // Dynamic from products
      { key: 'skinType', label: 'Skin Type', options: ['Oily', 'Dry', 'Combination', 'Sensitive', 'Normal'] },
      { key: 'expiryStatus', label: 'Expiry Status', options: [
        { value: 'expiring_soon', label: 'Expiring Soon' },
        { value: 'expired', label: 'Expired' }
      ]},
    ],
  },
};

// Display fields for product cards by business type
export const PRODUCT_CARD_FIELDS = {
  [BUSINESS_TYPES.CLOTHING]: [
    { key: 'name', label: 'Name', show: true },
    { key: 'attributes.size', label: 'Size', show: true },
    { key: 'attributes.color', label: 'Color', show: true },
    { key: 'costPrice', label: 'Buying Price', show: true },
    { key: 'price', label: 'Selling Price', show: true },
    { key: 'stock', label: 'Stock', show: true },
  ],
  [BUSINESS_TYPES.PHARMACY]: [
    { key: 'name', label: 'Name', show: true },
    { key: 'attributes.strength', label: 'Strength', show: true },
    { key: 'attributes.form', label: 'Form', show: true },
    { key: 'attributes.prescriptionRequired', label: 'Rx Required', show: true, badge: true },
    { key: 'attributes.expiryDate', label: 'Expiry', show: true, date: true },
    { key: 'costPrice', label: 'Buying Price', show: true },
    { key: 'price', label: 'Selling Price', show: true },
    { key: 'stock', label: 'Stock', show: true },
  ],
  [BUSINESS_TYPES.HARDWARE]: [
    { key: 'name', label: 'Name', show: true },
    { key: 'attributes.specifications', label: 'Specs', show: true },
    { key: 'attributes.material', label: 'Material', show: true },
    { key: 'attributes.unit', label: 'Unit', show: true },
    { key: 'costPrice', label: 'Buying Price', show: true },
    { key: 'price', label: 'Selling Price', show: true },
    { key: 'stock', label: 'Stock', show: true },
  ],
  [BUSINESS_TYPES.ELECTRONICS]: [
    { key: 'name', label: 'Name', show: true },
    { key: 'attributes.model', label: 'Model', show: true },
    { key: 'attributes.brand', label: 'Brand', show: true },
    { key: 'attributes.condition', label: 'Condition', show: true },
    { key: 'attributes.warranty', label: 'Warranty', show: true },
    { key: 'costPrice', label: 'Buying Price', show: true },
    { key: 'price', label: 'Selling Price', show: true },
    { key: 'stock', label: 'Stock', show: true },
  ],
  [BUSINESS_TYPES.GROCERY]: [
    { key: 'name', label: 'Name', show: true },
    { key: 'attributes.weight', label: 'Weight', show: true },
    { key: 'attributes.brand', label: 'Brand', show: true },
    { key: 'attributes.expiryDate', label: 'Expiry', show: true, date: true },
    { key: 'costPrice', label: 'Buying Price', show: true },
    { key: 'price', label: 'Selling Price', show: true },
    { key: 'stock', label: 'Stock', show: true },
  ],
  [BUSINESS_TYPES.COSMETICS]: [
    { key: 'name', label: 'Name', show: true },
    { key: 'attributes.shade', label: 'Shade', show: true },
    { key: 'attributes.skinType', label: 'Skin Type', show: true },
    { key: 'attributes.expiryDate', label: 'Expiry', show: true, date: true },
    { key: 'costPrice', label: 'Buying Price', show: true },
    { key: 'price', label: 'Selling Price', show: true },
    { key: 'stock', label: 'Stock', show: true },
  ],
};

// Stock status configuration
export const getStockStatus = (stock, threshold = 10) => {
  if (stock === 0) {
    return { 
      status: 'out_of_stock', 
      label: 'Out of Stock', 
      color: 'red', 
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      icon: 'XCircle' 
    };
  }
  if (stock <= threshold) {
    return { 
      status: 'low_stock', 
      label: 'Low Stock', 
      color: 'orange', 
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700',
      icon: 'AlertTriangle' 
    };
  }
  return { 
    status: 'in_stock', 
    label: 'In Stock', 
    color: 'green', 
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    icon: 'CheckCircle' 
  };
};

// Check if expiry is approaching (within 30 days)
export const isExpiringSoon = (expiryDate) => {
  if (!expiryDate) return false;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  return expiry <= thirtyDaysFromNow && expiry >= today;
};

// Check if product is expired
export const isExpired = (expiryDate) => {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
};

export default {
  BUSINESS_TYPES,
  BUSINESS_CATEGORIES,
  BUSINESS_FILTERS,
  PRODUCT_CARD_FIELDS,
  getStockStatus,
  isExpiringSoon,
  isExpired,
};
