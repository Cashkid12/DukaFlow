const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Clerk Integration
  clerkId: {
    type: String,
    unique: true,
    sparse: true, // Allows null values for legacy users
    index: true,
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false, // Made optional for Clerk users (set during onboarding)
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    index: true,
  },
  phone: String,
  password: {
    type: String,
    minlength: 6,
    select: false,
    required: false, // Optional for Clerk users (OAuth)
  },
  role: {
    type: String,
    enum: ['admin', 'employee'],
    default: 'admin',
  },
  permissions: [String],
  avatar: String, // Clerk profile image URL
  isActive: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false, // Soft delete for Clerk user.deleted events
  },
  lastLogin: Date,
  activeSessions: [{
    device: String,
    browser: String,
    ip: String,
    loginAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Index for faster queries
userSchema.index({ shop: 1, email: 1 });

module.exports = mongoose.model('User', userSchema);
