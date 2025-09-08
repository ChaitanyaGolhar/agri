const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const CustomerLedger = require('../models/CustomerLedger');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// @route   GET /api/orders
// @desc    Get all orders with filters
// @access  Private
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = '',
      paymentStatus = '',
      customer = '',
      search = '',
      startDate = '',
      endDate = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { createdBy: req.user._id };

    if (status) query.orderStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (customer) query.customer = customer;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    let orders;
    
    // Handle search functionality with customer name lookup
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      
      // First, find customers that match the search term
      const matchingCustomers = await Customer.find({
        createdBy: req.user._id,
        $or: [
          { name: searchRegex },
          { phone: searchRegex },
          { email: searchRegex }
        ]
      }).select('_id');
      
      const customerIds = matchingCustomers.map(c => c._id);
      
      // Build search query
      const searchQuery = {
        ...query,
        $or: [
          { orderNumber: searchRegex },
          { invoiceNumber: searchRegex },
          ...(customerIds.length > 0 ? [{ customer: { $in: customerIds } }] : [])
        ]
      };
      
      orders = await Order.find(searchQuery)
        .populate('customer', 'name phone email')
        .populate('items.product', 'name brand packSize')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();
        
      // Get total count for search results
      const total = await Order.countDocuments(searchQuery);
      
      res.json({
        orders,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      });
      return;
    }

    orders = await Order.find(query)
      .populate('customer', 'name phone email')
      .populate('items.product', 'name brand packSize')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    })
    .populate('customer', 'name phone email address businessType')
    .populate('items.product', 'name brand packSize category images');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', [
  body('customer').isMongoId().withMessage('Valid customer ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').isMongoId().withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('paymentMethod').optional().isIn(['Cash', 'UPI', 'Card', 'Cheque', 'Credit']),
  body('deliveryAddress').optional().isObject()
], async (req, res) => {
  try {
    console.log('Order creation request received:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      customer, 
      items, 
      paymentMethod = 'Cash', 
      paymentStatus = 'Paid',
      paidAmount,
      remainingAmount,
      appliedPromotions = [],
      promotionDiscountAmount = 0,
      creditTerms,
      deliveryAddress, 
      notes 
    } = req.body;
    console.log('Processing order for customer:', customer, 'with items:', items);

    // Verify customer exists
    console.log('Looking for customer with ID:', customer, 'and createdBy:', req.user._id);
    const customerExists = await Customer.findOne({
      _id: customer,
      createdBy: req.user._id,
      isActive: true
    });

    if (!customerExists) {
      console.log('Customer not found or inactive');
      return res.status(400).json({ message: 'Customer not found or inactive' });
    }
    console.log('Customer found:', customerExists.name);

    // Process items and calculate totals
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      console.log('Processing item:', item);
      const product = await Product.findOne({
        _id: item.product,
        createdBy: req.user._id,
        isActive: true
      });

      if (!product) {
        console.log('Product not found:', item.product);
        return res.status(400).json({ message: `Product ${item.product} not found` });
      }

      console.log('Product found:', product.name, 'Stock:', product.stockQuantity, 'Required:', item.quantity);

      if (product.stockQuantity < item.quantity) {
        console.log('Insufficient stock for product:', product.name);
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}` 
        });
      }

      const totalPrice = product.price * item.quantity;
      subtotal += totalPrice;
      console.log('Item total price:', totalPrice, 'Running subtotal:', subtotal);

      processedItems.push({
        product: product._id,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice
      });
    }

    const taxAmount = 0; // Can be calculated based on GST rules
    const totalAmount = subtotal + taxAmount - promotionDiscountAmount;

    console.log('Order totals - Subtotal:', subtotal, 'Tax:', taxAmount, 'Promotion Discount:', promotionDiscountAmount, 'Total:', totalAmount);

    // Create order
    const orderData = {
      customer,
      items: processedItems,
      subtotal,
      taxAmount,
      promotionDiscountAmount,
      totalAmount,
      paymentMethod,
      paymentStatus,
      paidAmount: paidAmount !== undefined ? paidAmount : (paymentStatus === 'Paid' ? totalAmount : 0),
      remainingAmount: remainingAmount !== undefined ? remainingAmount : (paymentStatus === 'Paid' ? 0 : totalAmount),
      appliedPromotions,
      ...(creditTerms && { creditTerms }),
      deliveryAddress: deliveryAddress || customerExists.address,
      notes,
      createdBy: req.user._id
    };
    
    console.log('Creating order with data:', orderData);
    const order = new Order(orderData);

    console.log('Saving order...');
    await order.save();
    console.log('Order saved successfully with ID:', order._id);

    // Update product stock and analytics
    for (const item of processedItems) {
      const product = await Product.findById(item.product);
      if (product) {
        // Update stock
        product.stockQuantity -= item.quantity;
        // Update sales analytics
        await product.updateSalesAnalytics(item.quantity, item.unitPrice);
      }
    }

    // Update customer's total purchases
    await Customer.findByIdAndUpdate(
      customer,
      { 
        $inc: { totalPurchases: totalAmount },
        $set: { lastPurchaseDate: new Date() }
      }
    );

    // Create ledger entry for credit sales
    if (paymentMethod === 'Credit' || order.isCreditSale) {
      const currentBalance = await CustomerLedger.getCustomerBalance(customer);
      const newBalance = currentBalance + (order.remainingAmount || totalAmount);
      
      // Calculate due date
      let dueDate = null;
      if (creditTerms && creditTerms.paymentTerms) {
        const daysMap = {
          'immediate': 0,
          '7_days': 7,
          '15_days': 15,
          '30_days': 30,
          '45_days': 45,
          '60_days': 60,
          '90_days': 90
        };
        const days = daysMap[creditTerms.paymentTerms] || 30;
        dueDate = new Date(Date.now() + (days * 24 * 60 * 60 * 1000));
      } else if (customerExists.paymentTerms > 0) {
        dueDate = new Date(Date.now() + (customerExists.paymentTerms * 24 * 60 * 60 * 1000));
      }

      // Create ledger entry
      const ledgerEntry = new CustomerLedger({
        customer,
        order: order._id,
        transactionType: 'credit_sale',
        amount: order.remainingAmount || totalAmount,
        balance: newBalance,
        description: `Credit sale - Order #${order.orderNumber}`,
        dueDate,
        createdBy: req.user._id
      });

      await ledgerEntry.save();

      // Update customer balance
      await Customer.findByIdAndUpdate(customer, {
        currentBalance: newBalance
      });
    }

    // Populate the order for response
    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name phone email')
      .populate('items.product', 'name brand packSize');

    res.status(201).json({
      message: 'Order created successfully',
      order: populatedOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.put('/:id/status', [
  body('orderStatus').isIn(['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'])
    .withMessage('Invalid order status'),
  body('paymentStatus').optional().isIn(['Pending', 'Paid', 'Partially Paid', 'Failed', 'Refunded'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderStatus, paymentStatus } = req.body;
    const updateData = { orderStatus };
    
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      updateData,
      { new: true }
    )
    .populate('customer', 'name phone email')
    .populate('items.product', 'name brand packSize');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/payment
// @desc    Update order payment status and amounts
// @access  Private
router.put('/:id/payment', [
  body('paidAmount').isFloat({ min: 0 }).withMessage('Paid amount must be a positive number'),
  body('paymentMethod').optional().isIn(['Cash', 'UPI', 'Card', 'Cheque', 'Bank Transfer'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paidAmount, paymentMethod, notes } = req.body;
    
    const order = await Order.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update payment amounts
    order.paidAmount = paidAmount;
    order.remainingAmount = Math.max(0, order.totalAmount - paidAmount);
    
    // Update payment status based on amounts
    if (paidAmount >= order.totalAmount) {
      order.paymentStatus = 'Paid';
      order.remainingAmount = 0;
    } else if (paidAmount > 0) {
      order.paymentStatus = 'Partially Paid';
    } else {
      order.paymentStatus = 'Pending';
    }

    await order.save();

    // If this is a credit sale, update customer ledger
    if (order.isCreditSale && paidAmount > (order.paidAmount || 0)) {
      const paymentAmount = paidAmount - (order.paidAmount || 0);
      
      // Get current customer balance
      const currentBalance = await CustomerLedger.getCustomerBalance(order.customer);
      const newBalance = Math.max(0, currentBalance - paymentAmount);

      // Create payment ledger entry
      const ledgerEntry = new CustomerLedger({
        customer: order.customer,
        order: order._id,
        transactionType: 'payment',
        amount: -paymentAmount,
        balance: newBalance,
        description: `Payment for Order #${order.orderNumber}`,
        paymentMethod: paymentMethod || 'Cash',
        paidDate: new Date(),
        notes,
        createdBy: req.user._id
      });

      await ledgerEntry.save();

      // Update customer balance
      await Customer.findByIdAndUpdate(order.customer, {
        currentBalance: newBalance
      });
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name phone email')
      .populate('items.product', 'name brand packSize');

    res.json({
      message: 'Payment updated successfully',
      order: populatedOrder
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Cancel order and restore stock
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
      orderStatus: { $in: ['Pending', 'Confirmed'] }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or cannot be cancelled' });
    }

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stockQuantity: item.quantity } }
      );
    }

    // Update order status to cancelled
    order.orderStatus = 'Cancelled';
    await order.save();

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/stats/overview
// @desc    Get order statistics
// @access  Private
router.get('/stats/overview', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const totalOrders = await Order.countDocuments({
      createdBy: req.user._id,
      createdAt: { $gte: startDate }
    });

    const totalRevenue = await Order.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          createdAt: { $gte: startDate },
          orderStatus: { $in: ['Confirmed', 'Delivered'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    const ordersByStatus = await Order.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const dailySales = await Order.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          createdAt: { $gte: startDate },
          orderStatus: { $in: ['Confirmed', 'Delivered'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.json({
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      ordersByStatus,
      dailySales
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
