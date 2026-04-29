const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
  },
  name: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  logo: String,
  businessType: {
    type: String,
    enum: ['clothing', 'electronics', 'grocery', 'pharmacy', 'hardware', 'cosmetics', 'other'],
    required: true,
  },
  settings: {
    categories: [String],
    attributes: [String],
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    currency: {
      type: String,
      default: 'KES',
    },
    trackExpiry: {
      type: Boolean,
      default: false,
    },
  },
  subscription: {
    plan: {
      type: String,
      enum: ['starta', 'kuuza', 'biashara'],
      default: 'starta',
    },
    status: {
      type: String,
      enum: ['trial', 'active', 'suspended', 'cancelled'],
      default: 'trial',
    },
    trialEnds: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
      },
    },
    currentPeriodEnd: Date,
    paymentMethod: {
      type: String,
      enum: ['mpesa', 'card'],
    },
  },
  contact: {
    phone: String,
    email: String,
    address: String,
    city: String,
    country: {
      type: String,
      default: 'Kenya',
    },
  },
  branches: [{
    name: String,
    location: String,
    assignedWorkers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  }],
  multiBranchEnabled: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for faster queries
shopSchema.index({ slug: 1 });
shopSchema.index({ owner: 1 });

module.exports = mongoose.model('Shop', shopSchema);
