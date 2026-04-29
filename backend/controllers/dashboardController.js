const Transaction = require('../models/Sale');
const Product = require('../models/Product');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Expense = require('../models/Expense');

// @desc    Get dashboard data
// @route   GET /api/dashboard
// @access  Private
exports.getDashboardData = async (req, res) => {
  try {
    const shopId = req.user.shop;
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'Shop not found. Please complete onboarding.',
      });
    }

    const today = new Date(date);
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));
    
    // Yesterday for trend calculation
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));
    const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999));

    // 7 days ago for chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Parallel fetch all dashboard data
    const [
      todaySalesData,
      yesterdaySalesData,
      todayProfitData,
      todayExpenses,
      lowStockCount,
      activeWorkersCount,
      onlineWorkersCount,
      recentTransactions,
      alerts,
      workerPerformance,
      chartData,
      shopData,
    ] = await Promise.all([
      // Today's sales
      Transaction.aggregate([
        {
          $match: {
            shop: shopId,
            createdAt: { $gte: todayStart, $lte: todayEnd },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' },
          },
        },
      ]),

      // Yesterday's sales (for trend)
      Transaction.aggregate([
        {
          $match: {
            shop: shopId,
            createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' },
          },
        },
      ]),

      // Today's profit (from transactions)
      Transaction.aggregate([
        {
          $match: {
            shop: shopId,
            createdAt: { $gte: todayStart, $lte: todayEnd },
          },
        },
        {
          $group: {
            _id: null,
            totalProfit: { $sum: '$totalProfit' },
          },
        },
      ]),

      // Today's expenses
      Expense.aggregate([
        {
          $match: {
            shop: shopId,
            date: { $gte: todayStart, $lte: todayEnd },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),

      // Low stock count
      Product.countDocuments({
        shop: shopId,
        $expr: { $lte: ['$stock', '$lowStockThreshold'] },
        stock: { $gt: 0 }, // Not out of stock
      }),

      // Active workers count
      User.countDocuments({
        shop: shopId,
        isActive: true,
      }),

      // Online workers (active in last 5 minutes)
      User.countDocuments({
        shop: shopId,
        isActive: true,
        'activeSessions.lastActive': { $gte: new Date(Date.now() - 5 * 60 * 1000) },
      }),

      // Recent transactions (last 5)
      Transaction.find({ shop: shopId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('soldBy', 'fullName avatar')
        .populate('items.product', 'name')
        .lean(),

      // Unread notifications (alerts)
      Notification.find({ shop: shopId, read: false })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // Worker performance today
      Transaction.aggregate([
        {
          $match: {
            shop: shopId,
            createdAt: { $gte: todayStart, $lte: todayEnd },
          },
        },
        {
          $group: {
            _id: '$soldBy',
            salesCount: { $sum: 1 },
            salesValue: { $sum: '$total' },
          },
        },
        { $sort: { salesValue: -1 } },
      ]),

      // Chart data (last 7 days)
      Transaction.aggregate([
        {
          $match: {
            shop: shopId,
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              day: { $dateToString: { format: '%a', date: '$createdAt' } },
            },
            sales: { $sum: '$total' },
            profit: { $sum: '$totalProfit' },
          },
        },
        { $sort: { '_id.date': 1 } },
      ]),

      // Shop data
      require('../models/Shop').findById(shopId).lean(),
    ]);

    // Calculate metrics
    const todaySales = todaySalesData[0]?.total || 0;
    const yesterdaySales = yesterdaySalesData[0]?.total || 0;
    const grossProfit = todayProfitData[0]?.totalProfit || 0;
    const totalExpenses = todayExpenses[0]?.total || 0;

    // Net profit = gross profit - expenses
    const todayProfit = Math.max(0, grossProfit - totalExpenses);
    
    // Calculate yesterday's profit for trend
    const yesterdayProfitData = await Transaction.aggregate([
      {
        $match: {
          shop: shopId,
          createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalProfit: { $sum: '$totalProfit' },
        },
      },
    ]);
    const yesterdayProfit = yesterdayProfitData[0]?.totalProfit || 0;

    // Calculate trends
    const salesTrend = yesterdaySales > 0 
      ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100)
      : 0;
    
    const profitTrend = yesterdayProfit > 0
      ? Math.round(((todayProfit - yesterdayProfit) / yesterdayProfit) * 100)
      : 0;

    // Get active workers count
    const activeWorkers = await User.countDocuments({
      shop: shopId,
      isActive: true,
    });

    // Format recent transactions
    const formattedTransactions = recentTransactions.map(txn => ({
      _id: txn._id,
      time: new Date(txn.createdAt).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      productName: txn.items[0]?.product?.name || 'Unknown Product',
      variant: '',
      quantity: txn.items.reduce((sum, item) => sum + item.quantity, 0),
      amount: txn.total,
      paymentMethod: txn.paymentMethod,
      worker: {
        name: txn.soldBy?.fullName?.split(' ')[0] || 'Unknown',
        avatar: txn.soldBy?.avatar || null,
      },
    }));

    // Format alerts
    const formattedAlerts = alerts.map(alert => {
      let icon = '🔔';
      if (alert.type === 'low_stock') icon = '⚠️';
      else if (alert.type === 'expiry') icon = '⌛';

      return {
        _id: alert._id,
        type: alert.type,
        icon,
        title: alert.title,
        message: alert.message,
        time: getTimeAgo(alert.createdAt),
        action: alert.link ? { label: 'View', link: alert.link } : null,
      };
    });

    // Format worker performance
    const topPerformerSales = workerPerformance[0]?.salesValue || 1;
    const formattedWorkers = await Promise.all(
      workerPerformance.map(async (worker) => {
        const user = await User.findById(worker._id).lean();
        return {
          _id: worker._id,
          name: user?.fullName?.split(' ')[0] || 'Unknown',
          avatar: user?.avatar || null,
          status: 'offline', // Would need WebSocket for real-time status
          salesCount: worker.salesCount,
          salesValue: worker.salesValue,
          percentageOfTop: Math.round((worker.salesValue / topPerformerSales) * 100),
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        todaySales,
        todaySalesTrend: salesTrend,
        todayProfit,
        todayProfitTrend: profitTrend,
        lowStockCount,
        activeWorkers: activeWorkersCount,
        onlineWorkers: onlineWorkersCount,
        chartData,
        recentTransactions: formattedTransactions,
        alerts: formattedAlerts,
        workerPerformance: formattedWorkers,
        lastUpdated: new Date().toISOString(),
        shopName: shopData?.name || 'Your Shop',
        date: date,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message,
    });
  }
};



// Helper: Get time ago string
function getTimeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
