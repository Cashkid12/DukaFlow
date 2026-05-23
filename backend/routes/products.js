const express = require('express');
const router = express.Router();
const { clerkAuth } = require('../middleware/clerkAuth');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getInventoryStats,
  getFilters,
  importCsv,
  downloadTemplate,
  getPriceHistory,
  getStockHistory,
  restockProduct,
  uploadImage,
} = require('../controllers/productController');

// All routes are protected with Clerk auth
router.use(clerkAuth);

// Stats route (before :id to avoid conflict)
router.get('/stats', getInventoryStats);

// Filters route (before :id)
router.get('/filters', getFilters);

// Template download (before :id)
router.get('/template', downloadTemplate);

// CSV import (before :id)
router.post('/import', importCsv);

// Product routes
router.route('/')
  .get(getProducts)
  .post(createProduct);

router.route('/:id')
  .get(getProduct)
  .put(updateProduct)
  .delete(deleteProduct);

// Stock update
router.patch('/:id/stock', updateStock);

// Price & stock history
router.get('/:id/price-history', getPriceHistory);
router.get('/:id/stock-history', getStockHistory);

// Restock
router.post('/:id/restock', restockProduct);

// Image upload
router.post('/:id/image', uploadImage);

module.exports = router;
