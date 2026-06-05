const User = require('../models/User');
const Sale = require('../models/Sale');
const crypto = require('crypto');
const { sendEmail } = require('../config/mail');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ─── Email template helpers ────────────────────────────────────────────────

const buildInvitationEmail = ({ workerName, shopName, inviterName, role, acceptUrl }) => {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        
        <!-- Header -->
        <tr><td style="background:#312E81;padding:32px 24px;text-align:center">
          <p style="margin:0;font-size:28px">🏪</p>
          <p style="margin:8px 0 0;font-size:20px;font-weight:700;color:#FFFFFF">DukaFlow</p>
        </td></tr>
        
        <!-- Body -->
        <tr><td style="padding:32px 28px">
          <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1E293B">Hi ${workerName},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6">
            <strong>${inviterName}</strong> has invited you to join <strong>"${shopName}"</strong> as a <strong>${roleLabel}</strong> on DukaFlow.
          </p>
          
          <!-- Info Card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border-radius:12px;margin-bottom:24px">
            <tr><td style="padding:20px 24px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:6px 0;font-size:14px;color:#1E293B"><strong>🏪 Shop:</strong> ${shopName}</td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#1E293B"><strong>🔖 Role:</strong> ${roleLabel}</td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#1E293B"><strong>👋 Invited by:</strong> ${inviterName}</td></tr>
              </table>
            </td></tr>
          </table>
          
          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
            <tr><td align="center">
              <a href="${acceptUrl}" style="display:inline-block;background:#312E81;color:#FFFFFF;font-size:16px;font-weight:600;padding:14px 40px;border-radius:12px;text-decoration:none">
                Accept Invitation →
              </a>
            </td></tr>
          </table>
          
          <p style="margin:0;font-size:13px;color:#94A3B8;text-align:center">
            This invitation expires in 7 days.
          </p>
        </td></tr>
        
        <!-- Divider -->
        <tr><td style="border-top:1px solid #E2E8F0"></td></tr>
        
        <!-- Footer -->
        <tr><td style="padding:20px 28px">
          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#1E293B">What is DukaFlow?</p>
          <p style="margin:0;font-size:13px;color:#64748B;line-height:1.6">
            DukaFlow helps shop owners track inventory, sales, and profits. Simple, fast, and built for Kenyan shops.
          </p>
        </td></tr>
        
        <tr><td style="border-top:1px solid #E2E8F0;padding:16px 28px;text-align:center">
          <p style="margin:0;font-size:12px;color:#94A3B8">© ${new Date().getFullYear()} DukaFlow. All rights reserved.</p>
        </td></tr>
        
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

// ─── Helper: generate unique invitation token ───────────────────────────────

const generateToken = () => crypto.randomBytes(32).toString('hex');

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

    const normalizedEmail = email.toLowerCase().trim();

    // Check if already an active worker in this shop
    const existingActive = await User.findOne({
      email: normalizedEmail,
      shop: shopId,
      status: { $in: ['online', 'offline', 'active'] },
      isActive: true,
    });
    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: 'This person is already a worker in your shop.',
      });
    }

    // Check if there's a pending invitation — resend with fresh token
    const existingPending = await User.findOne({
      email: normalizedEmail,
      shop: shopId,
      status: 'pending',
    });

    // Get shop & inviter info for the email
    const Shop = require('../models/Shop');
    const shop = await Shop.findById(shopId).select('name').lean();
    const shopName = shop?.name || 'Your Shop';
    const inviterName = req.user.fullName || 'Shop Owner';

    let worker;
    const token = generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    if (existingPending) {
      // Resend: update token and expiry
      existingPending.invitationToken = token;
      existingPending.invitationSentAt = now;
      existingPending.invitationExpiresAt = expiresAt;
      existingPending.invitedBy = req.user._id;
      existingPending.invitedAt = now;
      existingPending.fullName = fullName;
      existingPending.phone = phone || existingPending.phone;
      existingPending.role = role;
      await existingPending.save();
      worker = existingPending;
    } else {
      // New invitation
      worker = await User.create({
        shop: shopId,
        fullName,
        email: normalizedEmail,
        phone: phone || '',
        role,
        permissions: permissions || [],
        status: 'pending',
        invitedAt: now,
        isActive: true,
        invitationToken: token,
        invitationSentAt: now,
        invitationExpiresAt: expiresAt,
        invitedBy: req.user._id,
      });
    }

    // Send invitation email
    const acceptUrl = `${CLIENT_URL}/accept-invitation?token=${token}`;
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: `You've been invited to join ${shopName} on DukaFlow 🏪`,
        html: buildInvitationEmail({
          workerName: fullName,
          shopName,
          inviterName,
          role,
          acceptUrl,
        }),
      });
      console.log(`📧 Invitation email sent to ${normalizedEmail}`);
    } catch (emailErr) {
      console.error('❌ Failed to send invitation email:', emailErr.message);
      // Don't fail the request — worker is created, email can be resent
    }

    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.to(shopId.toString()).emit('worker:invited', {
        workerId: worker._id,
        fullName: worker.fullName,
        role: worker.role,
      });
    }

    const message = existingPending
      ? 'Invitation resent successfully'
      : `Invitation sent to ${normalizedEmail}`;

    res.status(201).json({
      success: true,
      message,
      data: {
        _id: worker._id,
        fullName: worker.fullName,
        email: worker.email,
        role: worker.role,
        status: worker.status,
        invitationSentAt: worker.invitationSentAt,
      },
    });
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

