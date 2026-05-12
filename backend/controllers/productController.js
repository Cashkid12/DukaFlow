const Product = require('../models/Product');
const Shop = require('../models/Shop');

// @desc    Get all products for a shop with filtering
// @route   GET /api/products
// @access  Private
exports.getProducts = async (req, res) => {
  try {
    const shopId = req.user.shop;
    
    console.log('📦 Fetching products for shop:', shopId);
    console.log('👤 User:', req.user.fullName, '| Clerk ID:', req.user.clerkId);
    
    if (!shopId) {
      console.log('⚠️ No shop found for user');
      return res.status(400).json({
        success: false,
        message: 'Shop not found. Please complete onboarding.',
      });
    }
    
    const { 
      search, 
      category, 
      stockStatus, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      // Business-type specific filters
      size,
      color,
      expiryStatus,
      prescriptionRequired,
      unit,
      material,
      brand,
      condition,
    } = req.query;

    // Build query
    const query = { shop: shopId, isActive: true };

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Fetch shop settings once for threshold
    const shop = await Shop.findById(shopId).lean();
    const threshold = shop?.settings?.lowStockThreshold || 10;

    // Filter by stock status
    if (stockStatus) {
      switch (stockStatus) {
        case 'in_stock':
          query.stock = { $gt: threshold };
          break;
        case 'low_stock':
          query.stock = { $gt: 0, $lte: threshold };
          break;
        case 'out_of_stock':
          query.stock = 0;
          break;
      }
    }

    // Business-type specific filters
    if (size) query['attributes.size'] = size;
    if (color) query['attributes.color'] = color;
    if (unit) query['attributes.unit'] = unit;
    if (material) query['attributes.material'] = material;
    if (brand) query['attributes.brand'] = brand;
    if (condition) query['attributes.condition'] = condition;
    
    if (prescriptionRequired) {
      query['attributes.prescriptionRequired'] = prescriptionRequired === 'true';
    }

    if (expiryStatus) {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      switch (expiryStatus) {
        case 'expiring_soon':
          query['attributes.expiryDate'] = { $lte: thirtyDaysFromNow, $gte: today };
          break;
        case 'expired':
          query['attributes.expiryDate'] = { $lt: today };
          break;
        case 'valid':
          query['attributes.expiryDate'] = { $gte: thirtyDaysFromNow };
          break;
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort
    const sortOptions = {};
    
    // Handle special case for expiry date sorting
    if (sortBy === 'expiry') {
      sortOptions['attributes.expiryDate'] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Execute query
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    // Get unique categories for filter
    const categories = await Product.distinct('category', { shop: shopId, isActive: true });

    // Get distinct filter values from all active products
    const distinctFilters = await Product.aggregate([
      { $match: { shop: shopId, isActive: true } },
      {
        $group: {
          _id: null,
          sizes: { $addToSet: '$attributes.size' },
          colors: { $addToSet: '$attributes.color' },
          brands: { $addToSet: '$attributes.brand' },
        },
      },
    ]);

    const filters = (distinctFilters[0]) ? {
      sizes: distinctFilters[0].sizes.filter(Boolean),
      colors: distinctFilters[0].colors.filter(Boolean),
      brands: distinctFilters[0].brands.filter(Boolean),
    } : { sizes: [], colors: [], brands: [] };

    // Add computed status to each product
    const productsWithStatus = products.map((p) => ({
      ...p,
      status: p.stock <= 0 ? 'out_of_stock' : p.stock <= threshold ? 'low_stock' : 'in_stock',
    }));

    console.log(`✅ Found ${products.length} products (total: ${total})`);

    res.status(200).json({
      success: true,
      data: {
        products: productsWithStatus,
        total,
        categories,
        filters,
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      shop: req.user.shop,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private
exports.createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      shop: req.user.shop,
    };

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, shop: req.user.shop },
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete product (soft delete)
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, shop: req.user.shop },
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
    });
  }
};

// @desc    Update stock
// @route   PATCH /api/products/:id/stock
// @access  Private
exports.updateStock = async (req, res) => {
  try {
    const { stock, operation } = req.body; // operation: 'set', 'add', 'subtract'

    let updateQuery = {};
    
    if (operation === 'add') {
      updateQuery = { $inc: { stock } };
    } else if (operation === 'subtract') {
      updateQuery = { $inc: { stock: -stock } };
    } else {
      updateQuery = { stock };
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, shop: req.user.shop },
      updateQuery,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get inventory statistics
// @route   GET /api/products/stats
// @access  Private
exports.getInventoryStats = async (req, res) => {
  try {
    const shopId = req.user.shop;
    const shop = await Shop.findById(shopId);
    const threshold = shop?.settings?.lowStockThreshold || 10;

    const stats = await Product.aggregate([
      { $match: { shop: shopId, isActive: true } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
          totalCost: { $sum: { $multiply: ['$costPrice', '$stock'] } },
          inStock: {
            $sum: { $cond: [{ $gt: ['$stock', threshold] }, 1, 0] },
          },
          lowStock: {
            $sum: { $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', threshold] }] }, 1, 0] },
          },
          outOfStock: {
            $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] },
          },
        },
      },
    ]);

    const categories = await Product.aggregate([
      { $match: { shop: shopId, isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: stats[0] || {
          totalProducts: 0,
          totalStock: 0,
          totalValue: 0,
          totalCost: 0,
          inStock: 0,
          lowStock: 0,
          outOfStock: 0,
        },
        categories,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory stats',
    });
  }
};
