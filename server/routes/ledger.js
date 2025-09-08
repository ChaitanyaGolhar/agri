const express = require('express');
const { body, validationResult } = require('express-validator');
const CustomerLedger = require('../models/CustomerLedger');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// @route   GET /api/ledger/customer/:customerId
// @desc    Get customer ledger entries
// @access  Private
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const customerId = req.params.customerId;

    // Verify customer belongs to user
    const customer = await Customer.findOne({
      _id: customerId,
      createdBy: req.user._id
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const ledgerEntries = await CustomerLedger.find({
      customer: customerId,
      createdBy: req.user._id
    })
    .populate('order', 'orderNumber totalAmount orderStatus')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await CustomerLedger.countDocuments({
      customer: customerId,
      createdBy: req.user._id
    });

    // Get current balance
    const currentBalance = await CustomerLedger.getCustomerBalance(customerId);

    res.json({
      customer: {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        creditLimit: customer.creditLimit,
        currentBalance
      },
      ledgerEntries,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get customer ledger error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/ledger/payment
// @desc    Record payment against customer account and update order statuses
// @access  Private
router.post('/payment', [
  body('customer').isMongoId().withMessage('Valid customer ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('paymentMethod').isIn(['Cash', 'UPI', 'Card', 'Cheque', 'Bank Transfer']).withMessage('Invalid payment method'),
  body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Description is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer, amount, paymentMethod, paymentReference, description, notes, orderId } = req.body;

    // Verify customer
    const customerDoc = await Customer.findOne({
      _id: customer,
      createdBy: req.user._id
    });

    if (!customerDoc) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Get current balance
    const currentBalance = await CustomerLedger.getCustomerBalance(customer);
    const newBalance = Math.max(0, currentBalance - amount);

    // Create ledger entry
    const ledgerEntry = new CustomerLedger({
      customer,
      order: orderId || null,
      transactionType: 'payment',
      amount: -amount, // Negative for payments
      balance: newBalance,
      description,
      paymentMethod,
      paymentReference,
      paidDate: new Date(),
      notes,
      createdBy: req.user._id
    });

    await ledgerEntry.save();

    // Update customer balance
    await Customer.findByIdAndUpdate(customer, {
      currentBalance: newBalance
    });

    // Update order payment status if specific order payment
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        customer: customer,
        createdBy: req.user._id
      });

      if (order) {
        const newPaidAmount = (order.paidAmount || 0) + amount;
        const newRemainingAmount = Math.max(0, order.totalAmount - newPaidAmount);
        
        // Update payment status based on amounts
        let paymentStatus = 'Pending';
        if (newPaidAmount >= order.totalAmount) {
          paymentStatus = 'Paid';
        } else if (newPaidAmount > 0) {
          paymentStatus = 'Partially Paid';
        }

        await Order.findByIdAndUpdate(orderId, {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          paymentStatus: paymentStatus
        });
      }
    } else {
      // Update all pending orders for this customer (FIFO basis)
      const pendingOrders = await Order.find({
        customer: customer,
        createdBy: req.user._id,
        paymentStatus: { $in: ['Pending', 'Partially Paid'] },
        remainingAmount: { $gt: 0 }
      }).sort({ createdAt: 1 }); // Oldest first

      let remainingPayment = amount;
      
      for (const order of pendingOrders) {
        if (remainingPayment <= 0) break;
        
        const orderRemaining = order.remainingAmount || order.totalAmount;
        const paymentForThisOrder = Math.min(remainingPayment, orderRemaining);
        
        const newPaidAmount = (order.paidAmount || 0) + paymentForThisOrder;
        const newRemainingAmount = Math.max(0, order.totalAmount - newPaidAmount);
        
        let paymentStatus = 'Pending';
        if (newPaidAmount >= order.totalAmount) {
          paymentStatus = 'Paid';
        } else if (newPaidAmount > 0) {
          paymentStatus = 'Partially Paid';
        }

        await Order.findByIdAndUpdate(order._id, {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          paymentStatus: paymentStatus
        });

        remainingPayment -= paymentForThisOrder;
      }
    }

    res.status(201).json({
      message: 'Payment recorded successfully',
      ledgerEntry,
      newBalance,
      customerBalance: newBalance
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/ledger/credit-sale
// @desc    Record credit sale
// @access  Private
router.post('/credit-sale', [
  body('customer').isMongoId().withMessage('Valid customer ID is required'),
  body('order').isMongoId().withMessage('Valid order ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('dueDate').optional().isISO8601().withMessage('Valid due date required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer, order, amount, dueDate, notes } = req.body;

    // Verify customer and order
    const customerDoc = await Customer.findOne({
      _id: customer,
      createdBy: req.user._id
    });

    const orderDoc = await Order.findOne({
      _id: order,
      createdBy: req.user._id,
      customer: customer
    });

    if (!customerDoc) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (!orderDoc) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check credit limit
    const currentBalance = await CustomerLedger.getCustomerBalance(customer);
    const newBalance = currentBalance + amount;

    if (customerDoc.creditLimit > 0 && newBalance > customerDoc.creditLimit) {
      return res.status(400).json({ 
        message: `Credit limit exceeded. Current balance: ₹${currentBalance}, Credit limit: ₹${customerDoc.creditLimit}` 
      });
    }

    // Calculate due date if not provided
    let calculatedDueDate = dueDate ? new Date(dueDate) : null;
    if (!calculatedDueDate && customerDoc.paymentTerms > 0) {
      calculatedDueDate = new Date();
      calculatedDueDate.setDate(calculatedDueDate.getDate() + customerDoc.paymentTerms);
    }

    // Create ledger entry
    const ledgerEntry = new CustomerLedger({
      customer,
      order,
      transactionType: 'credit_sale',
      amount,
      balance: newBalance,
      description: `Credit sale - Order #${orderDoc.orderNumber}`,
      dueDate: calculatedDueDate,
      notes,
      createdBy: req.user._id
    });

    await ledgerEntry.save();

    // Update customer balance and order
    await Customer.findByIdAndUpdate(customer, {
      currentBalance: newBalance
    });

    await Order.findByIdAndUpdate(order, {
      paymentStatus: 'Pending',
      creditSale: {
        isCredit: true,
        dueDate: calculatedDueDate,
        ledgerEntry: ledgerEntry._id
      }
    });

    res.status(201).json({
      message: 'Credit sale recorded successfully',
      ledgerEntry,
      newBalance
    });
  } catch (error) {
    console.error('Record credit sale error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/ledger/overdue
// @desc    Get overdue customers
// @access  Private
router.get('/overdue', async (req, res) => {
  try {
    const overdueCustomers = await CustomerLedger.getOverdueCustomers(req.user._id);

    res.json({
      overdueCustomers,
      totalOverdue: overdueCustomers.reduce((sum, customer) => sum + customer.totalOverdue, 0),
      count: overdueCustomers.length
    });
  } catch (error) {
    console.error('Get overdue customers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/ledger/summary
// @desc    Get ledger summary
// @access  Private
router.get('/summary', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Total receivables
    const totalReceivables = await CustomerLedger.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          transactionType: 'credit_sale',
          balance: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$customer',
          balance: { $last: '$balance' }
        }
      },
      {
        $group: {
          _id: null,
          totalReceivables: { $sum: '$balance' }
        }
      }
    ]);

    // Payments received in period
    const paymentsReceived = await CustomerLedger.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          transactionType: 'payment',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: { $abs: '$amount' } },
          paymentCount: { $sum: 1 }
        }
      }
    ]);

    // Credit sales in period
    const creditSales = await CustomerLedger.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          transactionType: 'credit_sale',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalCreditSales: { $sum: '$amount' },
          creditSaleCount: { $sum: 1 }
        }
      }
    ]);

    // Overdue amount
    const overdueAmount = await CustomerLedger.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          transactionType: 'credit_sale',
          isOverdue: true,
          balance: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalOverdue: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      totalReceivables: totalReceivables[0]?.totalReceivables || 0,
      paymentsReceived: paymentsReceived[0] || { totalPayments: 0, paymentCount: 0 },
      creditSales: creditSales[0] || { totalCreditSales: 0, creditSaleCount: 0 },
      totalOverdue: overdueAmount[0]?.totalOverdue || 0,
      period: parseInt(period)
    });
  } catch (error) {
    console.error('Get ledger summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/ledger/:id/adjustment
// @desc    Make adjustment to ledger entry
// @access  Private
router.put('/:id/adjustment', [
  body('amount').isFloat().withMessage('Valid amount is required'),
  body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Description is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, description, notes } = req.body;

    const originalEntry = await CustomerLedger.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!originalEntry) {
      return res.status(404).json({ message: 'Ledger entry not found' });
    }

    // Get current balance
    const currentBalance = await CustomerLedger.getCustomerBalance(originalEntry.customer);
    const newBalance = currentBalance + amount;

    // Create adjustment entry
    const adjustmentEntry = new CustomerLedger({
      customer: originalEntry.customer,
      transactionType: 'adjustment',
      amount,
      balance: newBalance,
      description,
      notes,
      createdBy: req.user._id
    });

    await adjustmentEntry.save();

    // Update customer balance
    await Customer.findByIdAndUpdate(originalEntry.customer, {
      currentBalance: newBalance
    });

    res.json({
      message: 'Adjustment recorded successfully',
      adjustmentEntry,
      newBalance
    });
  } catch (error) {
    console.error('Record adjustment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
