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
} = require('../controllers/productController');

// All routes are protected with Clerk auth
router.use(clerkAuth);

// Stats route (before :id to avoid conflict)
router.get('/stats', getInventoryStats);

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

module.exports = router;
