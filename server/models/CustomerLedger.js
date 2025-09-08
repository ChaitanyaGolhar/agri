const mongoose = require('mongoose');

const customerLedgerSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  transactionType: {
    type: String,
    enum: ['credit_sale', 'payment', 'adjustment', 'interest', 'penalty'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  // Positive for credit sales/charges, negative for payments
  balance: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Cheque', 'Bank Transfer', 'Adjustment'],
    required: function() {
      return this.transactionType === 'payment';
    }
  },
  paymentReference: {
    type: String,
    maxlength: 100
  },
  dueDate: {
    type: Date
  },
  paidDate: {
    type: Date
  },
  isOverdue: {
    type: Boolean,
    default: false
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

// Indexes
customerLedgerSchema.index({ customer: 1, createdAt: -1 });
customerLedgerSchema.index({ customer: 1, transactionType: 1 });
customerLedgerSchema.index({ dueDate: 1, isOverdue: 1 });
customerLedgerSchema.index({ createdBy: 1 });
customerLedgerSchema.index({ order: 1 });

// Pre-save middleware to update overdue status
customerLedgerSchema.pre('save', function(next) {
  if (this.dueDate && this.transactionType === 'credit_sale' && !this.paidDate) {
    this.isOverdue = new Date() > this.dueDate;
  }
  next();
});

// Static methods
customerLedgerSchema.statics.getCustomerBalance = async function(customerId) {
  const result = await this.aggregate([
    { $match: { customer: new mongoose.Types.ObjectId(customerId) } },
    { $sort: { createdAt: -1 } },
    { $limit: 1 },
    { $project: { balance: 1 } }
  ]);
  
  return result.length > 0 ? result[0].balance : 0;
};

customerLedgerSchema.statics.getOverdueCustomers = async function(createdBy) {
  return this.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(createdBy),
        transactionType: 'credit_sale',
        isOverdue: true,
        balance: { $gt: 0 }
      }
    },
    {
      $lookup: {
        from: 'customers',
        localField: 'customer',
        foreignField: '_id',
        as: 'customerInfo'
      }
    },
    {
      $unwind: '$customerInfo'
    },
    {
      $group: {
        _id: '$customer',
        customerName: { $first: '$customerInfo.name' },
        customerPhone: { $first: '$customerInfo.phone' },
        totalOverdue: { $sum: '$amount' },
        oldestDueDate: { $min: '$dueDate' },
        transactionCount: { $sum: 1 }
      }
    },
    {
      $sort: { oldestDueDate: 1 }
    }
  ]);
};

module.exports = mongoose.model('CustomerLedger', customerLedgerSchema);
