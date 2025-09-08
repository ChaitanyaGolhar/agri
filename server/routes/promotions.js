const express = require('express');
const { body, validationResult } = require('express-validator');
const Promotion = require('../models/Promotion');
const Product = require('../models/Product');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// @route   GET /api/promotions
// @desc    Get all promotions with filters
// @access  Private
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      isActive = '',
      type = '',
      search = ''
    } = req.query;

    const query = { createdBy: req.user._id };

    if (isActive !== '') query.isActive = isActive === 'true';
    if (type) query.type = type;
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { description: searchRegex }
      ];
    }

    const promotions = await Promotion.find(query)
      .populate('applicableProducts', 'name brand category')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Promotion.countDocuments(query);

    res.json({
      promotions,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get promotions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/promotions/:id
// @desc    Get single promotion
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const promotion = await Promotion.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    })
    .populate('applicableProducts', 'name brand category price')
    .populate('excludeProducts', 'name brand category');

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    res.json(promotion);
  } catch (error) {
    console.error('Get promotion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/promotions
// @desc    Create new promotion
// @access  Private
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
  body('code').trim().isLength({ min: 1, max: 20 }).withMessage('Code is required and must be less than 20 characters'),
  body('type').isIn(['percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y']).withMessage('Invalid promotion type'),
  body('value').isNumeric().isFloat({ min: 0 }).withMessage('Value must be a positive number'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('minOrderAmount').optional().isNumeric().isFloat({ min: 0 }),
  body('usageLimit').optional().isInt({ min: 1 }),
  body('usageLimitPerCustomer').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name, description, code, type, value, buyQuantity, getQuantity,
      minOrderAmount, minOrderQuantity, maxDiscountAmount,
      usageLimit, usageLimitPerCustomer, startDate, endDate,
      applicableProducts, applicableCategories, applicableCustomerGroups,
      excludeProducts, isActive, isPublic
    } = req.body;

    // Check if code already exists
    const existingPromotion = await Promotion.findOne({ 
      code: code.toUpperCase(),
      createdBy: req.user._id 
    });
    
    if (existingPromotion) {
      return res.status(400).json({ message: 'Promotion code already exists' });
    }

    const promotion = new Promotion({
      name,
      description,
      code: code.toUpperCase(),
      type,
      value,
      buyQuantity,
      getQuantity,
      minOrderAmount: minOrderAmount || 0,
      minOrderQuantity: minOrderQuantity || 0,
      maxDiscountAmount,
      usageLimit,
      usageLimitPerCustomer,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      applicableProducts: applicableProducts || [],
      applicableCategories: applicableCategories || [],
      applicableCustomerGroups: applicableCustomerGroups || [],
      excludeProducts: excludeProducts || [],
      isActive: isActive !== false,
      isPublic: isPublic !== false,
      createdBy: req.user._id
    });

    await promotion.save();

    res.status(201).json({
      message: 'Promotion created successfully',
      promotion
    });
  } catch (error) {
    console.error('Create promotion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/promotions/:id
// @desc    Update promotion
// @access  Private
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('code').optional().trim().isLength({ min: 1, max: 20 }),
  body('type').optional().isIn(['percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y']),
  body('value').optional().isNumeric().isFloat({ min: 0 }),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const promotion = await Promotion.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    // Check if code is being changed and if new code exists
    if (req.body.code && req.body.code.toUpperCase() !== promotion.code) {
      const existingPromotion = await Promotion.findOne({ 
        code: req.body.code.toUpperCase(),
        createdBy: req.user._id,
        _id: { $ne: promotion._id }
      });
      
      if (existingPromotion) {
        return res.status(400).json({ message: 'Promotion code already exists' });
      }
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key === 'code') {
        promotion[key] = req.body[key].toUpperCase();
      } else if (['startDate', 'endDate'].includes(key)) {
        promotion[key] = new Date(req.body[key]);
      } else {
        promotion[key] = req.body[key];
      }
    });

    await promotion.save();

    res.json({
      message: 'Promotion updated successfully',
      promotion
    });
  } catch (error) {
    console.error('Update promotion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/promotions/:id
// @desc    Delete promotion
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const promotion = await Promotion.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    await promotion.deleteOne();

    res.json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    console.error('Delete promotion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/promotions/validate
// @desc    Validate promotion code for order
// @access  Private
router.post('/validate', [
  body('code').trim().notEmpty().withMessage('Promotion code is required'),
  body('orderAmount').isNumeric().isFloat({ min: 0 }).withMessage('Valid order amount is required'),
  body('customerId').isMongoId().withMessage('Valid customer ID is required'),
  body('items').isArray({ min: 1 }).withMessage('Order items are required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, orderAmount, customerId, items } = req.body;

    const promotion = await Promotion.findOne({
      code: code.toUpperCase(),
      createdBy: req.user._id
    }).populate('applicableProducts excludeProducts');

    if (!promotion) {
      return res.status(404).json({ message: 'Invalid promotion code' });
    }

    if (!promotion.isValid()) {
      return res.status(400).json({ message: 'Promotion is not active or has expired' });
    }

    // Get customer details
    const Customer = require('../models/Customer');
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if customer can use this promotion
    const orderQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    if (!promotion.canUsePromotion(customer, orderAmount, orderQuantity)) {
      return res.status(400).json({ message: 'Promotion requirements not met' });
    }

    // Check usage limits per customer
    if (promotion.usageLimitPerCustomer) {
      const customerUsage = await Order.countDocuments({
        customer: customerId,
        'promotionApplied.code': promotion.code,
        orderStatus: { $in: ['Confirmed', 'Processing', 'Shipped', 'Delivered'] }
      });

      if (customerUsage >= promotion.usageLimitPerCustomer) {
        return res.status(400).json({ message: 'Promotion usage limit exceeded for this customer' });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    let applicableItems = items;

    // Filter applicable items based on promotion rules
    if (promotion.applicableProducts.length > 0) {
      const applicableProductIds = promotion.applicableProducts.map(p => p._id.toString());
      applicableItems = items.filter(item => 
        applicableProductIds.includes(item.product.toString())
      );
    }

    if (promotion.applicableCategories.length > 0) {
      const products = await Product.find({
        _id: { $in: items.map(item => item.product) }
      });
      
      applicableItems = items.filter(item => {
        const product = products.find(p => p._id.toString() === item.product.toString());
        return product && promotion.applicableCategories.includes(product.category);
      });
    }

    // Exclude products
    if (promotion.excludeProducts.length > 0) {
      const excludeProductIds = promotion.excludeProducts.map(p => p._id.toString());
      applicableItems = applicableItems.filter(item => 
        !excludeProductIds.includes(item.product.toString())
      );
    }

    const applicableAmount = applicableItems.reduce((sum, item) => sum + item.totalPrice, 0);

    switch (promotion.type) {
      case 'percentage':
        discountAmount = (applicableAmount * promotion.value) / 100;
        break;
      case 'fixed_amount':
        discountAmount = Math.min(promotion.value, applicableAmount);
        break;
      case 'free_shipping':
        discountAmount = 0; // Handle shipping cost separately
        break;
      case 'buy_x_get_y':
        // Calculate buy X get Y discount
        const totalQuantity = applicableItems.reduce((sum, item) => sum + item.quantity, 0);
        const freeItems = Math.floor(totalQuantity / promotion.buyQuantity) * promotion.getQuantity;
        // Assuming we give discount on cheapest items
        const sortedItems = applicableItems.sort((a, b) => a.unitPrice - b.unitPrice);
        let remainingFreeItems = freeItems;
        for (const item of sortedItems) {
          if (remainingFreeItems <= 0) break;
          const freeFromThisItem = Math.min(remainingFreeItems, item.quantity);
          discountAmount += freeFromThisItem * item.unitPrice;
          remainingFreeItems -= freeFromThisItem;
        }
        break;
    }

    // Apply maximum discount limit
    if (promotion.maxDiscountAmount && discountAmount > promotion.maxDiscountAmount) {
      discountAmount = promotion.maxDiscountAmount;
    }

    res.json({
      valid: true,
      promotion: {
        id: promotion._id,
        name: promotion.name,
        code: promotion.code,
        type: promotion.type,
        value: promotion.value
      },
      discountAmount,
      applicableAmount,
      message: `Promotion applied! You saved ₹${discountAmount.toFixed(2)}`
    });
  } catch (error) {
    console.error('Validate promotion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/promotions/analytics/:id
// @desc    Get promotion analytics
// @access  Private
router.get('/analytics/:id', async (req, res) => {
  try {
    const promotion = await Promotion.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    // Get orders that used this promotion
    const orders = await Order.find({
      'promotionApplied.code': promotion.code,
      createdBy: req.user._id,
      orderStatus: { $in: ['Confirmed', 'Processing', 'Shipped', 'Delivered'] }
    }).populate('customer', 'name customerGroup');

    // Calculate analytics
    const analytics = {
      totalUsage: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      totalDiscount: orders.reduce((sum, order) => sum + (order.promotionApplied?.discountAmount || 0), 0),
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0,
      customerBreakdown: {},
      dailyUsage: {}
    };

    // Customer group breakdown
    orders.forEach(order => {
      const group = order.customer?.customerGroup || 'unknown';
      analytics.customerBreakdown[group] = (analytics.customerBreakdown[group] || 0) + 1;
    });

    // Daily usage
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      analytics.dailyUsage[date] = (analytics.dailyUsage[date] || 0) + 1;
    });

    res.json({
      promotion,
      analytics
    });
  } catch (error) {
    console.error('Promotion analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
