const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['low_stock', 'expiry', 'report', 'system', 'sale', 'worker_login'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  link: String,
  metadata: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true,
});

// Index for faster queries
notificationSchema.index({ shop: 1, user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
