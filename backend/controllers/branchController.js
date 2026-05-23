const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Notification = require('../models/Notification');

// ──────────────────────────────────────────────
// GET /api/branches — Get all branches for current shop
// ──────────────────────────────────────────────
exports.getBranches = async (req, res) => {
  try {
    const shop = await Shop.findById(req.shopId)
      .select('name branches multiBranchEnabled subscription')
      .lean();

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    // Determine if multi-branch is available
    const isBiashara = shop.subscription?.plan === 'biashara';
    const hasMultiBranch = isBiashara && shop.multiBranchEnabled;

    // Build branch list — always include "Main" as first branch
    const branches = [
      {
        _id: 'main',
        name: shop.name,
        location: 'Main Branch',
        isMain: true,
        workerCount: 0,
      },
      ...(hasMultiBranch ? shop.branches.map((b) => ({
        _id: b._id.toString(),
        name: b.name,
        location: b.location || '',
        isMain: false,
        workerCount: (b.assignedWorkers || []).length,
      })) : []),
    ];

    res.status(200).json({
      success: true,
      data: {
        branches,
        hasMultiBranch,
        plan: shop.subscription?.plan || 'starta',
        shopName: shop.name,
      },
    });
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch branches' });
  }
};

// ──────────────────────────────────────────────
// POST /api/branches/:branchId/switch — Switch active branch
// ──────────────────────────────────────────────
exports.switchBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    const shop = await Shop.findById(req.shopId)
      .select('name branches multiBranchEnabled subscription')
      .lean();

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    // Main branch
    if (branchId === 'main') {
      return res.status(200).json({
        success: true,
        data: {
          branchId: 'main',
          branchName: shop.name,
          location: 'Main Branch',
          isMain: true,
        },
        message: `Switched to ${shop.name}`,
      });
    }

    // Check multi-branch access
    const isBiashara = shop.subscription?.plan === 'biashara';
    if (!isBiashara || !shop.multiBranchEnabled) {
      return res.status(403).json({
        success: false,
        message: 'Multi-branch is not enabled on your plan',
      });
    }

    // Find the branch
    const branch = shop.branches.find(
      (b) => b._id.toString() === branchId
    );

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        branchId: branch._id.toString(),
        branchName: branch.name,
        location: branch.location || '',
        isMain: false,
        workerCount: (branch.assignedWorkers || []).length,
      },
      message: `Switched to ${branch.name}`,
    });
  } catch (error) {
    console.error('Switch branch error:', error);
    res.status(500).json({ success: false, message: 'Failed to switch branch' });
  }
};

// ──────────────────────────────────────────────
// GET /api/branches/:branchId/stats — Get stats for a branch
// ──────────────────────────────────────────────
exports.getBranchStats = async (req, res) => {
  try {
    const { branchId } = req.params;

    const shop = await Shop.findById(req.shopId)
      .select('name branches multiBranchEnabled subscription')
      .lean();

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    // Validate branch exists
    if (branchId !== 'main') {
      const exists = shop.branches.some((b) => b._id.toString() === branchId);
      if (!exists) {
        return res.status(404).json({ success: false, message: 'Branch not found' });
      }
    }

    // Build filter for branch-scoped queries
    const branchFilter = branchId === 'main'
      ? { shop: req.shopId, $or: [{ branch: { $exists: false } }, { branch: 'main' }] }
      : { shop: req.shopId, branch: branchId };

    // Fetch counts in parallel
    const [productCount, totalSales, recentSales] = await Promise.all([
      Product.countDocuments(branchFilter),
      Sale.countDocuments({ ...branchFilter, status: 'completed' }),
      Sale.find(branchFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('totalAmount status createdAt')
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        branchId,
        productCount,
        totalSales,
        recentSales,
      },
    });
  } catch (error) {
    console.error('Get branch stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch branch stats' });
  }
};
