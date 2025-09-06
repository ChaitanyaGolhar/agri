const express = require('express');
const { body, validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// @route   GET /api/customers
// @desc    Get all customers
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', businessType = '', isActive = true } = req.query;
    
    const query = { createdBy: req.user._id };
    
    if (isActive !== '') {
      query.isActive = isActive === 'true';
    }
    
    if (businessType) {
      query.businessType = businessType;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/customers/:id
// @desc    Get single customer with order history
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Get customer's order history
    const orders = await Order.find({
      customer: req.params.id,
      createdBy: req.user._id
    })
    .populate('items.product', 'name brand packSize')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

    res.json({
      customer,
      orders
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/customers
// @desc    Create new customer
// @access  Private
router.post('/', [
  body('name').notEmpty().withMessage('Customer name is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('businessType').optional().isIn(['Farmer', 'Retailer', 'Wholesaler', 'Cooperative', 'Other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customerData = {
      ...req.body,
      createdBy: req.user._id
    };

    const customer = new Customer(customerData);
    await customer.save();

    res.status(201).json({
      message: 'Customer created successfully',
      customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Customer with this phone or email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/customers/:id
// @desc    Update customer
// @access  Private
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Customer name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('businessType').optional().isIn(['Farmer', 'Retailer', 'Wholesaler', 'Cooperative', 'Other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({
      message: 'Customer updated successfully',
      customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/customers/:id
// @desc    Delete customer (soft delete)
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({
      message: 'Customer deactivated successfully',
      customer
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/customers/stats/overview
// @desc    Get customer statistics
// @access  Private
router.get('/stats/overview', async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments({
      createdBy: req.user._id,
      isActive: true
    });

    const newCustomersThisMonth = await Customer.countDocuments({
      createdBy: req.user._id,
      isActive: true,
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    const topCustomers = await Order.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          orderStatus: { $in: ['Confirmed', 'Delivered'] }
        }
      },
      {
        $group: {
          _id: '$customer',
          totalSpent: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: '$customer'
      },
      {
        $project: {
          customerName: '$customer.name',
          customerPhone: '$customer.phone',
          totalSpent: 1,
          orderCount: 1
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      totalCustomers,
      newCustomersThisMonth,
      topCustomers
    });
  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
