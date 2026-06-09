/**
 * DukaFlow Permissions System
 *
 * Centralizes all role-based access control across the application.
 * Role enum matches User model: 'admin' | 'manager' | 'cashier'
 *
 * ADMIN    — Full access: manage everything, settings, billing
 * MANAGER  — Standard access: inventory, sales, reports (no worker mgmt, no settings)
 * CASHIER  — Limited access: POS sales only, view-only inventory
 */

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
};

const ROLE_HIERARCHY = {
  admin: 3,
  manager: 2,
  cashier: 1,
};

/**
 * Check if user has at least the given minimum role level.
 */
export const hasMinRole = (userRole, minRole) =>
  (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minRole] || 0);

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const canViewDashboard = () => true;
export const canViewProfit = (role) => hasMinRole(role, 'manager');

// ─── Sales ────────────────────────────────────────────────────────────────────
export const canRecordSales = () => true;
export const canViewAllSales = (role) => hasMinRole(role, 'manager');
export const canApplyDiscounts = (role) => hasMinRole(role, 'manager');

// ─── Inventory ────────────────────────────────────────────────────────────────
export const canViewInventory = () => true;
export const canAddProduct = (role) => hasMinRole(role, 'manager');
export const canEditProduct = (role) => hasMinRole(role, 'manager');
export const canDeleteProduct = (role) => role === ROLES.ADMIN;
export const canRestockProduct = (role) => hasMinRole(role, 'manager');

// ─── Reports ──────────────────────────────────────────────────────────────────
export const canViewReports = (role) => hasMinRole(role, 'manager');
export const canExportReports = (role) => role === ROLES.ADMIN;

// ─── Workers ──────────────────────────────────────────────────────────────────
export const canViewWorkers = (role) => hasMinRole(role, 'manager');
export const canAddWorkers = (role) => role === ROLES.ADMIN;
export const canEditWorkers = (role) => role === ROLES.ADMIN;
export const canRemoveWorkers = (role) => role === ROLES.ADMIN;

// ─── Settings ─────────────────────────────────────────────────────────────────
export const canManageSettings = (role) => role === ROLES.ADMIN;
export const canViewBilling = (role) => role === ROLES.ADMIN;

// ─── Customers ────────────────────────────────────────────────────────────────
export const canViewCustomers = () => true;
export const canManageCustomers = (role) => hasMinRole(role, 'manager');

// ─── Navigation Visibility ────────────────────────────────────────────────────
export const getSidebarItems = (role) => {
  const isCashier = role === ROLES.CASHIER;
  const items = [
    { key: 'dashboard', label: isCashier ? 'Home' : 'Dashboard', path: '/dashboard' },
    { key: 'inventory', label: 'Inventory', path: '/dashboard/inventory' },
    { key: 'sales', label: isCashier ? 'New Sale' : 'Sales', path: '/dashboard/sales' },
  ];

  if (hasMinRole(role, 'manager')) {
    items.push({ key: 'workers', label: 'Workers', path: '/dashboard/workers' });
    items.push({ key: 'reports', label: 'Reports', path: '/dashboard/reports' });
  }

  if (role === ROLES.ADMIN) {
    items.push({ key: 'settings', label: 'Settings', path: '/dashboard/settings' });
  }

  return items;
};

export const getMobileNavItems = (role) => {
  const isCashier = role === ROLES.CASHIER;
  const items = [
    { key: 'home', label: 'Home', path: '/dashboard' },
    { key: 'inventory', label: 'Inventory', path: '/dashboard/inventory' },
    { key: 'sales', label: isCashier ? 'New Sale' : 'Sales', path: '/dashboard/sales' },
  ];

  if (role === ROLES.ADMIN) {
    items.push({ key: 'reports', label: 'Reports', path: '/dashboard/reports' });
    items.push({ key: 'menu', label: 'Menu', path: '/dashboard/settings' });
  } else if (role === ROLES.MANAGER) {
    items.push({ key: 'reports', label: 'Reports', path: '/dashboard/reports' });
    items.push({ key: 'menu', label: 'Menu', path: '/dashboard/settings' });
  }
  // Cashiers: only Home, Inventory, Sales — no Reports or Menu

  return items;
};

// ─── Complete Permissions Config ──────────────────────────────────────────────
export const PERMISSION_DEFINITIONS = {
  record_sales: { category: 'Sales', label: 'Record Sales', desc: 'Process sales at the POS register' },
  view_all_sales: { category: 'Sales', label: 'View All Sales', desc: 'See all transactions across the shop' },
  apply_discounts: { category: 'Sales', label: 'Apply Discounts', desc: 'Apply percentage or fixed discounts' },

  view_inventory: { category: 'Inventory', label: 'View Inventory', desc: 'Browse and search products' },
  add_products: { category: 'Inventory', label: 'Add Products', desc: 'Create new product listings' },
  edit_products: { category: 'Inventory', label: 'Edit Products', desc: 'Modify existing product details' },
  delete_products: { category: 'Inventory', label: 'Delete Products', desc: 'Remove products permanently' },
  restock_products: { category: 'Inventory', label: 'Restock Products', desc: 'Adjust stock quantities' },

  view_reports: { category: 'Reports', label: 'View Reports', desc: 'Access sales and performance reports' },
  view_profit: { category: 'Reports', label: 'View Profit', desc: 'See profit margins and financial data' },
  export_reports: { category: 'Reports', label: 'Export Reports', desc: 'Download reports as CSV or PDF' },

  view_workers: { category: 'Workers', label: 'View Workers', desc: 'See team members and their performance' },
  manage_workers: { category: 'Workers', label: 'Manage Workers', desc: 'Invite, edit, or remove team members' },

  manage_settings: { category: 'Settings', label: 'Manage Settings', desc: 'Configure shop preferences and billing' },
};

export const getRolePermissions = (role) => {
  switch (role) {
    case ROLES.ADMIN:
      return Object.keys(PERMISSION_DEFINITIONS);
    case ROLES.MANAGER:
      return [
        'record_sales', 'view_all_sales', 'apply_discounts',
        'view_inventory', 'add_products', 'edit_products', 'restock_products',
        'view_reports', 'view_profit',
        'view_workers',
      ];
    case ROLES.CASHIER:
      return ['record_sales', 'view_inventory'];
    default:
      return [];
  }
};

export const getImmutablePermissions = (role) => {
  // Permissions that can't be toggled below the role minimum
  switch (role) {
    case ROLES.ADMIN:
      return []; // Admin can change anything
    case ROLES.MANAGER:
      return ['manage_workers', 'export_reports', 'delete_products', 'manage_settings'];
    case ROLES.CASHIER:
      return [
        'view_all_sales', 'apply_discounts',
        'add_products', 'edit_products', 'delete_products', 'restock_products',
        'view_reports', 'view_profit', 'export_reports',
        'view_workers', 'manage_workers',
        'manage_settings',
      ];
    default:
      return [];
  }
};

export default {
  ROLES,
  hasMinRole,
  canViewDashboard,
  canViewProfit,
  canRecordSales,
  canViewAllSales,
  canApplyDiscounts,
  canViewInventory,
  canAddProduct,
  canEditProduct,
  canDeleteProduct,
  canRestockProduct,
  canViewReports,
  canExportReports,
  canViewWorkers,
  canAddWorkers,
  canEditWorkers,
  canRemoveWorkers,
  canManageSettings,
  canViewBilling,
  canViewCustomers,
  canManageCustomers,
  getSidebarItems,
  getMobileNavItems,
  PERMISSION_DEFINITIONS,
  getRolePermissions,
  getImmutablePermissions,
};
