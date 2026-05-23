const User = require('../models/User');
const Sale = require('../models/Sale');

// @desc    Get all workers for a shop with performance stats
// @route   GET /api/workers
// @access  Private
exports.getWorkers = async (req, res) => {
  try {
    const shopId = req.user.shop;
    if (!shopId) {
      return res.status(200).json({ success: true, data: [], message: 'No shop set up yet' });
    }

    const { status, search } = req.query;
    const query = { shop: shopId, isActive: true, isDeleted: { $ne: true } };

    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const workers = await User.find(query)
      .select('fullName email phone role avatar status invitedAt lastLogin createdAt')
      .sort({ fullName: 1 })
      .lean();

    // Aggregate performance stats from sales for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const workerIds = workers.map((w) => w._id);

    const stats = await Sale.aggregate([
      {
        $match: {
          shop: shopId,
          soldBy: { $in: workerIds },
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: '$soldBy',
          salesCount: { $sum: 1 },
          totalAmount: { $sum: '$total' },
          avgSale: { $avg: '$total' },
        },
      },
    ]);

    const statsMap = {};
    stats.forEach((s) => {
      statsMap[s._id.toString()] = {
        salesCount: s.salesCount,
        totalAmount: s.totalAmount,
        avgSale: Math.round(s.avgSale),
      };
    });

    // Find top performer for percentage calculation
    const maxSales = Math.max(1, ...stats.map((s) => s.salesCount));

    const data = workers.map((w) => {
      const perf = statsMap[w._id.toString()] || { salesCount: 0, totalAmount: 0, avgSale: 0 };
      return {
        ...w,
        performance: {
          ...perf,
          percentage: maxSales > 0 ? Math.round((perf.salesCount / maxSales) * 100) : 0,
        },
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Get workers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch workers' });
  }
};

// @desc    Get single worker
// @route   GET /api/workers/:id
// @access  Private
exports.getWorker = async (req, res) => {
  try {
    const worker = await User.findOne({
      _id: req.params.id,
      shop: req.user.shop,
      isActive: true,
    })
      .select('fullName email phone role avatar status invitedAt lastLogin createdAt permissions activeSessions')
      .lean();

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    const shopId = req.user.shop;

    // ── Today's stats ──────────────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStats = await Sale.aggregate([
      { $match: { shop: shopId, soldBy: worker._id, createdAt: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, salesCount: { $sum: 1 }, totalAmount: { $sum: '$total' }, avgSale: { $avg: '$total' } } },
    ]);

    // ── This week's stats (Mon–Sun) ───────────────────────────
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);

    const weekStats = await Sale.aggregate([
      { $match: { shop: shopId, soldBy: worker._id, createdAt: { $gte: weekStart, $lt: tomorrow } } },
      { $group: { _id: null, salesCount: { $sum: 1 }, totalAmount: { $sum: '$total' } } },
    ]);

    // ── Last week for trend comparison ─────────────────────────
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(weekStart);

    const lastWeekStats = await Sale.aggregate([
      { $match: { shop: shopId, soldBy: worker._id, createdAt: { $gte: lastWeekStart, $lt: lastWeekEnd } } },
      { $group: { _id: null, salesCount: { $sum: 1 }, totalAmount: { $sum: '$total' } } },
    ]);

    // ── This month's stats ─────────────────────────────────────
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const monthStats = await Sale.aggregate([
      { $match: { shop: shopId, soldBy: worker._id, createdAt: { $gte: monthStart, $lt: tomorrow } } },
      { $group: { _id: null, salesCount: { $sum: 1 }, totalAmount: { $sum: '$total' } } },
    ]);

    // ── Last month for trend comparison ────────────────────────
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);

    const lastMonthStats = await Sale.aggregate([
      { $match: { shop: shopId, soldBy: worker._id, createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd } } },
      { $group: { _id: null, salesCount: { $sum: 1 }, totalAmount: { $sum: '$total' } } },
    ]);

    // ── Device info ────────────────────────────────────────────
    const lastSession = worker.activeSessions?.[worker.activeSessions.length - 1];

    // ── Find inviter (the shop owner) ──────────────────────────
    const inviter = await User.findOne({ shop: shopId, role: 'admin', clerkId: { $exists: true, $ne: null } })
      .select('fullName')
      .lean();

    const todayPerf = todayStats[0] || { salesCount: 0, totalAmount: 0, avgSale: 0 };
    const weekPerf = weekStats[0] || { salesCount: 0, totalAmount: 0 };
    const lastWeekPerf = lastWeekStats[0] || { salesCount: 0, totalAmount: 0 };
    const monthPerf = monthStats[0] || { salesCount: 0, totalAmount: 0 };
    const lastMonthPerf = lastMonthStats[0] || { salesCount: 0, totalAmount: 0 };

    const weekTrend = lastWeekPerf.salesCount > 0
      ? Math.round(((weekPerf.salesCount - lastWeekPerf.salesCount) / lastWeekPerf.salesCount) * 100)
      : null;
    const monthTrend = lastMonthPerf.salesCount > 0
      ? Math.round(((monthPerf.salesCount - lastMonthPerf.salesCount) / lastMonthPerf.salesCount) * 100)
      : null;

    res.status(200).json({
      success: true,
      data: {
        ...worker,
        performance: {
          today: { salesCount: todayPerf.salesCount, totalAmount: todayPerf.totalAmount, avgSale: Math.round(todayPerf.avgSale) },
          week: { salesCount: weekPerf.salesCount, totalAmount: weekPerf.totalAmount, weekTrend },
          month: { salesCount: monthPerf.salesCount, totalAmount: monthPerf.totalAmount, monthTrend },
        },
        device: lastSession ? { browser: lastSession.browser, device: lastSession.device } : null,
        invitedBy: inviter && inviter._id.toString() !== worker._id.toString() ? inviter.fullName : null,
      },
    });
  } catch (error) {
    console.error('Get worker error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch worker' });
  }
};