// @desc    Cancel pending invitation (hard delete the pending worker doc)
// @route   DELETE /api/workers/:id/cancel-invite
// @access  Private
exports.cancelInvite = async (req, res) => {
  try {
    const worker = await User.findOneAndDelete({
      _id: req.params.id,
      shop: req.user.shop,
      status: 'pending',
    });

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Pending invitation not found' });
    }

    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.shop.toString()).emit('worker:cancelled', {
        workerId: worker._id,
        fullName: worker.fullName,
      });
    }

    res.status(200).json({ success: true, message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error('Cancel invite error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel invitation' });
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

    // Regenerate token and expiry
    const token = generateToken();
    const now = new Date();
    worker.invitationToken = token;
    worker.invitationSentAt = now;
    worker.invitationExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    worker.invitedAt = now;
    await worker.save();

    // Resend email
    const Shop = require('../models/Shop');
    const shop = await Shop.findById(req.user.shop).select('name').lean();
    const shopName = shop?.name || 'Your Shop';
    const inviterName = req.user.fullName || 'Shop Owner';
    const acceptUrl = `${CLIENT_URL}/accept-invitation?token=${token}`;

    try {
      await sendEmail({
        to: worker.email,
        subject: `Reminder: Join ${shopName} on DukaFlow 🏪`,
        html: buildInvitationEmail({
          workerName: worker.fullName,
          shopName,
          inviterName,
          role: worker.role,
          acceptUrl,
        }),
      });
      console.log(`📧 Resent invitation email to ${worker.email}`);
    } catch (emailErr) {
      console.error('❌ Failed to resend invitation email:', emailErr.message);
    }

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

// @desc    Verify invitation token (PUBLIC — no auth required)
// @route   GET /api/workers/verify-invitation?token=xxxxx
// @access  Public
exports.verifyInvitation = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Invitation token is required' });
    }

    const worker = await User.findOne({ invitationToken: token })
      .populate('shop', 'name')
      .populate('invitedBy', 'fullName')
      .lean();

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Invalid invitation link.' });
    }

    // Check if already accepted (has clerkId)
    if (worker.clerkId) {
      return res.status(400).json({ success: false, message: 'This invitation has already been accepted.' });
    }

    // Check if status is no longer pending
    if (worker.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: worker.status === 'declined'
          ? 'This invitation has been declined.'
          : 'This invitation is no longer valid.',
      });
    }

    // Check expiry
    if (worker.invitationExpiresAt && new Date() > new Date(worker.invitationExpiresAt)) {
      return res.status(410).json({
        success: false,
        message: 'This invitation has expired. Please ask your admin to send a new one.',
      });
    }

    const shopName = worker.shop?.name || 'Unknown Shop';
    const inviterName = worker.invitedBy?.fullName || 'Shop Owner';
    const roleLabel = (worker.role || 'cashier').charAt(0).toUpperCase() + (worker.role || 'cashier').slice(1);

    res.status(200).json({
      success: true,
      data: {
        shopName,
        workerName: worker.fullName,
        role: roleLabel,
        email: worker.email,
        invitedBy: inviterName,
      },
    });
  } catch (error) {
    console.error('Verify invitation error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify invitation' });
  }
};

// @desc    Accept invitation after Clerk sign-up (AUTH REQUIRED)
// @route   POST /api/workers/accept-invitation
// @access  Private (new Clerk user, not yet linked to shop)
exports.acceptInvitation = async (req, res) => {
  try {
    const { invitationToken } = req.body;

    if (!invitationToken) {
      return res.status(400).json({ success: false, message: 'Invitation token is required' });
    }

    // Find the pending worker by token
    const worker = await User.findOne({
      invitationToken,
      status: 'pending',
    });

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Invalid or expired invitation link.' });
    }

    // Check expiry
    if (worker.invitationExpiresAt && new Date() > new Date(worker.invitationExpiresAt)) {
      return res.status(410).json({
        success: false,
        message: 'This invitation has expired. Please ask your admin to send a new one.',
      });
    }

    // Get the Clerk user from the authenticated request
    const clerkId = req.user.clerkId;
    if (!clerkId) {
      return res.status(400).json({ success: false, message: 'Unable to identify your account. Please try again.' });
    }

    // Check if this Clerk user is already linked to another shop
    const existingUser = await User.findOne({ clerkId, isActive: true });
    if (existingUser && existingUser._id.toString() !== worker._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Your account is already linked to another shop.',
      });
    }

    // Link the worker: update clerkId, status, and invitation fields
    const now = new Date();
    worker.clerkId = clerkId;
    worker.status = 'online';
    worker.invitationAcceptedAt = now;
    worker.invitationToken = undefined; // Clear token after use
    worker.isActive = true;

    // Copy Clerk profile data if available
    if (req.clerkUser) {
      if (req.clerkUser.firstName || req.clerkUser.lastName) {
        // Keep the invited name unless Clerk has a better one
        if (!worker.fullName || worker.fullName === worker.email) {
          worker.fullName = [req.clerkUser.firstName, req.clerkUser.lastName].filter(Boolean).join(' ');
        }
      }
      if (req.clerkUser.imageUrl) {
        worker.avatar = req.clerkUser.imageUrl;
      }
      if (req.clerkUser.email && !worker.email) {
        worker.email = req.clerkUser.email;
      }
    }

    await worker.save();

    // Get shop name for welcome message
    const Shop = require('../models/Shop');
    const shop = await Shop.findById(worker.shop).select('name').lean();
    const shopName = shop?.name || 'the shop';

    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.to(worker.shop.toString()).emit('worker:accepted', {
        workerId: worker._id,
        fullName: worker.fullName,
        role: worker.role,
      });
    }

    console.log(`✅ Worker ${worker.fullName} accepted invitation to ${shopName}`);

    res.status(200).json({
      success: true,
      message: `Welcome to ${shopName}!`,
      redirectTo: '/dashboard',
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ success: false, message: 'Unable to accept invitation. Please try again.' });
  }
};

