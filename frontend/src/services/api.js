import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Clerk session token to every request
api.interceptors.request.use(async (config) => {
  try {
    if (window.Clerk?.session) {
      const token = await window.Clerk.session.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // Clerk not available yet — continue without token
  }
  return config;
});

// Auth service
export const authService = {
  // Login
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Register
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Logout
  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token, password) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },
};

// Products service
export const productService = {
  // Get all products with filters
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  // Get single product
  getProduct: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Create product
  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  // Update product
  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  // Delete product
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Restock product
  restockProduct: async (id, quantity) => {
    const response = await api.post(`/products/${id}/restock`, { quantity });
    return response.data;
  },

  // Get categories
  getCategories: async () => {
    const response = await api.get('/products/categories');
    return response.data;
  },

  // Download CSV template for a business type
  downloadTemplate: async (businessType) => {
    const response = await api.get('/products/template', {
      params: { businessType },
      responseType: 'blob',
    });
    return response.data;
  },
};

// Sales/Transactions service
export const salesService = {
  // Get all sales
  getSales: async (params = {}) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  // Create sale
  createSale: async (saleData) => {
    const response = await api.post('/transactions', saleData);
    return response.data;
  },

  // Get sale details
  getSale: async (id) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  // Get receipt PDF
  getReceiptPDF: async (id) => {
    const response = await api.get(`/transactions/receipt/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Workers service
export const workerService = {
  // Get all workers
  getWorkers: async () => {
    const response = await api.get('/workers');
    return response.data;
  },

  // Invite worker
  inviteWorker: async (workerData) => {
    const response = await api.post('/workers', workerData);
    return response.data;
  },

  // Get worker details
  getWorker: async (id) => {
    const response = await api.get(`/workers/${id}`);
    return response.data;
  },

  // Update worker
  updateWorker: async (id, workerData) => {
    const response = await api.put(`/workers/${id}`, workerData);
    return response.data;
  },

  // Remove worker
  removeWorker: async (id) => {
    const response = await api.delete(`/workers/${id}`);
    return response.data;
  },

  // Logout worker sessions
  logoutWorkerSessions: async (id) => {
    const response = await api.post(`/workers/${id}/logout`);
    return response.data;
  },
};

// Reports service
export const reportService = {
  // Get daily report
  getDailyReport: async (date) => {
    const response = await api.get('/reports/daily', { params: { date } });
    return response.data;
  },

  // Get weekly report
  getWeeklyReport: async (startDate, endDate) => {
    const response = await api.get('/reports/weekly', { params: { startDate, endDate } });
    return response.data;
  },

  // Get monthly report
  getMonthlyReport: async (month, year) => {
    const response = await api.get('/reports/monthly', { params: { month, year } });
    return response.data;
  },

  // Email report
  emailReport: async (payload) => {
    const response = await api.post('/reports/email', payload);
    return response.data;
  },

  // Export PDF
  exportReport: async (type, date, month, year) => {
    const response = await api.get('/reports/export', { params: { type, date, month, year }, responseType: 'blob' });
    return response.data;
  },

  // Get products report
  getProductsReport: async (params = {}) => {
    const response = await api.get('/reports/products', { params });
    return response.data;
  },

  // Get single product report
  getSingleProductReport: async (id) => {
    const response = await api.get(`/reports/products/${id}`);
    return response.data;
  },

  // Get workers report
  getWorkersReport: async (params = {}) => {
    const response = await api.get('/reports/workers', { params });
    return response.data;
  },

  // Get single worker report
  getSingleWorkerReport: async (id) => {
    const response = await api.get(`/reports/workers/${id}`);
    return response.data;
  },
};

// Notifications service
export const notificationService = {
  // Get notifications
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  // Get notification settings
  getSettings: async () => {
    const response = await api.get('/notifications/settings');
    return response.data;
  },

  // Update notification settings
  updateSettings: async (settings) => {
    const response = await api.put('/notifications/settings', settings);
    return response.data;
  },
};

// Dashboard service
export const dashboardService = {
  // Get dashboard stats
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  // Get chart data
  getChartData: async (range = '7D') => {
    const response = await api.get('/dashboard/chart', { params: { range } });
    return response.data;
  },

  // Get recent transactions
  getRecentTransactions: async (limit = 5) => {
    const response = await api.get('/dashboard/recent-transactions', { params: { limit } });
    return response.data;
  },

  // Get alerts
  getAlerts: async () => {
    const response = await api.get('/dashboard/alerts');
    return response.data;
  },
};

// Branches service
export const branchService = {
  // Get all branches
  getBranches: async () => {
    const response = await api.get('/branches');
    return response.data;
  },

  // Switch active branch
  switchBranch: async (branchId) => {
    const response = await api.post(`/branches/${branchId}/switch`);
    return response.data;
  },

  // Get branch statistics
  getBranchStats: async (branchId) => {
    const response = await api.get(`/branches/${branchId}/stats`);
    return response.data;
  },
};

// Settings service
export const settingsService = {
  // Get full shop settings
  getSettings: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  // Update shop profile
  updateProfile: async (profileData) => {
    const response = await api.put('/settings/profile', profileData);
    return response.data;
  },

  // Get categories (from shop settings)
  getCategories: async () => {
    const response = await api.get('/settings/categories');
    return response.data;
  },

  // Update categories
  updateCategories: async (categories) => {
    const response = await api.put('/settings/categories', { categories });
    return response.data;
  },

  // Update attributes
  updateAttributes: async (attributes) => {
    const response = await api.put('/settings/attributes', { attributes });
    return response.data;
  },

  // Get billing info
  getBilling: async () => {
    const response = await api.get('/settings/billing');
    return response.data;
  },

  // Change plan
  changePlan: async (plan) => {
    const response = await api.post('/settings/billing/change-plan', { plan });
    return response.data;
  },

  // Update payment method
  updatePayment: async (paymentData) => {
    const response = await api.put('/settings/billing/payment', paymentData);
    return response.data;
  },

  // Get invoices
  getInvoices: async () => {
    const response = await api.get('/settings/billing/invoices');
    return response.data;
  },

  // Manage multi-branch (toggle/add/update/delete)
  manageMultiBranch: async (actionData) => {
    const response = await api.post('/settings/multi-branch', actionData);
    return response.data;
  },

  // Export data
  exportData: async (exportConfig) => {
    const response = await api.post('/settings/export', exportConfig, {
      responseType: exportConfig.type ? 'blob' : 'json',
    });
    return response.data;
  },

  // Update notification preferences
  updateNotifications: async (prefs) => {
    const response = await api.put('/settings/notifications', prefs);
    return response.data;
  },

  // Delete account
  deleteAccount: async () => {
    const response = await api.delete('/settings/delete-account');
    return response.data;
  },
};