// @desc    Get worker sales performance over time (chart data)
// @route   GET /api/workers/:id/performance?period=7d|30d|3m
// @access  Private
exports.getWorkerPerformance = async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const shopId = req.user.shop;

    let days;
    switch (period) {
      case '30d': days = 30; break;
      case '3m': days = 90; break;
      default: days = 7;
    }

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const sales = await Sale.aggregate([
      {
        $match: {
          shop: shopId,
          soldBy: new (require('mongoose').Types.ObjectId)(req.params.id),
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          salesCount: { $sum: 1 },
          totalAmount: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing dates with zeros
    const data = [];
    const cursor = new Date(startDate);
    const salesMap = {};
    sales.forEach((s) => { salesMap[s._id] = s; });

    while (cursor <= endDate) {
      const key = cursor.toISOString().slice(0, 10);
      const entry = salesMap[key];
      data.push({
        date: key,
        salesCount: entry ? entry.salesCount : 0,
        totalAmount: entry ? entry.totalAmount : 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Get worker performance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch performance data' });
  }
};

// @desc    Get worker's recent transactions
// @route   GET /api/workers/:id/transactions?date=&limit=10
// @access  Private
exports.getWorkerTransactions = async (req, res) => {
  try {
    const shopId = req.user.shop;
    const { date, limit = 10 } = req.query;

    const query = { shop: shopId, soldBy: req.params.id };

    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      query.createdAt = { $gte: d, $lt: next };
    }

    const sales = await Sale.find(query)
      .select('saleNumber items subtotal total paymentMethod paymentStatus customerName createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({ success: true, data: sales });
  } catch (error) {
    console.error('Get worker transactions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
};

// @desc    Get worker activity log
// @route   GET /api/workers/:id/activity?limit=20
// @access  Private
exports.getWorkerActivity = async (req, res) => {
  try {
    const shopId = req.user.shop;
    const workerId = req.params.id;
    const { limit = 20 } = req.query;

    // Get sales by this worker as activity entries
    const sales = await Sale.find({ shop: shopId, soldBy: workerId })
      .select('saleNumber total paymentMethod createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    const worker = await User.findById(workerId).select('fullName lastLogin createdAt').lean();

    const activities = [];

    // Sales as activities
    sales.forEach((s) => {
      activities.push({
        type: 'sale',
        action: `Recorded a sale #${s.saleNumber}`,
        detail: `KSh ${s.total.toLocaleString('en-KE')} — ${s.paymentMethod === 'cash' ? 'Cash' : s.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Card'}`,
        timestamp: s.createdAt,
      });
    });

    // Login activity (last login)
    if (worker?.lastLogin) {
      activities.push({
        type: 'login',
        action: 'Logged in',
        detail: null,
        timestamp: worker.lastLogin,
      });
    }

    // Joined activity
    if (worker?.createdAt) {
      activities.push({
        type: 'joined',
        action: 'Joined the team',
        detail: null,
        timestamp: worker.createdAt,
      });
    }

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      data: activities.slice(0, parseInt(limit)),
    });
  } catch (error) {
    console.error('Get worker activity error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity log' });
  }
};

// @desc    Invite a new worker
// @route   POST /api/workers/invite
// @access  Private
exports.inviteWorker = async (req, res) => {
  try {
    let shopId = req.user.shop;

    // Auto-recover: if admin has no shop linked, find it by ownership
    if (!shopId && req.user.role === 'admin') {
      const Shop = require('../models/Shop');
      const shop = await Shop.findOne({ owner: req.user._id });
      if (shop) {
        shopId = shop._id;
        // Auto-link the shop back to the user
        req.user.shop = shopId;
        await req.user.save();
        console.log(`🔗 Auto-linked shop ${shopId} to user ${req.user.email}`);
      }
    }

    if (!shopId) {
      return res.status(400).json({ success: false, message: 'No shop found. Please complete onboarding first.' });
    }

    const { fullName, email, phone, role, permissions } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ success: false, message: 'Full name and email are required' });
    }

    if (!role || !['admin', 'manager', 'cashier'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Valid role is required' });
    }

    // Check if already invited
    const existing = await User.findOne({ email: email.toLowerCase(), shop: shopId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.status === 'pending'
          ? 'An invitation has already been sent to this email'
          : 'A worker with this email already exists',
      });
    }

    const worker = await User.create({
      shop: shopId,
      fullName,
      email: email.toLowerCase(),
      phone: phone || '',
      role,
      permissions: permissions || [],
      status: 'pending',
      invitedAt: new Date(),
      isActive: true,
    });

    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.to(shopId.toString()).emit('worker:invited', {
        workerId: worker._id,
        fullName: worker.fullName,
        role: worker.role,
      });
    }

    res.status(201).json({ success: true, data: worker });
  } catch (error) {
    console.error('Invite worker error:', error);
    res.status(500).json({ success: false, message: 'Failed to invite worker' });
  }
};

// @desc    Update worker (role, permissions)
// @route   PUT /api/workers/:id
// @access  Private
exports.updateWorker = async (req, res) => {
  try {
    const { role, permissions, phone } = req.body;

    const update = {};
    if (role) update.role = role;
    if (permissions) update.permissions = permissions;
    if (phone !== undefined) update.phone = phone;

    const worker = await User.findOneAndUpdate(
      { _id: req.params.id, shop: req.user.shop },
      update,
      { new: true, runValidators: true }
    ).select('fullName email phone role avatar status invitedAt lastLogin permissions');

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    // Emit Socket.io event if role changed
    if (role) {
      const io = req.app.get('io');
      if (io) {
        io.to(req.user.shop.toString()).emit('worker:role-changed', {
          workerId: worker._id,
          fullName: worker.fullName,
          role: worker.role,
        });
      }
    }

    res.status(200).json({ success: true, data: worker });
  } catch (error) {
    console.error('Update worker error:', error);
    res.status(500).json({ success: false, message: 'Failed to update worker' });
  }
};

// @desc    Remove worker (soft delete)
// @route   DELETE /api/workers/:id
// @access  Private
exports.removeWorker = async (req, res) => {
  try {
    const worker = await User.findOneAndUpdate(
      { _id: req.params.id, shop: req.user.shop },
      { isActive: false, isDeleted: true },
      { new: true }
    );

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.shop.toString()).emit('worker:removed', {
        workerId: worker._id,
        fullName: worker.fullName,
      });
    }

    res.status(200).json({ success: true, message: 'Worker removed successfully' });
  } catch (error) {
    console.error('Remove worker error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove worker' });
  }
};

// @desc    Resend invitation
// @route   POST /api/workers/:id/resend-invite
// @access  Private
exports.resendInvite = async (req, res) => {
  try {
    const worker = await User.findOne({
      _id: req.params.id,
      shop: req.user.shop,
      status: 'pending',
    });

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Pending worker not found' });
    }

    worker.invitedAt = new Date();
    await worker.save();

    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.shop.toString()).emit('worker:invited', {
        workerId: worker._id,
        fullName: worker.fullName,
        role: worker.role,
      });
    }

    res.status(200).json({ success: true, message: 'Invitation resent successfully' });
  } catch (error) {
    console.error('Resend invite error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend invitation' });
  }
};

