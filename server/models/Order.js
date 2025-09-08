const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Promotion fields
  appliedPromotions: [{
    promotion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Promotion'
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y'],
      required: true
    }
  }],
  promotionDiscountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Cheque', 'Credit'],
    default: 'Cash'
  },
  // Credit sales fields
  isCreditSale: {
    type: Boolean,
    default: false
  },
  creditTerms: {
    dueDate: Date,
    paymentTerms: {
      type: String,
      enum: ['immediate', '7_days', '15_days', '30_days', '45_days', '60_days', '90_days'],
      default: 'immediate'
    }
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Partially Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  },
  deliveryDate: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 500
  },
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
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
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ createdBy: 1, orderStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ isCreditSale: 1, 'creditTerms.dueDate': 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'appliedPromotions.promotion': 1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.orderNumber) {
      // Use a more robust approach to generate unique order numbers
      let orderNumber;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!isUnique && attempts < maxAttempts) {
        const count = await this.constructor.countDocuments();
        const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
        orderNumber = `ORD-${String(count + 1).padStart(4, '0')}-${timestamp}`;
        
        // Check if this order number already exists
        const existing = await this.constructor.findOne({ orderNumber });
        if (!existing) {
          isUnique = true;
          this.orderNumber = orderNumber;
        }
        attempts++;
      }
      
      if (!isUnique) {
        // Fallback to timestamp-based number if all attempts fail
        this.orderNumber = `ORD-${Date.now()}`;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate invoice number and handle credit sales
orderSchema.pre('save', async function(next) {
  try {
    if (this.isNew && this.orderStatus === 'Confirmed' && !this.invoiceNumber) {
      let invoiceNumber;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!isUnique && attempts < maxAttempts) {
        const count = await this.constructor.countDocuments({ invoiceNumber: { $exists: true } });
        const timestamp = Date.now().toString().slice(-4);
        invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}-${timestamp}`;
        
        const existing = await this.constructor.findOne({ invoiceNumber });
        if (!existing) {
          isUnique = true;
          this.invoiceNumber = invoiceNumber;
        }
        attempts++;
      }
      
      if (!isUnique) {
        this.invoiceNumber = `INV-${Date.now()}`;
      }
    }

    // Handle credit sales logic
    if (this.paymentMethod === 'Credit') {
      this.isCreditSale = true;
      
      // Only set defaults if this is a new order and values aren't already set
      if (this.isNew && this.paidAmount === undefined) {
        this.paidAmount = 0;
      }
      if (this.isNew && this.remainingAmount === undefined) {
        this.remainingAmount = this.totalAmount;
      }
      if (this.isNew && !this.paymentStatus) {
        this.paymentStatus = 'Pending';
      }

      // Set due date based on payment terms
      if (this.creditTerms && this.creditTerms.paymentTerms && !this.creditTerms.dueDate) {
        const daysMap = {
          'immediate': 0,
          '7_days': 7,
          '15_days': 15,
          '30_days': 30,
          '45_days': 45,
          '60_days': 60,
          '90_days': 90
        };
        
        const days = daysMap[this.creditTerms.paymentTerms] || 0;
        this.creditTerms.dueDate = new Date(Date.now() + (days * 24 * 60 * 60 * 1000));
      }
    } else if (this.isNew) {
      // Only set defaults for new non-credit orders
      this.isCreditSale = false;
      if (this.paidAmount === undefined) {
        this.paidAmount = this.totalAmount;
      }
      if (this.remainingAmount === undefined) {
        this.remainingAmount = 0;
      }
      if (!this.paymentStatus) {
        this.paymentStatus = 'Paid';
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Method to calculate total discount from promotions
orderSchema.methods.calculatePromotionDiscount = function() {
  return this.appliedPromotions.reduce((total, promo) => total + promo.discountAmount, 0);
};

// Method to calculate payment amounts based on status
orderSchema.methods.calculatePaymentAmounts = function() {
  // Only auto-calculate if amounts aren't manually set
  if (this.paymentStatus === 'Paid' && this.paidAmount === undefined) {
    this.paidAmount = this.totalAmount;
    this.remainingAmount = 0;
  } else if (this.paymentStatus === 'Pending' && this.paidAmount === undefined) {
    this.paidAmount = 0;
    this.remainingAmount = this.totalAmount;
  } else if (this.paymentStatus === 'Partially Paid') {
    // For partially paid, calculate remaining amount based on paid amount
    this.remainingAmount = Math.max(0, this.totalAmount - (this.paidAmount || 0));
  }
  
  // Ensure amounts are consistent
  if (this.paidAmount !== undefined && this.remainingAmount !== undefined) {
    const calculatedTotal = this.paidAmount + this.remainingAmount;
    if (Math.abs(calculatedTotal - this.totalAmount) > 0.01) {
      // Adjust remaining amount to match total
      this.remainingAmount = this.totalAmount - this.paidAmount;
    }
  }
};

// Method to update payment status based on paid amount
orderSchema.methods.updatePaymentStatus = function() {
  if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = 'Paid';
    this.remainingAmount = 0;
  } else if (this.paidAmount > 0) {
    this.paymentStatus = 'Partially Paid';
    this.remainingAmount = this.totalAmount - this.paidAmount;
  } else {
    this.paymentStatus = 'Pending';
    this.remainingAmount = this.totalAmount;
  }
};

module.exports = mongoose.model('Order', orderSchema);
