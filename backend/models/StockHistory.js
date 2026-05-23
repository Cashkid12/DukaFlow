const mongoose = require('mongoose');

const stockHistorySchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['added', 'sold', 'adjusted', 'returned', 'restock', 'initial'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  previousStock: {
    type: Number,
    required: true,
  },
  newStock: {
    type: Number,
    required: true,
  },
  reference: String,
  notes: String,
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

stockHistorySchema.index({ product: 1, createdAt: -1 });
stockHistorySchema.index({ shop: 1 });

module.exports = mongoose.model('StockHistory', stockHistorySchema);
