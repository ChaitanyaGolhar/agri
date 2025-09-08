const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 20
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  // For buy_x_get_y promotions
  buyQuantity: {
    type: Number,
    min: 1
  },
  getQuantity: {
    type: Number,
    min: 1
  },
  // Minimum order requirements
  minOrderAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  minOrderQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  // Maximum discount limits
  maxDiscountAmount: {
    type: Number,
    min: 0
  },
  // Usage limits
  usageLimit: {
    type: Number,
    min: 1
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  usageLimitPerCustomer: {
    type: Number,
    min: 1
  },
  // Validity period
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  // Targeting rules
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: String
  }],
  applicableCustomerGroups: [{
    type: String,
    enum: ['new', 'regular', 'vip', 'wholesale']
  }],
  excludeProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  // Status and settings
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  // Analytics
  totalRevenue: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
promotionSchema.index({ code: 1 });
promotionSchema.index({ createdBy: 1, isActive: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });
promotionSchema.index({ type: 1 });

// Validation
promotionSchema.pre('save', function(next) {
  if (this.startDate >= this.endDate) {
    return next(new Error('End date must be after start date'));
  }
  
  if (this.type === 'buy_x_get_y' && (!this.buyQuantity || !this.getQuantity)) {
    return next(new Error('Buy quantity and get quantity are required for buy_x_get_y promotions'));
  }
  
  next();
});

// Methods
promotionSchema.methods.isValid = function() {
  const now = new Date();
  return this.isActive && 
         this.startDate <= now && 
         this.endDate >= now &&
         (!this.usageLimit || this.usageCount < this.usageLimit);
};

promotionSchema.methods.canUsePromotion = function(customer, orderAmount, orderQuantity) {
  if (!this.isValid()) return false;
  
  // Check minimum requirements
  if (orderAmount < this.minOrderAmount) return false;
  if (orderQuantity < this.minOrderQuantity) return false;
  
  // Check customer group eligibility
  if (this.applicableCustomerGroups.length > 0) {
    if (!this.applicableCustomerGroups.includes(customer.customerGroup)) {
      return false;
    }
  }
  
  return true;
};

module.exports = mongoose.model('Promotion', promotionSchema);
