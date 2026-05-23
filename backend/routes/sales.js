const express = require('express');
const router = express.Router();
const { clerkAuth } = require('../middleware/clerkAuth');
const { createSale, getSales, getSale, markAsPaid, exportSales, getCreditCustomers } = require('../controllers/saleController');

// All routes are protected with Clerk auth
router.use(clerkAuth);

router.route('/')
  .get(getSales)
  .post(createSale);

// Export and customers MUST come before /:id routes
router.get('/export', exportSales);
router.get('/customers', getCreditCustomers);

router.get('/:id', getSale);
router.put('/:id/pay', markAsPaid);

module.exports = router;
