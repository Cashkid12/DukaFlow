/**
 * Dashboard Permissions Utility
 * Controls what different roles can see
 */

export const ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  STAFF: 'staff',
};

/**
 * Check if user can view dashboard
 */
export const canViewDashboard = (role) => {
  return [ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF].includes(role);
};

/**
 * Check if user can view profit metrics
 */
export const canViewProfit = (role) => {
  return [ROLES.OWNER, ROLES.MANAGER].includes(role);
};

/**
 * Check if user can view worker performance
 */
export const canViewWorkerPerformance = (role) => {
  return [ROLES.OWNER, ROLES.MANAGER].includes(role);
};

/**
 * Check if user can view chart data
 */
export const canViewChart = (role) => {
  return [ROLES.OWNER, ROLES.MANAGER].includes(role);
};

/**
 * Check if user can view all transactions or only their own
 */
export const canViewAllTransactions = (role) => {
  return [ROLES.OWNER, ROLES.MANAGER].includes(role);
};

/**
 * Get dashboard view configuration based on role
 */
export const getDashboardConfig = (role) => {
  const isStaff = role === ROLES.STAFF;

  return {
    showTodaySales: true, // Everyone can see this
    showProfit: !isStaff,
    showLowStock: !isStaff,
    showActiveWorkers: !isStaff,
    showChart: !isStaff,
    showAllTransactions: !isStaff,
    showWorkerPerformance: !isStaff,
    showAlerts: !isStaff,
  };
};

export default {
  ROLES,
  canViewDashboard,
  canViewProfit,
  canViewWorkerPerformance,
  canViewChart,
  canViewAllTransactions,
  getDashboardConfig,
};
