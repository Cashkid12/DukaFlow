const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/dashboardController');
const { clerkAuth } = require('../middleware/clerkAuth');

// @route   GET /api/dashboard
// @desc    Get dashboard data
// @access  Private (Clerk)
router.get('/', clerkAuth, getDashboardData);

module.exports = router;
