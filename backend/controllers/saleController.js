const Sale = require('../models/Sale');
const Product = require('../models/Product');
const StockHistory = require('../models/StockHistory');

// @desc    Create a new sale (POS transaction)
// @route   POST /api/sales
// @access  Private
exports.createSale = async (req, res) => {
  try {
    const shopId = req.user.shop;
    if (!shopId) {
      return res.status(400).json({ success: false, message: 'Shop not found' });
    }

    const {
      items, subtotal, discount, total, paymentMethod, paymentStatus,
      amountPaid, soldBy, customerName, customerPhone, dueDate, paymentDetails, notes,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required' });
    }

    if (!paymentMethod || !['cash', 'mpesa', 'card'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Valid payment method is required' });
    }

    // Validate stock for each item and build sale items
    const saleItems = [];
    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, shop: shopId, isActive: true });
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.name || item.productId}" not found`,
        });
      }

      const qty = parseInt(item.quantity) || 1;
      if (product.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for "${product.name}". Available: ${product.stock}, Requested: ${qty}`,
        });
      }

      saleItems.push({
        product: product._id,
        name: product.name,
        quantity: qty,
        price: Number(item.price) || product.price,
        total: (Number(item.price) || product.price) * qty,
      });
    }

    // Calculate sale numbers
    const count = await Sale.countDocuments({ shop: shopId });
    const saleNumber = `INV-${String(count + 1).padStart(5, '0')}`;

    const computedSubtotal = saleItems.reduce((sum, i) => sum + i.total, 0);
    const computedTotal = Math.max(0, computedSubtotal - (Number(discount) || 0));

    // Create the sale
    const sale = await Sale.create({
      shop: shopId,
      saleNumber,
      items: saleItems,
      subtotal: subtotal || computedSubtotal,
      discount: discount || 0,
      total: total || computedTotal,
      paymentMethod,
      paymentStatus: paymentStatus || 'paid',
      amountPaid: amountPaid != null ? amountPaid : computedTotal,
      soldBy: soldBy || req.userId,
      customerName: customerName || '',
      customerPhone: customerPhone || '',
      dueDate: dueDate || undefined,
      paymentDetails: paymentDetails || {},
      notes: notes || '',
    });

    // Deduct stock for each product and log stock history
    for (const item of saleItems) {
      const product = await Product.findOne({ _id: item.product, shop: shopId });
      if (product) {
        const prevStock = product.stock;
        product.stock = Math.max(0, prevStock - item.quantity);
        await product.save();

        await StockHistory.create({
          product: product._id,
          shop: shopId,
          type: 'sold',
          quantity: -item.quantity,
          previousStock: prevStock,
          newStock: product.stock,
          reference: `Sale ${saleNumber}`,
          notes: '',
          performedBy: req.userId,
        });
      }
    }

    // Emit Socket.io events
    const io = req.app.get('io');
    if (io) {
      io.to(shopId.toString()).emit('sale:completed', { sale, saleNumber });
      for (const item of saleItems) {
        io.to(shopId.toString()).emit('stock:updated', { productId: item.product });
      }
    }

    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to record sale' });
  }
};

// @desc    Get all sales for a shop
// @route   GET /api/sales
// @access  Private
exports.getSales = async (req, res) => {
  try {
    const shopId = req.user.shop;
    if (!shopId) {
      return res.status(400).json({ success: false, message: 'Shop not found' });
    }

    const { page = 1, limit = 20, search, paymentMethod, startDate, endDate, worker } = req.query;
    const query = { shop: shopId };

    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }

    if (worker && worker !== 'all') {
      query.soldBy = worker;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { saleNumber: { $regex: search, $options: 'i' } },
        { 'items.name': { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Sale.countDocuments(query);

    const sales = await Sale.find(query)
      .populate('soldBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalPages = Math.ceil(total / parseInt(limit));
    const currentPage = parseInt(page);

    res.status(200).json({
      success: true,
      data: {
        sales,
        total,
        page: currentPage,
        totalPages,
        hasMore: currentPage < totalPages,
      },
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sales' });
  }
};

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private
exports.getSale = async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, shop: req.user.shop })
      .populate('soldBy', 'fullName email')
      .lean();

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    res.status(200).json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch sale' });
  }
};

// @desc    Mark a credit sale as paid
// @route   PUT /api/sales/:id/pay
// @access  Private
exports.markAsPaid = async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, shop: req.user.shop });
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    if (sale.paymentMethod !== 'card') {
      return res.status(400).json({ success: false, message: 'Only credit sales can be marked as paid' });
    }
    if (sale.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Sale is already marked as paid' });
    }

    const { paymentDate, paymentMethod: payMethod, notes: payNotes } = req.body;

    sale.paymentStatus = 'paid';
    sale.amountPaid = sale.total;
    sale.paidAt = paymentDate ? new Date(paymentDate) : new Date();
    sale.paymentHistory.push({
      date: paymentDate ? new Date(paymentDate) : new Date(),
      amount: sale.total,
      method: payMethod || 'cash',
      notes: payNotes || '',
      recordedBy: req.userId,
    });

    await sale.save();

    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.shop.toString()).emit('transaction:updated', {
        saleId: sale._id,
        saleNumber: sale.saleNumber,
        paymentStatus: 'paid',
      });
    }

    res.status(200).json({ success: true, data: sale });
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark as paid' });
  }
};

// @desc    Export sales as CSV
// @route   GET /api/sales/export
// @access  Private
exports.exportSales = async (req, res) => {
  try {
    const shopId = req.user.shop;
    if (!shopId) {
      return res.status(400).json({ success: false, message: 'Shop not found' });
    }

    const { startDate, endDate, paymentMethod } = req.query;
    const query = { shop: shopId };

    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sales = await Sale.find(query)
      .populate('soldBy', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    // Build CSV
    const headers = ['Receipt #', 'Date', 'Items', 'Subtotal', 'Discount', 'Total', 'Payment Method', 'Payment Status', 'Customer', 'Worker', 'Profit'];
    const rows = sales.map((s) => [
      s.saleNumber,
      new Date(s.createdAt).toLocaleString('en-KE'),
      s.items.reduce((sum, i) => sum + i.quantity, 0),
      s.subtotal,
      s.discount,
      s.total,
      s.paymentMethod,
      s.paymentStatus,
      s.customerName || '',
      s.soldBy?.fullName || '',
      s.totalProfit || 0,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sales-export-${Date.now()}.csv`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Export sales error:', error);
    res.status(500).json({ success: false, message: 'Failed to export sales' });
  }
};

// @desc    Get distinct credit customers for autocomplete
// @route   GET /api/sales/customers
// @access  Private
exports.getCreditCustomers = async (req, res) => {
  try {
    const shopId = req.user.shop;
    if (!shopId) {
      return res.status(400).json({ success: false, message: 'Shop not found' });
    }

    const customers = await Sale.aggregate([
      { $match: { shop: shopId, paymentMethod: 'card', customerName: { $ne: '' } } },
      { $group: {
        _id: '$customerName',
        phone: { $last: '$customerPhone' },
        totalCredit: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$total', 0] } },
        lastPurchase: { $max: '$createdAt' },
        purchaseCount: { $sum: 1 },
      } },
      { $sort: { lastPurchase: -1 } },
      { $limit: 20 },
    ]);

    const data = customers.map((c) => ({
      name: c._id,
      phone: c.phone,
      totalCredit: c.totalCredit,
      lastPurchase: c.lastPurchase,
      purchaseCount: c.purchaseCount,
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Get credit customers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
};
