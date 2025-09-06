const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  alternatePhone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  },
  businessType: {
    type: String,
    enum: ['Farmer', 'Retailer', 'Wholesaler', 'Cooperative', 'Other'],
    default: 'Farmer'
  },
  cropTypes: [{
    type: String,
    enum: ['Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Vegetables', 'Fruits', 'Spices', 'Other']
  }],
  creditLimit: {
    type: Number,
    default: 0
  },
  creditUsed: {
    type: Number,
    default: 0
  },
  totalPurchases: {
    type: Number,
    default: 0
  },
  lastPurchaseDate: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better search performance
customerSchema.index({ name: 'text', phone: 'text', email: 'text' });
customerSchema.index({ createdBy: 1, isActive: 1 });

module.exports = mongoose.model('Customer', customerSchema);
