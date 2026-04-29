/**
 * Inventory Permissions Utility
 * Controls what different roles can do in inventory
 */

export const ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  CASHIER: 'cashier',
};

/**
 * Check if user can view inventory
 */
export const canViewInventory = (role) => {
  return [ROLES.OWNER, ROLES.MANAGER, ROLES.CASHIER].includes(role);
};

/**
 * Check if user can add products
 */
export const canAddProduct = (role) => {
  return [ROLES.OWNER, ROLES.MANAGER].includes(role);
};

/**
 * Check if user can edit products
 */
export const canEditProduct = (role) => {
  return [ROLES.OWNER, ROLES.MANAGER].includes(role);
};

/**
 * Check if user can delete products
 */
export const canDeleteProduct = (role) => {
  return role === ROLES.OWNER;
};

/**
 * Check if user can restock products
 */
export const canRestock = (role) => {
  return [ROLES.OWNER, ROLES.MANAGER].includes(role);
};

/**
 * Check if user can duplicate products
 */
export const canDuplicateProduct = (role) => {
  return [ROLES.OWNER, ROLES.MANAGER].includes(role);
};

/**
 * Get inventory permissions config based on role
 */
export const getInventoryPermissions = (role) => {
  const isCashier = role === ROLES.CASHIER;
  const isManager = role === ROLES.MANAGER;

  return {
    canView: true,
    canAdd: !isCashier,
    canEdit: !isCashier,
    canDelete: !isCashier && !isManager, // Only owner
    canRestock: !isCashier,
    canDuplicate: !isCashier,
    showQuickActions: !isCashier, // Hide three-dot menu for cashiers
  };
};

export default {
  ROLES,
  canViewInventory,
  canAddProduct,
  canEditProduct,
  canDeleteProduct,
  canRestock,
  canDuplicateProduct,
  getInventoryPermissions,
};
