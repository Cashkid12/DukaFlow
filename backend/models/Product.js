const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  description: String,
  category: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  costPrice: {
    type: Number,
    min: 0,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
  },
  image: String,
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
  barcode: String,
  // Business-type specific fields
  attributes: {
    // Clothing
    size: String,
    color: String,
    material: String,
    brand: String,
    
    // Pharmacy
    form: { type: String, enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'powder', 'other'] },
    strength: String, // e.g., "500mg", "250ml"
    prescriptionRequired: { type: Boolean, default: false },
    expiryDate: Date,
    batchNumber: String,
    
    // Hardware
    unit: { type: String, enum: ['piece', 'box', 'set', 'meter', 'kg', 'roll', 'bucket', 'bag', 'pair', 'pack'] },
    specifications: String,
    
    // Electronics
    condition: { type: String, enum: ['new', 'refurbished', 'used'] },
    warranty: String,
    model: String,
    
    // Grocery & Cosmetics
    weight: String,
    organic: Boolean,
    shade: String,
    skinType: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for faster queries
productSchema.index({ shop: 1, category: 1 });
productSchema.index({ shop: 1, name: 'text' });

module.exports = mongoose.model('Product', productSchema);
