const express = require('express');
const router = express.Router();
const { clerkAuth } = require('../middleware/clerkAuth');
const Shop = require('../models/Shop');
const User = require('../models/User');

// @desc    Create shop and link to current user
// @route   POST /api/shop
// @access  Private
router.post('/', clerkAuth, async (req, res) => {
  try {
    const { name, slug, businessType, businessTypes, location, source, shopSize, settings } = req.body;

    if (!name || !slug || !businessType) {
      return res.status(400).json({ success: false, message: 'Name, slug, and businessType are required' });
    }

    // Check if slug is already taken
    const existing = await Shop.findOne({ slug });
    if (existing) {
      return res.status(409).json({ success: false, message: 'This shop URL is already taken' });
    }

    // Check if user already has a shop
    if (req.user.shop) {
      return res.status(400).json({ success: false, message: 'You already have a shop' });
    }

    // Create shop with all onboarding data
    const shopData = {
      name,
      slug,
      businessType,
      owner: req.user._id,
    };

    // Optional onboarding fields
    if (businessTypes?.length) shopData.businessTypes = businessTypes;
    if (location) shopData.location = location;
    if (source) shopData.source = source;
    if (shopSize) shopData.shopSize = shopSize;
    if (settings) {
      shopData.settings = {};
      if (settings.categories?.length) shopData.settings.categories = settings.categories;
      if (settings.attributes?.length) shopData.settings.attributes = settings.attributes;
    }

    const shop = await Shop.create(shopData);

    // Link shop to user
    req.user.shop = shop._id;
    await req.user.save();

    console.log(`✅ Shop created: ${name} (owner: ${req.user.email})`);
    res.status(201).json({ success: true, data: shop });
  } catch (error) {
    console.error('Create shop error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'This shop URL is already taken' });
    }
    res.status(500).json({ success: false, message: 'Failed to create shop' });
  }
});

// @desc    Get current user's shop info
// @route   GET /api/shop/me
// @access  Private
router.get('/me', clerkAuth, async (req, res) => {
  try {
    const shopId = req.user.shop;
    if (!shopId) {
      return res.status(400).json({ success: false, message: 'Shop not found' });
    }

    const shop = await Shop.findById(shopId)
      .select('name slug businessType businessTypes contact settings')
      .lean();

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    res.status(200).json({ success: true, data: shop });
  } catch (error) {
    console.error('Get shop error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shop' });
  }
});

module.exports = router;
