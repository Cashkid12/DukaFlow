const express = require('express');
const router = express.Router();
const { clerkAuth } = require('../middleware/clerkAuth');

// Placeholder routes - implement as needed
router.get('/', clerkAuth, (req, res) => {
  res.json({ success: true, message: 'Get all sales' });
});

router.post('/', clerkAuth, (req, res) => {
  res.json({ success: true, message: 'Create sale' });
});

router.get('/:id', clerkAuth, (req, res) => {
  res.json({ success: true, message: 'Get single sale' });
});

module.exports = router;
