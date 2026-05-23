const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Product = require('../models/Product');
const StockHistory = require('../models/StockHistory');
const User = require('../models/User');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format a date range for a given day */
const dayRange = (dateStr) => {
  const start = new Date(dateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { $gte: start, $lt: end };
};

/** Previous period for trend comparison */
const prevDayRange = (dateStr) => {
  const start = new Date(dateStr);
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { $gte: start, $lt: end };
};

/** Format currency for display */
const fmt = (n) => Math.round(n || 0);

// ─── Daily Report ────────────────────────────────────────────────────────────

exports.getDailyReport = async (req, res) => {
  try {
    const shopId = req.user.shop;
    if (!shopId) return res.status(400).json({ success: false, message: 'Shop not found' });

    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();
    const dateFilter = dayRange(reportDate);
    const prevFilter = prevDayRange(reportDate);

    // ── Sales aggregation ─────────────────────────────────────────
    const salesAgg = await Sale.aggregate([
      { $match: { shop: shopId, createdAt: dateFilter } },
      { $group: {
        _id: null,
        count: { $sum: 1 },
        revenue: { $sum: '$total' },
        totalProfit: { $sum: '$totalProfit' },
        discounts: { $sum: '$discount' },
      }},
    ]);

    const today = salesAgg[0] || { count: 0, revenue: 0, totalProfit: 0, discounts: 0 };

    // ── Previous day comparison ───────────────────────────────────
    const prevAgg = await Sale.aggregate([
      { $match: { shop: shopId, createdAt: prevFilter } },
      { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
    ]);
    const prev = prevAgg[0] || { revenue: 0, count: 0 };

    const salesTrend = prev.revenue > 0
      ? Math.round(((today.revenue - prev.revenue) / prev.revenue) * 100)
      : null;

    // ── Expenses ──────────────────────────────────────────────────
    const expensesAgg = await Expense.aggregate([
      { $match: { shop: shopId, date: dateFilter } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalExpenses = fmt((expensesAgg[0]?.total || 0));

    const grossProfit = fmt(today.totalProfit - today.discounts);
    const netProfit = grossProfit - totalExpenses;

    // ── Top selling products ──────────────────────────────────────
    const topProducts = await Sale.aggregate([
      { $match: { shop: shopId, createdAt: dateFilter } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.name',
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.total' },
      }},
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]);

    // ── Payment method breakdown ──────────────────────────────────
    const paymentBreakdown = await Sale.aggregate([
      { $match: { shop: shopId, createdAt: dateFilter } },
      { $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        total: { $sum: '$total' },
      }},
    ]);

    // ── Hourly breakdown ──────────────────────────────────────────
    const hourlyBreakdown = await Sale.aggregate([
      { $match: { shop: shopId, createdAt: dateFilter } },
      { $group: {
        _id: { $hour: '$createdAt' },
        count: { $sum: 1 },
        total: { $sum: '$total' },
      }},
      { $sort: { _id: 1 } },
    ]);

    // ── Top workers ───────────────────────────────────────────────
    const topWorkers = await Sale.aggregate([
      { $match: { shop: shopId, createdAt: dateFilter } },
      { $group: {
        _id: '$soldBy',
        count: { $sum: 1 },
        total: { $sum: '$total' },
      }},
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]);

    // Populate worker names
    const workerIds = topWorkers.map((w) => w._id);
    const workers = await User.find({ _id: { $in: workerIds } }).select('fullName').lean();
    const workerMap = {};
    workers.forEach((w) => { workerMap[w._id.toString()] = w.fullName; });

    const workersData = topWorkers.map((w) => ({
      name: workerMap[w._id.toString()] || 'Unknown',
      sales: w.count,
      total: fmt(w.total),
    }));

    res.status(200).json({
      success: true,
      data: {
        date: reportDate.toISOString().slice(0, 10),
        summary: {
          totalSales: today.count,
          revenue: fmt(today.revenue),
          costOfGoods: fmt(today.revenue - today.totalProfit + today.discounts),
          grossProfit,
          expenses: totalExpenses,
          netProfit,
        },
        salesTrend,
        trend: {
          label: 'vs yesterday',
          revenueChange: prev.revenue > 0
            ? Math.round(((today.revenue - prev.revenue) / prev.revenue) * 100) : null,
          countChange: prev.count > 0
            ? Math.round(((today.count - prev.count) / prev.count) * 100) : null,
        },
        topProducts: topProducts.map((p) => ({
          name: p._id,
          quantity: p.quantity,
          revenue: fmt(p.revenue),
        })),
        paymentBreakdown: paymentBreakdown.map((p) => ({
          method: p._id,
          count: p.count,
          total: fmt(p.total),
        })),
        hourlyBreakdown: hourlyBreakdown.map((h) => ({
          hour: h._id,
          count: h.count,
          total: fmt(h.total),
        })),
        topWorkers: workersData,
        expenseBreakdown: await Expense.aggregate([
          { $match: { shop: shopId, date: dateFilter } },
          { $group: { _id: '$category', total: { $sum: '$amount' } } },
        ]),
      },
    });
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate daily report' });
  }
};

// ─── Weekly Report ───────────────────────────────────────────────────────────

exports.getWeeklyReport = async (req, res) => {
  try {
    const shopId = req.user.shop;
    if (!shopId) return res.status(400).json({ success: false, message: 'Shop not found' });

    const { startDate, endDate } = req.query;

    // Default: current week (Mon–Sun)
    let weekStart, weekEnd;
    if (startDate && endDate) {
      weekStart = new Date(startDate);
      weekStart.setHours(0, 0, 0, 0);
      weekEnd = new Date(endDate);
      weekEnd.setHours(23, 59, 59, 999);
    } else {
      const now = new Date();
      const day = now.getDay();
      weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      weekStart.setHours(0, 0, 0, 0);
      weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
    }

    const weekFilter = { $gte: weekStart, $lte: weekEnd };

    // Previous week
    const prevWeekEnd = new Date(weekStart);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
    prevWeekEnd.setHours(23, 59, 59, 999);
    const prevWeekStart = new Date(prevWeekEnd);
    prevWeekStart.setDate(prevWeekStart.getDate() - 6);
    prevWeekStart.setHours(0, 0, 0, 0);

    // ── Sales this week ───────────────────────────────────────────
    const salesAgg = await Sale.aggregate([
      { $match: { shop: shopId, createdAt: weekFilter } },
      { $group: {
        _id: null,
        count: { $sum: 1 },
        revenue: { $sum: '$total' },
        totalProfit: { $sum: '$totalProfit' },
        discounts: { $sum: '$discount' },
      }},
    ]);
    const week = salesAgg[0] || { count: 0, revenue: 0, totalProfit: 0, discounts: 0 };

    // ── Previous week comparison ──────────────────────────────────
    const prevAgg = await Sale.aggregate([
      { $match: { shop: shopId, createdAt: { $gte: prevWeekStart, $lte: prevWeekEnd } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
    ]);
    const prevWeek = prevAgg[0] || { revenue: 0, count: 0 };

    // ── Expenses ──────────────────────────────────────────────────
    const expensesAgg = await Expense.aggregate([
      { $match: { shop: shopId, date: weekFilter } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalExpenses = fmt((expensesAgg[0]?.total || 0));

    const grossProfit = fmt(week.totalProfit - week.discounts);
    const netProfit = grossProfit - totalExpenses;

    // ── Day-by-day breakdown ──────────────────────────────────────
    const dailyBreakdown = await Sale.aggregate([
      { $match: { shop: shopId, createdAt: weekFilter } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        revenue: { $sum: '$total' },
        profit: { $sum: '$totalProfit' },
        discounts: { $sum: '$discount' },
      }},
      { $sort: { _id: 1 } },
    ]);

    // ── Daily expenses ────────────────────────────────────────────
    const dailyExpenses = await Expense.aggregate([
      { $match: { shop: shopId, date: weekFilter } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        total: { $sum: '$amount' },
      }},
    ]);
    const expenseMap = {};
    dailyExpenses.forEach((e) => { expenseMap[e._id] = fmt(e.total); });

    // Fill in missing days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = [];
    const cursor = new Date(weekStart);
    const dayMap = {};
    dailyBreakdown.forEach((d) => { dayMap[d._id] = d; });

    while (cursor <= weekEnd) {
      const key = cursor.toISOString().slice(0, 10);
      const entry = dayMap[key];
      const revenue = entry ? fmt(entry.revenue) : 0;
      const profit = entry ? fmt(entry.profit - (entry.discounts || 0)) : 0;
      const dayExpenses = expenseMap[key] || 0;
      days.push({
        date: key,
        day: dayNames[cursor.getDay()],
        sales: entry ? entry.count : 0,
        revenue,
        cost: revenue - profit,
        expenses: dayExpenses,
        profit,
        margin: revenue > 0 ? Math.round((profit / revenue) * 100) : 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    // ── Top products ──────────────────────────────────────────────
    const topProducts = await Sale.aggregate([
      { $match: { shop: shopId, createdAt: weekFilter } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    // ── Payment methods ───────────────────────────────────────────
    const paymentMethods = await Sale.aggregate([
      { $match: { shop: shopId, createdAt: weekFilter } },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$total' } } },
    ]);

    // ── Expense categories ────────────────────────────────────────
    const expenseCategories = await Expense.aggregate([
      { $match: { shop: shopId, date: weekFilter } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        startDate: weekStart.toISOString().slice(0, 10),
        endDate: weekEnd.toISOString().slice(0, 10),
        summary: {
          totalSales: week.count,
          revenue: fmt(week.revenue),
          costOfGoods: fmt(week.revenue - week.totalProfit + week.discounts),
          grossProfit,
          expenses: totalExpenses,
          netProfit,
        },
        trend: {
          label: 'vs last week',
          revenueChange: prevWeek.revenue > 0
            ? Math.round(((week.revenue - prevWeek.revenue) / prevWeek.revenue) * 100) : null,
          countChange: prevWeek.count > 0
            ? Math.round(((week.count - prevWeek.count) / prevWeek.count) * 100) : null,
        },
        dailyBreakdown: days,
        topProducts: topProducts.map((p) => ({
          name: p._id,
          quantity: p.quantity,
          revenue: fmt(p.revenue),
        })),
        paymentMethods: paymentMethods.map((p) => ({
          method: p._id,
          count: p.count,
          total: fmt(p.total),
        })),
        expenseCategories: expenseCategories.map((e) => ({
          category: e._id,
          total: fmt(e.total),
        })),
      },
    });
  } catch (error) {
    console.error('Weekly report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate weekly report' });
  }
};

// ─── Monthly Report ──────────────────────────────────────────────────────────

exports.getMonthlyReport = async (req, res) => {
  try {
    const shopId = req.user.shop;
    if (!shopId) return res.status(400).json({ success: false, message: 'Shop not found' });

    const now = new Date();
    const month = parseInt(req.query.month) || (now.getMonth() + 1);
    const year = parseInt(req.query.year) || now.getFullYear();

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);
    const monthFilter = { $gte: monthStart, $lt: monthEnd };

    // Previous month
    const prevMonthStart = new Date(year, month - 2, 1);
    const prevMonthEnd = new Date(year, month - 1, 1);

    // ── Sales aggregation ─────────────────────────────────────────
    const salesAgg = await Sale.aggregate([
      { $match: { shop: shopId, createdAt: monthFilter } },
      { $group: {
        _id: null,
        count: { $sum: 1 },
        revenue: { $sum: '$total' },
        totalProfit: { $sum: '$totalProfit' },
        discounts: { $sum: '$discount' },
      }},
    ]);
    const monthData = salesAgg[0] || { count: 0, revenue: 0, totalProfit: 0, discounts: 0 };

    // Previous month
    const prevAgg = await Sale.aggregate([
      { $match: { shop: shopId, createdAt: { $gte: prevMonthStart, $lt: prevMonthEnd } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
    ]);
    const prevMonth = prevAgg[0] || { revenue: 0, count: 0 };

    // ── Expenses ──────────────────────────────────────────────────
    const expensesAgg = await Expense.aggregate([
      { $match: { shop: shopId, date: monthFilter } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalExpenses = fmt((expensesAgg[0]?.total || 0));

    const revenue = fmt(monthData.revenue);
    const cogs = fmt(monthData.revenue - monthData.totalProfit + monthData.discounts);
    const grossProfit = fmt(monthData.totalProfit - monthData.discounts);
    const netProfit = grossProfit - totalExpenses;

    // ── Weekly breakdown within month ─────────────────────────────
    const weeklyBreakdown = await Sale.aggregate([
      { $match: { shop: shopId, createdAt: monthFilter } },
      { $group: {
        _id: { $week: '$createdAt' },
        revenue: { $sum: '$total' },
        profit: { $sum: '$totalProfit' },
        discounts: { $sum: '$discount' },
      }},
      { $sort: { _id: 1 } },
    ]);

    // ── Category breakdown (by product category) ──────────────────
    const categoryBreakdown = await Sale.aggregate([
      { $match: { shop: shopId, createdAt: monthFilter } },
      { $unwind: '$items' },
      { $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product',
      }},
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      { $group: {
        _id: { $ifNull: ['$product.category', 'Uncategorized'] },
        revenue: { $sum: '$items.total' },
        quantity: { $sum: '$items.quantity' },
      }},
      { $sort: { revenue: -1 } },
    ]);

    // ── Top products ──────────────────────────────────────────────
    const topProducts = await Sale.aggregate([
      { $match: { shop: shopId, createdAt: monthFilter } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    // ── Worker performance ────────────────────────────────────────
    const workerPerf = await Sale.aggregate([
      { $match: { shop: shopId, createdAt: monthFilter } },
      { $group: { _id: '$soldBy', count: { $sum: 1 }, total: { $sum: '$total' } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]);
    const workerIds = workerPerf.map((w) => w._id);
    const workers = await User.find({ _id: { $in: workerIds } }).select('fullName').lean();
    const workerMap = {};
    workers.forEach((w) => { workerMap[w._id.toString()] = w.fullName; });

    // ── Expense categories ────────────────────────────────────────
    const expenseCategories = await Expense.aggregate([
      { $match: { shop: shopId, date: monthFilter } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]);

    // ── Stock data for P&L statement ─────────────────────────────
    // Closing stock: current value of all active products
    const products = await Product.find({ shop: shopId, isActive: true }).select('costPrice stock').lean();
    const closingStock = products.reduce((sum, p) => sum + ((p.costPrice || 0) * (p.stock || 0)), 0);

    // Purchases: stock added during the month (value)
    const stockAdditions = await StockHistory.aggregate([
      { $match: { shop: shopId, type: { $in: ['added', 'restock', 'initial'] }, createdAt: monthFilter } },
      { $group: { _id: null, totalQty: { $sum: '$quantity' } } },
    ]);
    const totalStockAdded = stockAdditions[0]?.totalQty || 0;

    // Average cost price of products (for valuing purchases)
    const avgCostPrice = products.length > 0
      ? products.reduce((sum, p) => sum + (p.costPrice || 0), 0) / products.length
      : 0;
    const purchases = Math.round(totalStockAdded * avgCostPrice);

    // Opening stock formula: Opening + Purchases - Closing = COGS
    const openingStock = Math.max(0, closingStock + cogs - purchases);

    // ── Daily sales for chart ─────────────────────────────────────
    const dailySales = await Sale.aggregate([
      { $match: { shop: shopId, createdAt: monthFilter } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        profit: { $sum: '$totalProfit' },
        discounts: { $sum: '$discount' },
      }},
      { $sort: { _id: 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    res.status(200).json({
      success: true,
      data: {
        month: monthNames[month - 1],
        year,
        summary: {
          totalSales: monthData.count,
          revenue,
          costOfGoods: cogs,
          grossProfit,
          expenses: totalExpenses,
          netProfit,
          otherIncome: 0,
        },
        stockData: {
          openingStock: fmt(openingStock),
          purchases: fmt(purchases),
          closingStock: fmt(closingStock),
        },
        comparison: {
          label: 'vs last month',
          revenueChange: prevMonth.revenue > 0
            ? Math.round(((monthData.revenue - prevMonth.revenue) / prevMonth.revenue) * 100) : null,
          countChange: prevMonth.count > 0
            ? Math.round(((monthData.count - prevMonth.count) / prevMonth.count) * 100) : null,
        },
        weeklyBreakdown: weeklyBreakdown.map((w) => ({
          week: w._id,
          revenue: fmt(w.revenue),
          profit: fmt(w.profit - (w.discounts || 0)),
        })),
        categoryBreakdown: categoryBreakdown.map((c) => ({
          category: c._id,
          revenue: fmt(c.revenue),
          quantity: c.quantity,
        })),
        dailySales: dailySales.map((d) => ({
          date: d._id,
          revenue: fmt(d.revenue),
          netProfit: fmt(d.profit - (d.discounts || 0)),
        })),
        topProducts: topProducts.map((p) => ({
          name: p._id,
          quantity: p.quantity,
          revenue: fmt(p.revenue),
        })),
        topWorkers: workerPerf.map((w) => ({
          name: workerMap[w._id.toString()] || 'Unknown',
          sales: w.count,
          total: fmt(w.total),
        })),
        expenseBreakdown: expenseCategories.map((e) => ({
          category: e._id,
          total: fmt(e.total),
        })),
      },
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate monthly report' });
  }
};

// ─── Email Report ────────────────────────────────────────────────────────────

exports.emailReport = async (req, res) => {
  try {
    const { type, date, month, year, email, format, message } = req.body;
    const shopId = req.user.shop;

    if (!email || !type) {
      return res.status(400).json({ success: false, message: 'Email recipient and report type are required' });
    }

    console.log(`📧 Email report requested: type=${type}, email=${email}, format=${format || 'pdf'}`);

    // TODO: Generate report content and send via Nodemailer
    // For now, acknowledge the request
    res.status(200).json({
      success: true,
      message: `Report will be emailed to ${email} shortly`,
    });
  } catch (error) {
    console.error('Email report error:', error);
    res.status(500).json({ success: false, message: 'Failed to email report' });
  }
};

// ─── Export PDF (stub) ───────────────────────────────────────────────────────

exports.exportReport = async (req, res) => {
  try {
    const { type, date, month, year } = req.query;
    const shopId = req.user.shop;

    console.log(`📄 Export report requested: type=${type}, date=${date || `${month}/${year}`}`);

    // TODO: Generate PDF with professional layout and return as download
    res.status(200).json({
      success: true,
      message: 'PDF export will be generated shortly',
    });
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ success: false, message: 'Failed to export report' });
  }
};

// ─── Product Performance Report ──────────────────────────────────────────────

exports.getProductsReport = async (req, res) => {
  try {
    const shopId = req.user.shop;
    if (!shopId) return res.status(400).json({ success: false, message: 'Shop not found' });

    const now = new Date();
    const { startDate, endDate, sort = 'revenue' } = req.query;

    // Date range filter - default to all time
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        dateFilter.$lte = e;
      }
    }
    const hasDateFilter = Object.keys(dateFilter).length > 0;
    const saleFilter = { shop: shopId };
    if (hasDateFilter) saleFilter.createdAt = dateFilter;

    // ── All active products ───────────────────────────────────────
    const allProducts = await Product.find({ shop: shopId, isActive: true })
      .select('name category sku price costPrice stock lowStockThreshold image')
      .lean();

    const totalProducts = allProducts.length;

    // ── Sales aggregation by product ──────────────────────────────
    const productSales = await Sale.aggregate([
      { $match: saleFilter },
      { $unwind: '$items' },
      { $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productData',
      }},
      { $unwind: { path: '$productData', preserveNullAndEmptyArrays: true } },
      { $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.total' },
        costPrice: { $first: '$productData.costPrice' },
        category: { $first: '$productData.category' },
        image: { $first: '$productData.image' },
      }},
    ]);

    // ── Merge product data with sales ─────────────────────────────
    const salesMap = {};
    productSales.forEach((s) => {
      salesMap[s._id.toString()] = {
        unitsSold: s.unitsSold,
        revenue: fmt(s.revenue),
        cost: fmt((s.costPrice || 0) * s.unitsSold),
        profit: fmt(s.revenue - (s.costPrice || 0) * s.unitsSold),
        category: s.category || 'Uncategorized',
      };
    });

    const soldProductIds = new Set(Object.keys(salesMap));
    const soldCount = soldProductIds.size;

    // ── Build full product list ───────────────────────────────────
    const products = allProducts.map((p) => {
      const s = salesMap[p._id.toString()];
      if (!s) {
        return {
          _id: p._id,
          name: p.name,
          sku: p.sku || '',
          category: p.category || 'Uncategorized',
          image: p.image || null,
          unitsSold: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          margin: 0,
          stock: p.stock || 0,
          stockStatus: (p.stock || 0) === 0 ? 'Out of Stock' : (p.stock || 0) <= (p.lowStockThreshold || 10) ? 'Low Stock' : 'In Stock',
          lastSold: null,
        };
      }
      return {
        _id: p._id,
        name: p.name,
        sku: p.sku || '',
        category: p.category || 'Uncategorized',
        image: p.image || null,
        unitsSold: s.unitsSold,
        revenue: s.revenue,
        cost: s.cost,
        profit: s.profit,
        margin: s.revenue > 0 ? Math.round((s.profit / s.revenue) * 100) : 0,
        stock: p.stock || 0,
        stockStatus: (p.stock || 0) === 0 ? 'Out of Stock' : (p.stock || 0) <= (p.lowStockThreshold || 10) ? 'Low Stock' : 'In Stock',
        lastSold: null,
      };
    });

    // ── Sort ──────────────────────────────────────────────────────
    const sortMap = {
      revenue: (a, b) => b.revenue - a.revenue,
      profit: (a, b) => b.profit - a.profit,
      units: (a, b) => b.unitsSold - a.unitsSold,
      margin: (a, b) => b.margin - a.margin,
    };
    const sortFn = sortMap[sort] || sortMap.revenue;
    products.sort(sortFn);

    // ── Top product & top profit maker ────────────────────────────
    const soldProducts = products.filter((p) => p.unitsSold > 0);
    const topProduct = soldProducts.length > 0 ? soldProducts[0] : null;
    const topProfit = soldProducts.length > 0
      ? [...soldProducts].sort((a, b) => b.profit - a.profit)[0]
      : null;

    // ── Slow movers (not sold in 30 days) ────────────────────────
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSales = await Sale.aggregate([
      { $match: { shop: shopId, createdAt: { $gte: thirtyDaysAgo } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', lastSold: { $max: '$createdAt' } } },
    ]);
    const recentProductIds = new Set(recentSales.map((s) => s._id.toString()));
    const recentDates = {};
    recentSales.forEach((s) => { recentDates[s._id.toString()] = s.lastSold; });

    const slowMovers = allProducts
      .filter((p) => !recentProductIds.has(p._id.toString()) && (p.stock || 0) > 0)
      .map((p) => ({
        _id: p._id,
        name: p.name,
        sku: p.sku || '',
        stock: p.stock || 0,
        lastSold: recentDates[p._id.toString()] || null,
        daysSinceLastSale: 30,
      }));

    // ── Profit killers (sold below cost) ──────────────────────────
    const profitKillers = products
      .filter((p) => p.unitsSold > 0 && p.profit < 0)
      .map((p) => ({
        _id: p._id,
        name: p.name,
        revenue: p.revenue,
        cost: p.cost,
        loss: -p.profit,
        unitsSold: p.unitsSold,
      }));

    // ── Category breakdown (for chart) ────────────────────────────
    const catMap = {};
    products.forEach((p) => {
      if (p.unitsSold > 0) {
        if (!catMap[p.category]) catMap[p.category] = 0;
        catMap[p.category] += p.revenue;
      }
    });
    const categoryBreakdown = Object.entries(catMap)
      .map(([name, revenue]) => ({ category: name, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        soldCount,
        soldPercentage: totalProducts > 0 ? Math.round((soldCount / totalProducts) * 100) : 0,
        topProduct: topProduct ? { name: topProduct.name, revenue: topProduct.revenue } : null,
        topProfitMaker: topProfit ? { name: topProfit.name, profit: topProfit.profit } : null,
        products,
        categoryBreakdown,
        slowMovers,
        profitKillers,
        dateRange: { startDate: startDate || null, endDate: endDate || null },
      },
    });
  } catch (error) {
    console.error('Product report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate product report' });
  }
};

// ─── Single Product Detail Report ────────────────────────────────────────────

exports.getSingleProductReport = async (req, res) => {
  try {
    const shopId = req.user.shop;
    const productId = req.params.id;

    const product = await Product.findOne({ _id: productId, shop: shopId }).lean();
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // ── Sales history (last 20) ───────────────────────────────────
    const sales = await Sale.find({ shop: shopId, 'items.product': productId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('soldBy', 'fullName')
      .lean();

    const salesHistory = sales.map((s) => {
      const item = s.items.find((i) => i.product.toString() === productId);
      return {
        date: s.createdAt,
        quantity: item?.quantity || 0,
        price: item?.price || 0,
        total: item?.total || 0,
        profit: (item?.price || 0) * (item?.quantity || 0) - (product.costPrice || 0) * (item?.quantity || 0),
        soldBy: s.soldBy?.fullName || 'Unknown',
      };
    });

    // ── 30-day trend ──────────────────────────────────────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailyTrend = await Sale.aggregate([
      { $match: { shop: shopId, 'items.product': new require('mongoose').Types.ObjectId(productId), createdAt: { $gte: thirtyDaysAgo } } },
      { $unwind: '$items' },
      { $match: { 'items.product': new require('mongoose').Types.ObjectId(productId) } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.total' },
      }},
      { $sort: { _id: 1 } },
    ]);

    // ── Summary stats ─────────────────────────────────────────────
    const totalSold = dailyTrend.reduce((s, d) => s + d.quantity, 0);
    const totalRevenue = dailyTrend.reduce((s, d) => s + d.revenue, 0);
    const totalCost = totalSold * (product.costPrice || 0);
    const totalProfit = totalRevenue - totalCost;
    const avgMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        product: {
          _id: product._id,
          name: product.name,
          image: product.image || null,
          category: product.category,
          price: product.price,
          costPrice: product.costPrice || 0,
          stock: product.stock,
          sku: product.sku,
        },
        summary: {
          unitsSold: totalSold,
          revenue: fmt(totalRevenue),
          profit: fmt(totalProfit),
          avgMargin,
        },
        trend: dailyTrend.map((d) => ({
          date: d._id,
          quantity: d.quantity,
          revenue: fmt(d.revenue),
        })),
        salesHistory,
      },
    });
  } catch (error) {
    console.error('Single product report error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product detail' });
  }
};

// ─── Worker Performance Report ───────────────────────────────────────────────

exports.getWorkersReport = async (req, res) => {
  try {
    const shopId = req.user.shop;
    if (!shopId) return res.status(400).json({ success: false, message: 'Shop not found' });

    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        dateFilter.$lte = e;
      }
    }
    const saleFilter = { shop: shopId };
    if (Object.keys(dateFilter).length > 0) saleFilter.createdAt = dateFilter;

    // ── All workers for this shop ─────────────────────────────────
    const allWorkers = await User.find({ shop: shopId, role: { $in: ['worker', 'cashier', 'manager', 'admin'] } })
      .select('fullName email avatar role')
      .lean();

    const totalWorkers = allWorkers.length;

    // ── Sales aggregation by worker ───────────────────────────────
    const workerSales = await Sale.aggregate([
      { $match: saleFilter },
      { $group: {
        _id: '$soldBy',
        salesCount: { $sum: 1 },
        totalValue: { $sum: '$total' },
        totalItems: { $sum: { $size: '$items' } },
      }},
      { $sort: { totalValue: -1 } },
    ]);

    const salesMap = {};
    workerSales.forEach((w) => {
      salesMap[w._id.toString()] = {
        salesCount: w.salesCount,
        totalValue: fmt(w.totalValue),
        totalItems: w.totalItems,
        avgSale: w.salesCount > 0 ? fmt(w.totalValue / w.salesCount) : 0,
      };
    });

    const totalSalesVal = workerSales.reduce((s, w) => s + w.totalValue, 0);
    const totalSalesCount = workerSales.reduce((s, w) => s + w.salesCount, 0);

    // ── Build full worker list ───────────────────────────────────
    const workers = allWorkers.map((w) => {
      const s = salesMap[w._id.toString()];
      return {
        _id: w._id,
        name: w.fullName || 'Unknown',
        email: w.email,
        role: w.role,
        avatar: w.avatar || null,
        salesCount: s ? s.salesCount : 0,
        totalValue: s ? s.totalValue : 0,
        totalItems: s ? s.totalItems : 0,
        avgSale: s ? s.avgSale : 0,
        percentOfTotal: totalSalesVal > 0 ? Math.round((s ? s.totalValue : 0) / totalSalesVal * 100) : 0,
      };
    });

    workers.sort((a, b) => b.totalValue - a.totalValue);

    const topPerformer = workers.length > 0 && workers[0].salesCount > 0 ? workers[0] : null;
    const avgSaleValue = totalSalesCount > 0 ? fmt(totalSalesVal / totalSalesCount) : 0;

    // ── Daily trend by worker ─────────────────────────────────────
    const trend = await Sale.aggregate([
      { $match: saleFilter },
      { $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          worker: '$soldBy',
        },
        salesCount: { $sum: 1 },
        totalValue: { $sum: '$total' },
      }},
      { $sort: { '_id.date': 1 } },
    ]);

    // Group trend by worker name
    const workerNames = {};
    allWorkers.forEach((w) => { workerNames[w._id.toString()] = w.fullName || 'Unknown'; });

    const trendByWorker = {};
    trend.forEach((t) => {
      const workerId = t._id.worker.toString();
      if (!trendByWorker[workerId]) {
        trendByWorker[workerId] = { name: workerNames[workerId] || 'Unknown', data: [] };
      }
      trendByWorker[workerId].data.push({
        date: t._id.date,
        salesCount: t.salesCount,
        totalValue: fmt(t.totalValue),
      });
    });

    res.status(200).json({
      success: true,
      data: {
        totalWorkers,
        totalSales: totalSalesCount,
        totalSalesValue: fmt(totalSalesVal),
        avgSaleValue,
        topPerformer: topPerformer ? { name: topPerformer.name, salesCount: topPerformer.salesCount, totalValue: topPerformer.totalValue } : null,
        workers,
        trendByWorker: Object.values(trendByWorker),
        dateRange: { startDate: startDate || null, endDate: endDate || null },
      },
    });
  } catch (error) {
    console.error('Worker report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate worker report' });
  }
};

// ─── Single Worker Detail Report ─────────────────────────────────────────────

exports.getSingleWorkerReport = async (req, res) => {
  try {
    const shopId = req.user.shop;
    const workerId = req.params.id;

    const worker = await User.findOne({ _id: workerId, shop: shopId }).select('fullName email avatar role').lean();
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });

    // ── Sales summary ─────────────────────────────────────────────
    const salesAgg = await Sale.aggregate([
      { $match: { shop: shopId, soldBy: new require('mongoose').Types.ObjectId(workerId) } },
      { $group: {
        _id: null,
        salesCount: { $sum: 1 },
        totalValue: { $sum: '$total' },
        totalItems: { $sum: { $size: '$items' } },
      }},
    ]);
    const summary = salesAgg[0] || { salesCount: 0, totalValue: 0, totalItems: 0 };

    const avgSale = summary.salesCount > 0 ? fmt(summary.totalValue / summary.salesCount) : 0;

    // ── Recent sales ──────────────────────────────────────────────
    const recentSales = await Sale.find({ shop: shopId, soldBy: workerId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const salesHistory = recentSales.map((s) => ({
      date: s.createdAt,
      items: s.items.length,
      total: fmt(s.total),
      paymentMethod: s.paymentMethod,
    }));

    // ── 30-day trend ──────────────────────────────────────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const trend = await Sale.aggregate([
      { $match: { shop: shopId, soldBy: new require('mongoose').Types.ObjectId(workerId), createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        salesCount: { $sum: 1 },
        totalValue: { $sum: '$total' },
      }},
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        worker: {
          _id: worker._id,
          name: worker.fullName,
          email: worker.email,
          avatar: worker.avatar || null,
          role: worker.role,
        },
        summary: {
          salesCount: summary.salesCount,
          totalValue: fmt(summary.totalValue),
          totalItems: summary.totalItems,
          avgSale,
        },
        trend: trend.map((d) => ({
          date: d._id,
          salesCount: d.salesCount,
          totalValue: fmt(d.totalValue),
        })),
        recentSales: salesHistory,
      },
    });
  } catch (error) {
    console.error('Single worker report error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch worker detail' });
  }
};
