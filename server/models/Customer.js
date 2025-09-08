const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 15
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 100
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
    enum: ['Retailer', 'Wholesaler', 'Farmer', 'Distributor', 'Individual'],
    default: 'Individual'
  },
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: 15
  },
  totalPurchases: {
    type: Number,
    default: 0,
    min: 0
  },
  lastPurchaseDate: {
    type: Date
  },
  customerGroup: {
    type: String,
    enum: ['new', 'regular', 'vip', 'wholesale'],
    default: 'new'
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  paymentTerms: {
    type: Number, // Days
    default: 0
  },
  orderCount: {
    type: Number,
    default: 0
  },
  averageOrderValue: {
    type: Number,
    default: 0
  },
  lastOrderDate: {
    type: Date
  },
  firstOrderDate: {
    type: Date
  },
  preferredLanguage: {
    type: String,
    enum: ['en', 'mr'],
    default: 'en'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    maxlength: 500
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
