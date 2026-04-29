const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  category: {
    type: String,
    enum: ['rent', 'electricity', 'salary', 'utilities', 'supplies', 'other'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  description: String,
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receipt: String,
}, {
  timestamps: true,
});

// Index for faster queries
expenseSchema.index({ shop: 1, date: -1 });
expenseSchema.index({ shop: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
