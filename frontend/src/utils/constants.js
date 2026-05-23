// Business types — basic labels
export const BUSINESS_TYPES = [
  { value: 'clothing', label: 'Clothing & Fashion', icon: '👕' },
  { value: 'electronics', label: 'Electronics', icon: '📱' },
  { value: 'grocery', label: 'Grocery & Supermarket', icon: '🛒' },
  { value: 'pharmacy', label: 'Pharmacy', icon: '💊' },
  { value: 'hardware', label: 'Hardware & Construction', icon: '🔧' },
  { value: 'cosmetics', label: 'Cosmetics & Beauty', icon: '💄' },
  { value: 'other', label: 'Other', icon: '🏪' },
];

// Business type full config — with categories, attributes, and CSV template columns
export const BUSINESS_TYPE_CONFIG = {
  clothing: {
    name: 'Clothing Boutique',
    categories: ['Trousers', 'Shirts', 'Dresses', 'Jackets', 'Shoes', 'Accessories'],
    attributes: ['Size', 'Color', 'Material', 'Brand'],
    csvColumns: ['name', 'category', 'buyingPrice', 'sellingPrice', 'quantity', 'size', 'color', 'material', 'brand'],
    fields: {
      size: { label: 'Size', type: 'select', options: ['28', '30', '32', '34', '36', '38', '40', '42', 'XS', 'S', 'M', 'L', 'XL', 'XXL'], allowCustom: true },
      color: { label: 'Color', type: 'select', options: ['Black', 'White', 'Blue', 'Red', 'Green', 'Yellow', 'Pink', 'Purple', 'Grey', 'Brown', 'Navy', 'Orange'], allowCustom: true },
      brand: { label: 'Brand', type: 'text', placeholder: 'e.g., Levi\'s' },
      material: { label: 'Material', type: 'select', options: ['Cotton', 'Denim', 'Polyester', 'Wool', 'Leather', 'Silk', 'Linen', 'Nylon', 'Spandex', 'Velvet'], allowCustom: true },
    },
  },
  electronics: {
    name: 'Electronics Shop',
    categories: ['Phones', 'Laptops', 'Accessories', 'Parts', 'Cables', 'Audio'],
    attributes: ['Brand', 'Model', 'Condition', 'Warranty'],
    csvColumns: ['name', 'category', 'buyingPrice', 'sellingPrice', 'quantity', 'brand', 'model', 'condition', 'warranty'],
    fields: {
      brand: { label: 'Brand', type: 'select', options: ['Samsung', 'Apple', 'Huawei', 'Xiaomi', 'Oppo', 'Nokia', 'Sony', 'LG', 'Dell', 'HP', 'Lenovo'], allowCustom: true },
      model: { label: 'Model', type: 'text', placeholder: 'e.g., Galaxy S24' },
      condition: { label: 'Condition', type: 'select', options: ['New', 'Used', 'Refurbished'] },
      warranty: { label: 'Warranty (Months)', type: 'number', placeholder: 'e.g., 12' },
    },
  },
  grocery: {
    name: 'Grocery & Duka',
    categories: ['Beverages', 'Dry Foods', 'Fresh Produce', 'Dairy', 'Snacks', 'Household'],
    attributes: ['Weight/Volume', 'Brand', 'Expiry Date', 'Organic'],
    csvColumns: ['name', 'category', 'buyingPrice', 'sellingPrice', 'quantity', 'weight', 'brand', 'expiryDate', 'organic'],
    fields: {
      weight: { label: 'Weight/Volume', type: 'text', placeholder: 'e.g., 1 Litre, 500g' },
      brand: { label: 'Brand', type: 'text', placeholder: 'e.g., Bidco' },
      expiryDate: { label: 'Expiry Date', type: 'date' },
      organic: { label: 'Organic', type: 'radio', options: ['Yes', 'No'] },
    },
  },
  cosmetics: {
    name: 'Cosmetics Shop',
    categories: ['Makeup', 'Skincare', 'Hair', 'Fragrance', 'Nails', 'Tools'],
    attributes: ['Shade', 'Skin Type', 'Expiry Date', 'Brand'],
    csvColumns: ['name', 'category', 'buyingPrice', 'sellingPrice', 'quantity', 'shade', 'skinType', 'expiryDate', 'brand'],
    fields: {
      shade: { label: 'Shade', type: 'select', options: ['Ruby Red', 'Nude Beige', 'Coral Pink', 'Rose Gold', 'Berry', 'Mocha', 'Clear'], allowCustom: true },
      skinType: { label: 'Skin Type', type: 'select', options: ['All Skin', 'Oily', 'Dry', 'Combination', 'Sensitive'] },
      expiryDate: { label: 'Expiry Date', type: 'date' },
      brand: { label: 'Brand', type: 'text', placeholder: 'e.g., MAC' },
    },
  },
  hardware: {
    name: 'Hardware Store',
    categories: ['Tools', 'Paint', 'Electrical', 'Plumbing', 'Fasteners', 'Building'],
    attributes: ['Material', 'Size/Dimensions', 'Unit', 'Brand'],
    csvColumns: ['name', 'category', 'buyingPrice', 'sellingPrice', 'quantity', 'material', 'size', 'unit', 'brand'],
    fields: {
      material: { label: 'Material', type: 'select', options: ['Steel', 'Wood', 'Plastic', 'Aluminum', 'Copper', 'Brass', 'Iron', 'PVC', 'Rubber', 'Glass'], allowCustom: true },
      specifications: { label: 'Size/Dimensions', type: 'text', placeholder: 'e.g., 500g / 16oz' },
      unit: { label: 'Unit', type: 'select', options: ['Piece', 'Box', 'Set', 'Meter', 'Kg', 'Roll', 'Bucket', 'Bag', 'Pair', 'Pack'] },
      brand: { label: 'Brand', type: 'text', placeholder: 'e.g., Stanley' },
    },
  },
  pharmacy: {
    name: 'Pharmacy',
    categories: ['Prescription', 'OTC', 'First Aid', 'Vitamins', 'Personal Care', 'Baby'],
    attributes: ['Strength/Dosage', 'Form', 'Expiry Date', 'Prescription Required'],
    csvColumns: ['name', 'category', 'buyingPrice', 'sellingPrice', 'quantity', 'strength', 'form', 'expiryDate', 'brand', 'prescriptionRequired', 'batchNumber'],
    fields: {
      strength: { label: 'Strength/Dosage', type: 'text', placeholder: 'e.g., 500mg' },
      form: { label: 'Form', type: 'select', options: ['Tablet', 'Capsule', 'Syrup', 'Cream', 'Injection', 'Drops', 'Powder', 'Ointment'] },
      expiryDate: { label: 'Expiry Date', type: 'date' },
      brand: { label: 'Brand', type: 'text', placeholder: 'e.g., Panadol' },
      prescriptionRequired: { label: 'Prescription Required', type: 'radio', options: ['Yes', 'No'] },
      batchNumber: { label: 'Batch Number', type: 'text', placeholder: 'e.g., B2026-05-23' },
    },
  },
};

