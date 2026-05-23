const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  field: {
    type: String,
    enum: ['costPrice', 'price', 'both'],
    required: true,
  },
  oldCostPrice: Number,
  newCostPrice: Number,
  oldSellingPrice: Number,
  newSellingPrice: Number,
  reason: {
    type: String,
    default: 'Manual update',
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

priceHistorySchema.index({ product: 1, createdAt: -1 });
priceHistorySchema.index({ shop: 1 });

module.exports = mongoose.model('PriceHistory', priceHistorySchema);
