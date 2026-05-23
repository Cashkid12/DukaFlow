const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Notification = require('../models/Notification');

// ──────────────────────────────────────────────
// GET /api/settings — Full shop settings
// ──────────────────────────────────────────────
exports.getSettings = async (req, res) => {
  try {
    const shop = await Shop.findById(req.shopId)
      .select('-__v')
      .lean();

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    // Get counts for Data & Privacy tab
    const [productCount, saleCount, workerCount] = await Promise.all([
      Product.countDocuments({ shop: req.shopId }),
      Sale.countDocuments({ shop: req.shopId }),
      User.countDocuments({ shop: req.shopId, isActive: true, isDeleted: false }),
    ]);

    res.status(200).json({
      success: true,
      data: { ...shop, counts: { products: productCount, sales: saleCount, workers: workerCount } },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
};

// ──────────────────────────────────────────────
// PUT /api/settings/profile — Update shop profile
// ──────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, logo, description, phone, email, address } = req.body;

    const shop = await Shop.findById(req.shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    if (name !== undefined) shop.name = name;
    if (logo !== undefined) shop.logo = logo;
    if (description !== undefined) shop.description = description;
    if (phone !== undefined) shop.contact.phone = phone;
    if (email !== undefined) shop.contact.email = email;
    if (address !== undefined) shop.contact.address = address;

    await shop.save();

    res.status(200).json({ success: true, data: shop, message: 'Shop profile updated' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// ──────────────────────────────────────────────
// PUT /api/settings/categories — Update categories
// ──────────────────────────────────────────────
exports.updateCategories = async (req, res) => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      return res.status(400).json({ success: false, message: 'Categories must be an array' });
    }

    const shop = await Shop.findById(req.shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    shop.settings.categories = categories;
    await shop.save();

    res.status(200).json({ success: true, data: shop.settings.categories, message: 'Categories updated' });
  } catch (error) {
    console.error('Update categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to update categories' });
  }
};

// ──────────────────────────────────────────────
// PUT /api/settings/attributes — Update attributes
// ──────────────────────────────────────────────
exports.updateAttributes = async (req, res) => {
  try {
    const { attributes } = req.body;

    if (!Array.isArray(attributes)) {
      return res.status(400).json({ success: false, message: 'Attributes must be an array' });
    }

    const shop = await Shop.findById(req.shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    shop.settings.attributes = attributes;
    await shop.save();

    res.status(200).json({ success: true, data: shop.settings.attributes, message: 'Attributes updated' });
  } catch (error) {
    console.error('Update attributes error:', error);
    res.status(500).json({ success: false, message: 'Failed to update attributes' });
  }
};

// ──────────────────────────────────────────────
// GET /api/settings/billing — Get billing info
// ──────────────────────────────────────────────
exports.getBilling = async (req, res) => {
  try {
    const shop = await Shop.findById(req.shopId)
      .select('subscription')
      .lean();

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    // Generate mock invoice history based on subscription data
    const invoices = [];
    if (shop.subscription.status === 'active') {
      const now = new Date();
      for (let i = 0; i < 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        invoices.push({
          id: `INV-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}01`,
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          amount: getPlanPrice(shop.subscription.plan),
          status: 'paid',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        subscription: shop.subscription,
        invoices,
      },
    });
  } catch (error) {
    console.error('Get billing error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch billing' });
  }
};

// ──────────────────────────────────────────────
// POST /api/settings/billing/change-plan — Change plan
// ──────────────────────────────────────────────
exports.changePlan = async (req, res) => {
  try {
    const { plan } = req.body;
    const validPlans = ['starta', 'kuuza', 'biashara'];

    if (!validPlans.includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    const shop = await Shop.findById(req.shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const oldPlan = shop.subscription.plan;
    shop.subscription.plan = plan;
    shop.subscription.status = 'active';

    // Set next billing period end (30 days from now)
    const nextBilling = new Date();
    nextBilling.setDate(nextBilling.getDate() + 30);
    shop.subscription.currentPeriodEnd = nextBilling;

    // If downgrading to starta, disable multi-branch
    if (plan === 'starta') {
      shop.multiBranchEnabled = false;
    }

    await shop.save();

    // Create notification for plan change
    await Notification.create({
      shop: req.shopId,
      type: 'plan_change',
      title: 'Plan Changed',
      message: `Your plan has been changed from ${planLabel(oldPlan)} to ${planLabel(plan)}`,
    });

    res.status(200).json({
      success: true,
      data: shop.subscription,
      message: `Plan changed to ${planLabel(plan)}`,
    });
  } catch (error) {
    console.error('Change plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to change plan' });
  }
};

// ──────────────────────────────────────────────
// PUT /api/settings/billing/payment — Update payment method
// ──────────────────────────────────────────────
exports.updatePayment = async (req, res) => {
  try {
    const { paymentMethod, phoneNumber } = req.body;

    const shop = await Shop.findById(req.shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    if (paymentMethod) shop.subscription.paymentMethod = paymentMethod;

    await shop.save();

    res.status(200).json({
      success: true,
      data: { paymentMethod: shop.subscription.paymentMethod, phone: phoneNumber || shop.contact.phone },
      message: 'Payment method updated',
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to update payment' });
  }
};

// ──────────────────────────────────────────────
// GET /api/settings/billing/invoices — Invoice history
// ──────────────────────────────────────────────
exports.getInvoices = async (req, res) => {
  try {
    const shop = await Shop.findById(req.shopId)
      .select('subscription')
      .lean();

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const invoices = [];
    if (shop.subscription.status === 'active') {
      const now = new Date();
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        invoices.push({
          id: `INV-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}01`,
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          amount: `KSh ${getPlanPrice(shop.subscription.plan).toLocaleString()}`,
          status: 'paid',
        });
      }
    }

    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
  }
};

// ──────────────────────────────────────────────
// POST /api/settings/multi-branch — Multi-branch operations
// ──────────────────────────────────────────────
exports.manageMultiBranch = async (req, res) => {
  try {
    const { action } = req.body;

    const shop = await Shop.findById(req.shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    if (action === 'toggle') {
      if (shop.subscription.plan !== 'biashara') {
        return res.status(403).json({ success: false, message: 'Multi-branch is only available on the Biashara plan' });
      }
      shop.multiBranchEnabled = !shop.multiBranchEnabled;
      await shop.save();
      return res.status(200).json({ success: true, data: { multiBranchEnabled: shop.multiBranchEnabled }, message: 'Multi-branch toggled' });
    }

    if (action === 'add') {
      const { name, location, assignedWorkers } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Branch name is required' });
      }
      shop.branches.push({ name, location: location || '', assignedWorkers: assignedWorkers || [] });
      await shop.save();
      return res.status(201).json({ success: true, data: shop.branches, message: 'Branch added' });
    }

    if (action === 'update') {
      const { branchId, name, location, assignedWorkers } = req.body;
      const branch = shop.branches.id(branchId);
      if (!branch) {
        return res.status(404).json({ success: false, message: 'Branch not found' });
      }
      if (name !== undefined) branch.name = name;
      if (location !== undefined) branch.location = location;
      if (assignedWorkers !== undefined) branch.assignedWorkers = assignedWorkers;
      await shop.save();
      return res.status(200).json({ success: true, data: shop.branches, message: 'Branch updated' });
    }

    if (action === 'delete') {
      const { branchId } = req.body;
      shop.branches.pull(branchId);
      await shop.save();
      return res.status(200).json({ success: true, data: shop.branches, message: 'Branch deleted' });
    }

    return res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (error) {
    console.error('Multi-branch error:', error);
    res.status(500).json({ success: false, message: 'Failed to manage branches' });
  }
};

// ──────────────────────────────────────────────
// POST /api/settings/export — Export data
// ──────────────────────────────────────────────
exports.exportData = async (req, res) => {
  try {
    const { type, dateFrom, dateTo } = req.body;

    if (type === 'products') {
      const products = await Product.find({ shop: req.shopId })
        .select('name category price costPrice stock sku createdAt')
        .lean();

      const csv = ['Name,Category,Price,Cost Price,Stock,SKU,Created At']
        .concat(products.map(p =>
          `"${p.name}","${p.category || ''}",${p.price},${p.costPrice || ''},${p.stock},"${p.sku || ''}","${p.createdAt}"`
        ))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
      return res.send(csv);
    }

    if (type === 'transactions') {
      const filter = { shop: req.shopId };
      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
      }

      const sales = await Sale.find(filter)
        .select('createdAt totalAmount paymentMethod soldBy')
        .populate('soldBy', 'fullName')
        .lean();

      const csv = ['Date,Amount,Payment Method,Worker']
        .concat(sales.map(s =>
          `"${s.createdAt}","KSh ${s.totalAmount}","${s.paymentMethod}","${s.soldBy?.fullName || 'N/A'}"`
        ))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
      return res.send(csv);
    }

    return res.status(400).json({ success: false, message: 'Invalid export type' });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export data' });
  }
};

// ──────────────────────────────────────────────
// PUT /api/settings/notifications — Update notification preferences
// ──────────────────────────────────────────────
exports.updateNotifications = async (req, res) => {
  try {
    const { emailReports, alerts } = req.body;

    const shop = await Shop.findById(req.shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    if (emailReports) {
      if (emailReports.daily !== undefined) shop.notificationPreferences.emailReports.daily = emailReports.daily;
      if (emailReports.weekly !== undefined) shop.notificationPreferences.emailReports.weekly = emailReports.weekly;
      if (emailReports.monthly !== undefined) shop.notificationPreferences.emailReports.monthly = emailReports.monthly;
    }

    if (alerts) {
      if (alerts.lowStock !== undefined) shop.notificationPreferences.alerts.lowStock = alerts.lowStock;
      if (alerts.expiry !== undefined) shop.notificationPreferences.alerts.expiry = alerts.expiry;
      if (alerts.expiryDays !== undefined) shop.notificationPreferences.alerts.expiryDays = alerts.expiryDays;
      if (alerts.workerLogin !== undefined) shop.notificationPreferences.alerts.workerLogin = alerts.workerLogin;
      if (alerts.largeSale !== undefined) shop.notificationPreferences.alerts.largeSale = alerts.largeSale;
      if (alerts.largeSaleAmount !== undefined) shop.notificationPreferences.alerts.largeSaleAmount = alerts.largeSaleAmount;
    }

    await shop.save();

    res.status(200).json({
      success: true,
      data: shop.notificationPreferences,
      message: 'Notification preferences updated',
    });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
};

// ──────────────────────────────────────────────
// DELETE /api/settings/delete-account — Delete shop
// ──────────────────────────────────────────────
exports.deleteAccount = async (req, res) => {
  try {
    const shop = await Shop.findById(req.shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    // Soft-delete: deactivate shop and all related data
    shop.isActive = false;
    shop.subscription.status = 'cancelled';
    await shop.save();

    // Soft-delete all products
    await Product.updateMany({ shop: req.shopId }, { $set: { isActive: false } });

    // Soft-delete all workers
    await User.updateMany({ shop: req.shopId }, { $set: { isActive: false, isDeleted: true } });

    // Clear owner's shop reference
    await User.findByIdAndUpdate(shop.owner, { $set: { shop: null, isActive: false } });

    // Create final notification
    await Notification.create({
      shop: req.shopId,
      type: 'account_deleted',
      title: 'Account Deleted',
      message: 'Your shop account has been permanently deleted',
    });

    res.status(200).json({
      success: true,
      message: 'Your shop has been deleted',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
};

// ──────────────────────────────────────────────
// Helper functions
// ──────────────────────────────────────────────
function getPlanPrice(plan) {
  const prices = { starta: 750, kuuza: 1500, biashara: 3000 };
  return prices[plan] || 750;
}

function planLabel(plan) {
  const labels = { starta: 'Starta', kuuza: 'Kuuza', biashara: 'Biashara' };
  return labels[plan] || plan;
}

// Plan features for display
exports.getPlanFeatures = () => ({
  starta: ['1 User', '1 Shop Location', '500 Products', 'Basic Reports', 'Email Support'],
  kuuza: ['3 Users', '1 Shop Location', '2,000 Products', 'Advanced Reports', 'Credit Tracking', 'Priority Support'],
  biashara: ['10 Users', 'Unlimited Branches', 'Unlimited Products', 'All Reports + Analytics', 'Credit Tracking', 'Priority Support', 'Custom Branding', 'API Access'],
});

