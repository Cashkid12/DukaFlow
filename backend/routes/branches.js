const express = require('express');
const router = express.Router();
const { clerkAuth } = require('../middleware/clerkAuth');
const { getBranches, switchBranch, getBranchStats } = require('../controllers/branchController');

// All branch routes require authentication
router.use(clerkAuth);

// GET  /api/branches              — List all branches
// POST /api/branches/:id/switch   — Switch active branch
// GET  /api/branches/:id/stats    — Get branch statistics
router.get('/', getBranches);
router.post('/:branchId/switch', switchBranch);
router.get('/:branchId/stats', getBranchStats);

module.exports = router;
