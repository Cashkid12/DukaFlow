const express = require('express');
const router = express.Router();
const { clerkAuth } = require('../middleware/clerkAuth');
const {
  getSettings,
  getCategories,
  updateProfile,
  updateCategories,
  updateAttributes,
  getBilling,
  changePlan,
  updatePayment,
  getInvoices,
  manageMultiBranch,
  exportData,
  updateNotifications,
  deleteAccount,
} = require('../controllers/settingsController');

// All settings routes require authentication
router.use(clerkAuth);

// Shop settings
router.get('/', getSettings);
router.get('/categories', getCategories);
router.put('/profile', updateProfile);
router.put('/categories', updateCategories);
router.put('/attributes', updateAttributes);

// Billing
router.get('/billing', getBilling);
router.get('/billing/invoices', getInvoices);
router.post('/billing/change-plan', changePlan);
router.put('/billing/payment', updatePayment);

// Multi-branch
router.post('/multi-branch', manageMultiBranch);

// Export
router.post('/export', exportData);

// Notifications
router.put('/notifications', updateNotifications);

// Delete account
router.delete('/delete-account', deleteAccount);

module.exports = router;
