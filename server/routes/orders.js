const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
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

    const orders = await Order.find(query)
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

    const { customer, items, paymentMethod = 'Cash', deliveryAddress, notes } = req.body;
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
    const discountAmount = 0; // Can be added later
    const totalAmount = subtotal + taxAmount - discountAmount;

    console.log('Order totals - Subtotal:', subtotal, 'Tax:', taxAmount, 'Discount:', discountAmount, 'Total:', totalAmount);

    // Create order
    const orderData = {
      customer,
      items: processedItems,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      paymentMethod,
      deliveryAddress: deliveryAddress || customerExists.address,
      notes,
      createdBy: req.user._id
    };
    
    console.log('Creating order with data:', orderData);
    const order = new Order(orderData);

    console.log('Saving order...');
    await order.save();
    console.log('Order saved successfully with ID:', order._id);

    // Update product stock
    for (const item of processedItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stockQuantity: -item.quantity } }
      );
    }

    // Update customer's total purchases
    await Customer.findByIdAndUpdate(
      customer,
      { 
        $inc: { totalPurchases: totalAmount },
        $set: { lastPurchaseDate: new Date() }
      }
    );

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