// Subscription plans
export const PLANS = {
  starta: {
    name: 'Starta',
    price: 750,
    users: 1,
    locations: 1,
    products: 500,
    features: ['Basic Reports', 'Inventory Tracking', 'Sales Management'],
  },
  kuuza: {
    name: 'Kuuza',
    price: 1500,
    users: 3,
    locations: 1,
    products: 2000,
    features: ['Advanced Reports', 'Credit Tracking', 'Worker Management', 'All Starta Features'],
    popular: true,
  },
  biashara: {
    name: 'Biashara',
    price: 3000,
    users: -1, // unlimited
    locations: -1,
    products: -1,
    features: ['Multi-Branch', 'Priority Support', 'Custom Integrations', 'All Kuuza Features'],
  },
};

// Payment methods
export const PAYMENT_METHODS = {
  cash: { label: 'Cash', icon: 'Banknote', color: 'success' },
  mpesa: { label: 'M-Pesa', icon: 'Smartphone', color: 'mpesa' },
  card: { label: 'Card', icon: 'CreditCard', color: 'info' },
};

// User roles
export const ROLES = {
  admin: {
    label: 'Admin',
    permissions: ['view_sales', 'record_sales', 'edit_inventory', 'view_reports', 'manage_workers', 'manage_settings'],
  },
  employee: {
    label: 'Employee',
    permissions: ['view_sales', 'record_sales', 'view_reports'],
  },
};

// Notification types
export const NOTIFICATION_TYPES = {
  low_stock: { icon: 'AlertTriangle', color: 'warning', label: 'Low Stock' },
  expiry: { icon: 'Clock', color: 'danger', label: 'Expiry Alert' },
  report: { icon: 'FileText', color: 'info', label: 'Report Ready' },
  system: { icon: 'Bell', color: 'neutral', label: 'System' },
  sale: { icon: 'ShoppingCart', color: 'success', label: 'Sale Completed' },
  worker_login: { icon: 'LogIn', color: 'primary', label: 'Worker Login' },
};

// Stock status
export const STOCK_STATUS = {
  in_stock: { label: 'In Stock', color: 'success' },
  low_stock: { label: 'Low Stock', color: 'warning' },
  out_of_stock: { label: 'Out of Stock', color: 'danger' },
};

// Expense categories
export const EXPENSE_CATEGORIES = [
  { value: 'rent', label: 'Rent' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'salary', label: 'Salaries' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'other', label: 'Other' },
];

// Time ranges for reports
export const TIME_RANGES = {
  '7D': { label: 'Last 7 Days', days: 7 },
  '30D': { label: 'Last 30 Days', days: 30 },
  '3M': { label: 'Last 3 Months', days: 90 },
  '6M': { label: 'Last 6 Months', days: 180 },
  '1Y': { label: 'Last Year', days: 365 },
};

// API base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// App name
export const APP_NAME = 'DukaFlow';

// Default low stock threshold
export const DEFAULT_LOW_STOCK_THRESHOLD = 10;
