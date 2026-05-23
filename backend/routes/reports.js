const express = require('express');
const router = express.Router();
const { clerkAuth } = require('../middleware/clerkAuth');
const {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  emailReport,
  exportReport,
  getProductsReport,
  getSingleProductReport,
  getWorkersReport,
  getSingleWorkerReport,
} = require('../controllers/reportController');

router.use(clerkAuth);

router.get('/daily', getDailyReport);
router.get('/weekly', getWeeklyReport);
router.get('/monthly', getMonthlyReport);
router.post('/email', emailReport);
router.get('/export', exportReport);

// Product & Worker report routes
router.get('/products', getProductsReport);
router.get('/products/:id', getSingleProductReport);
router.get('/workers', getWorkersReport);
router.get('/workers/:id', getSingleWorkerReport);

module.exports = router;
