const Product = require('../models/Product');
const Shop = require('../models/Shop');
const PriceHistory = require('../models/PriceHistory');
const StockHistory = require('../models/StockHistory');

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
    } else if (sortBy === 'name') {
      sortOptions['name'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'stock') {
      sortOptions['stock'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'price') {
      sortOptions['price'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'costPrice') {
      sortOptions['costPrice'] = sortOrder === 'desc' ? -1 : 1;
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

    const totalPages = Math.ceil(total / parseInt(limit));
    const currentPage = parseInt(page);

    res.status(200).json({
      success: true,
      data: {
        products: productsWithStatus,
        total,
        page: currentPage,
        totalPages,
        hasMore: currentPage < totalPages,
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
    const shopId = req.user.shop;
    const shop = await Shop.findById(shopId).lean();
    const threshold = shop?.settings?.lowStockThreshold || 10;

    const product = await Product.findOne({
      _id: req.params.id,
      shop: shopId,
      isActive: true,
    })
      .populate('createdBy', 'fullName email')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Add computed status
    const productWithStatus = {
      ...product,
      status: product.stock <= 0 ? 'out_of_stock' : product.stock <= threshold ? 'low_stock' : 'in_stock',
    };

    res.status(200).json({
      success: true,
      data: productWithStatus,
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
    const shopId = req.user.shop;
    const product = await Product.findOne({ _id: req.params.id, shop: shopId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const oldCostPrice = product.costPrice;
    const oldPrice = product.price;

    // Update the product
    Object.assign(product, req.body);
    await product.save();

    // Track price history if prices changed
    const costPriceChanged = req.body.costPrice != null && req.body.costPrice !== oldCostPrice;
    const sellingPriceChanged = req.body.price != null && req.body.price !== oldPrice;

    if (costPriceChanged || sellingPriceChanged) {
      const field = costPriceChanged && sellingPriceChanged ? 'both' : costPriceChanged ? 'costPrice' : 'price';
      await PriceHistory.create({
        product: product._id,
        shop: shopId,
        field,
        oldCostPrice: costPriceChanged ? oldCostPrice : undefined,
        newCostPrice: costPriceChanged ? req.body.costPrice : undefined,
        oldSellingPrice: sellingPriceChanged ? oldPrice : undefined,
        newSellingPrice: sellingPriceChanged ? req.body.price : undefined,
        reason: req.body.priceChangeReason || 'Manual update',
        changedBy: req.userId,
      });
    }

    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.to(shopId.toString()).emit('product:updated', product);
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
    const shopId = req.user.shop;
    const { stock, operation, reference, notes } = req.body;

    const product = await Product.findOne({ _id: req.params.id, shop: shopId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const previousStock = product.stock;
    let newStock;
    let stockType;

    if (operation === 'add') {
      newStock = previousStock + stock;
      stockType = 'added';
    } else if (operation === 'subtract') {
      newStock = Math.max(0, previousStock - stock);
      stockType = 'sold';
    } else {
      newStock = stock;
      stockType = 'adjusted';
    }

    product.stock = newStock;
    await product.save();

    // Track stock history
    await StockHistory.create({
      product: product._id,
      shop: shopId,
      type: req.body.type || stockType,
      quantity: operation === 'subtract' ? -Math.abs(stock) : (stock || (newStock - previousStock)),
      previousStock,
      newStock,
      reference: reference || '',
      notes: notes || '',
      performedBy: req.userId,
    });

    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.to(shopId.toString()).emit('stock:updated', { product, previousStock, newStock });
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

// @desc    Get dynamic filters for inventory
// @route   GET /api/products/filters
// @access  Private
exports.getFilters = async (req, res) => {
  try {
    const shopId = req.user.shop;
    
    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'Shop not found. Please complete onboarding.',
      });
    }

    const shop = await Shop.findById(shopId).lean();

    // Get categories with counts from actual products
    const categoryAgg = await Product.aggregate([
      { $match: { shop: shopId, isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // If no products yet, return shop's default categories with count 0
    const defaultCategories = shop?.settings?.categories || [];
    const categoriesMap = {};
    defaultCategories.forEach(cat => { categoriesMap[cat] = 0; });
    categoryAgg.forEach(cat => { categoriesMap[cat._id] = cat.count; });

    const categories = Object.entries(categoriesMap).map(([name, count]) => ({
      name,
      count,
    }));

    // Get distinct attribute values from all active products
    const attrAgg = await Product.aggregate([
      { $match: { shop: shopId, isActive: true } },
      {
        $group: {
          _id: null,
          sizes: { $addToSet: '$attributes.size' },
          colors: { $addToSet: '$attributes.color' },
          brands: { $addToSet: '$attributes.brand' },
          materials: { $addToSet: '$attributes.material' },
          units: { $addToSet: '$attributes.unit' },
          conditions: { $addToSet: '$attributes.condition' },
          forms: { $addToSet: '$attributes.form' },
        },
      },
    ]);

    const attributes = attrAgg[0] ? {
      size: attrAgg[0].sizes.filter(Boolean).sort(),
      color: attrAgg[0].colors.filter(Boolean).sort(),
      brand: attrAgg[0].brands.filter(Boolean).sort(),
      material: attrAgg[0].materials.filter(Boolean).sort(),
      unit: attrAgg[0].units.filter(Boolean).sort(),
      condition: attrAgg[0].conditions.filter(Boolean).sort(),
      form: attrAgg[0].forms.filter(Boolean).sort(),
    } : {};

    // Filter out empty arrays
    Object.keys(attributes).forEach(key => {
      if (!attributes[key]?.length) delete attributes[key];
    });

    // Get price range
    const priceRange = await Product.aggregate([
      { $match: { shop: shopId, isActive: true } },
      {
        $group: {
          _id: null,
          min: { $min: '$price' },
          max: { $max: '$price' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        categories: categories.length ? categories : defaultCategories.map(c => ({ name: c, count: 0 })),
        attributes,
        priceRange: priceRange[0]?.min != null
          ? { min: priceRange[0].min, max: priceRange[0].max }
          : { min: 0, max: 0 },
      },
    });
  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filters',
    });
  }
};

// @desc    Import products from CSV
// @route   POST /api/products/import
// @access  Private
exports.importCsv = async (req, res) => {
  try {
    const shopId = req.user.shop;
    
    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'Shop not found. Please complete onboarding.',
      });
    }

    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No products data provided',
      });
    }

    const shop = await Shop.findById(shopId);
    const validationErrors = [];
    const validProducts = [];

    products.forEach((row, index) => {
      const errors = [];
      
      if (!row.name?.trim()) errors.push('Missing product name');
      if (!row.category?.trim()) errors.push('Missing category');
      if (row.sellingPrice == null || isNaN(Number(row.sellingPrice)) || Number(row.sellingPrice) < 0) {
        errors.push('Invalid selling price');
      }
      if (row.buyingPrice != null && (isNaN(Number(row.buyingPrice)) || Number(row.buyingPrice) < 0)) {
        errors.push('Invalid buying price');
      }
      if (row.quantity != null && (isNaN(Number(row.quantity)) || Number(row.quantity) < 0)) {
        errors.push('Invalid quantity');
      }

      if (errors.length > 0) {
        validationErrors.push({ row: index + 1, errors, data: row });
      } else {
        const product = {
          shop: shopId,
          name: row.name.trim(),
          category: row.category.trim(),
          price: Number(row.sellingPrice) || 0,
          costPrice: Number(row.buyingPrice) || 0,
          stock: Number(row.quantity) || 0,
          attributes: {},
        };

        if (row.size?.trim()) product.attributes.size = row.size.trim();
        if (row.color?.trim()) product.attributes.color = row.color.trim();
        if (row.brand?.trim()) product.attributes.brand = row.brand.trim();
        if (row.material?.trim()) product.attributes.material = row.material.trim();
        if (row.unit?.trim()) product.attributes.unit = row.unit.trim();
        if (row.expiryDate) {
          const date = new Date(row.expiryDate);
          if (!isNaN(date.getTime())) product.attributes.expiryDate = date;
        }
        if (row.description?.trim()) product.description = row.description.trim();
        if (row.sku?.trim()) product.sku = row.sku.trim();

        validProducts.push(product);
      }
    });

    // Insert valid products
    let inserted = [];
    if (validProducts.length > 0) {
      inserted = await Product.insertMany(validProducts);
    }

    res.status(200).json({
      success: true,
      data: {
        imported: inserted.length,
        skipped: validationErrors.length,
        total: products.length,
        validationErrors: validationErrors.map(e => ({
          row: e.row,
          errors: e.errors,
        })),
        products: inserted,
      },
    });
  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to import products',
    });
  }
};

// @desc    Download CSV template (business-type aware)
// @route   GET /api/products/template?type=clothing
// @access  Private
exports.downloadTemplate = async (req, res) => {
  try {
    const { businessType } = req.query;

    // Validate businessType is provided
    if (!businessType) {
      return res.status(400).json({
        success: false,
        message: 'Business type is required',
      });
    }

    // Business-type-specific templates
    const BUSINESS_TYPE_COLUMNS = {
      clothing: {
        columns: ['name', 'category', 'buyingPrice', 'sellingPrice', 'quantity', 'size', 'color', 'material', 'brand'],
        example: ['Slim Fit Jeans', 'Trousers', '1200', '1800', '12', '32', 'Blue', 'Denim', "Levi's"],
      },
      electronics: {
        columns: ['name', 'category', 'buyingPrice', 'sellingPrice', 'quantity', 'brand', 'model', 'condition', 'warranty'],
        example: ['Samsung Galaxy S24', 'Phones', '45000', '55000', '5', 'Samsung', 'Galaxy S24', 'New', '12'],
      },
      grocery: {
        columns: ['name', 'category', 'buyingPrice', 'sellingPrice', 'quantity', 'weight', 'brand', 'expiryDate', 'organic'],
        example: ['Cooking Oil 1L', 'Cooking Essentials', '180', '230', '24', '1 Litre', 'Bidco', '2026-12-15', 'No'],
      },
      cosmetics: {
        columns: ['name', 'category', 'buyingPrice', 'sellingPrice', 'quantity', 'shade', 'skinType', 'expiryDate', 'brand'],
        example: ['Ruby Red Lipstick', 'Makeup', '350', '500', '15', 'Ruby Red', 'All Skin', '2026-12-15', 'MAC'],
      },
      hardware: {
        columns: ['name', 'category', 'buyingPrice', 'sellingPrice', 'quantity', 'material', 'size', 'unit', 'brand'],
        example: ['Claw Hammer 500g', 'Tools', '350', '550', '15', 'Steel/Wood', '500g', 'Piece', 'Stanley'],
      },
      pharmacy: {
        columns: ['name', 'category', 'buyingPrice', 'sellingPrice', 'quantity', 'strength', 'form', 'expiryDate', 'brand', 'prescriptionRequired', 'batchNumber'],
        example: ['Paracetamol', 'OTC', '180', '250', '45', '500mg', 'Tablet', '2026-12-15', 'Panadol', 'No', 'B2026-001'],
      },
    };

    // Validate businessType is supported
    if (!BUSINESS_TYPE_COLUMNS[businessType]) {
      const supportedTypes = Object.keys(BUSINESS_TYPE_COLUMNS).join(', ');
      return res.status(400).json({
        success: false,
        message: `Invalid business type. Supported types: ${supportedTypes}`,
      });
    }

    const tpl = BUSINESS_TYPE_COLUMNS[businessType];

    // Helper: wrap values containing commas or special chars in double quotes
    const escapeCsvField = (val) => {
      const s = String(val);
      if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };

    const headerRow = tpl.columns.map(escapeCsvField).join(',');
    const exampleRow = tpl.example.map(escapeCsvField).join(',');
    // UTF-8 BOM for Excel compatibility + CRLF line endings
    const csvContent = '\uFEFF' + headerRow + '\r\n' + exampleRow + '\r\n';
    const filename = `dukaflow-${businessType}-template.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Template download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate template',
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

// @desc    Get product price history
// @route   GET /api/products/:id/price-history
// @access  Private
exports.getPriceHistory = async (req, res) => {
  try {
    const shopId = req.user.shop;
    const history = await PriceHistory.find({
      product: req.params.id,
      shop: shopId,
    })
      .populate('changedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Get price history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price history',
    });
  }
};

// @desc    Get product stock history
// @route   GET /api/products/:id/stock-history
// @access  Private
exports.getStockHistory = async (req, res) => {
  try {
    const shopId = req.user.shop;
    const history = await StockHistory.find({
      product: req.params.id,
      shop: shopId,
    })
      .populate('performedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Get stock history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock history',
    });
  }
};

// @desc    Restock product (add stock + optional price update)
// @route   POST /api/products/:id/restock
// @access  Private
exports.restockProduct = async (req, res) => {
  try {
    const shopId = req.user.shop;
    const { quantity, newCostPrice, newSellingPrice, supplier } = req.body;

    if (!quantity || parseInt(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required',
      });
    }

    const product = await Product.findOne({ _id: req.params.id, shop: shopId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const previousStock = product.stock;
    const qty = parseInt(quantity);

    // Update stock
    product.stock = previousStock + qty;

    // Update prices if provided
    const oldCostPrice = product.costPrice;
    const oldPrice = product.price;

    if (newCostPrice != null) product.costPrice = parseFloat(newCostPrice);
    if (newSellingPrice != null) product.price = parseFloat(newSellingPrice);

    await product.save();

    // Track stock history
    await StockHistory.create({
      product: product._id,
      shop: shopId,
      type: 'restock',
      quantity: qty,
      previousStock,
      newStock: product.stock,
      reference: supplier ? `Supplier: ${supplier}` : 'Manual restock',
      notes: '',
      performedBy: req.userId,
    });

    // Track price history if prices changed
    const costPriceChanged = newCostPrice != null && newCostPrice !== oldCostPrice;
    const sellingPriceChanged = newSellingPrice != null && newSellingPrice !== oldPrice;

    if (costPriceChanged || sellingPriceChanged) {
      const field = costPriceChanged && sellingPriceChanged ? 'both' : costPriceChanged ? 'costPrice' : 'price';
      await PriceHistory.create({
        product: product._id,
        shop: shopId,
        field,
        oldCostPrice: costPriceChanged ? oldCostPrice : undefined,
        newCostPrice: costPriceChanged ? parseFloat(newCostPrice) : undefined,
        oldSellingPrice: sellingPriceChanged ? oldPrice : undefined,
        newSellingPrice: sellingPriceChanged ? parseFloat(newSellingPrice) : undefined,
        reason: 'Restock price update',
        changedBy: req.userId,
      });
    }

    // Emit Socket.io events
    const io = req.app.get('io');
    if (io) {
      io.to(shopId.toString()).emit('stock:updated', { product, previousStock, newStock: product.stock });
      io.to(shopId.toString()).emit('product:updated', product);
    }

    res.status(200).json({
      success: true,
      data: {
        product,
        previousStock,
        newStock: product.stock,
        quantityAdded: qty,
      },
    });
  } catch (error) {
    console.error('Restock error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to restock product',
    });
  }
};

// @desc    Upload product image
// @route   POST /api/products/:id/image
// @access  Private
exports.uploadImage = async (req, res) => {
  try {
    const shopId = req.user.shop;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required',
      });
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, shop: shopId },
      { $push: { images: imageUrl } },
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
      data: product,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
    });
  }
};
