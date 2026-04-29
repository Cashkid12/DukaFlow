const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  saleNumber: {
    type: String,
    required: true,
    unique: true,
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: String,
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
  }],
  subtotal: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
  totalProfit: {
    type: Number,
    default: 0,
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mpesa', 'card'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'partial'],
    default: 'paid',
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  soldBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customerName: String,
  customerPhone: String,
  notes: String,
}, {
  timestamps: true,
});

// Auto-generate sale number and calculate profit
saleSchema.pre('save', async function(next) {
  if (!this.saleNumber) {
    const count = await mongoose.model('Sale').countDocuments();
    this.saleNumber = `SAL${String(count + 1).padStart(5, '0')}`;
  }

  // Calculate total profit from items
  if (this.items && this.items.length > 0) {
    let totalCost = 0;
    let totalRevenue = 0;

    for (const item of this.items) {
      const product = await mongoose.model('Product').findById(item.product);
      if (product) {
        totalCost += (product.costPrice || 0) * item.quantity;
        totalRevenue += item.price * item.quantity;
      }
    }

    this.totalProfit = totalRevenue - totalCost;
  }

  next();
});

// Index for faster queries
saleSchema.index({ shop: 1, createdAt: -1 });
saleSchema.index({ shop: 1, soldBy: 1 });

module.exports = mongoose.model('Sale', saleSchema);
