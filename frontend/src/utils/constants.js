// Business types
export const BUSINESS_TYPES = [
  { value: 'clothing', label: 'Clothing & Fashion', icon: '👕' },
  { value: 'electronics', label: 'Electronics', icon: '📱' },
  { value: 'grocery', label: 'Grocery & Supermarket', icon: '🛒' },
  { value: 'pharmacy', label: 'Pharmacy', icon: '💊' },
  { value: 'hardware', label: 'Hardware & Construction', icon: '🔧' },
  { value: 'cosmetics', label: 'Cosmetics & Beauty', icon: '💄' },
  { value: 'other', label: 'Other', icon: '🏪' },
];

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
