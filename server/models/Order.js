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

// Pre-save middleware to generate invoice number
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
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Order', orderSchema);
