const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// @route   GET /api/dashboard/overview
// @desc    Get dashboard overview statistics
// @access  Private
router.get('/overview', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Total customers
    const totalCustomers = await Customer.countDocuments({
      createdBy: req.user._id,
      isActive: true
    });

    // New customers this period
    const newCustomers = await Customer.countDocuments({
      createdBy: req.user._id,
      isActive: true,
      createdAt: { $gte: startDate }
    });

    // Total products
    const totalProducts = await Product.countDocuments({
      createdBy: req.user._id,
      isActive: true
    });

    // Low stock products
    const lowStockProducts = await Product.countDocuments({
      createdBy: req.user._id,
      isActive: true,
      $expr: { $lte: ['$stockQuantity', '$minimumStock'] }
    });

    // Out of stock products
    const outOfStockProducts = await Product.countDocuments({
      createdBy: req.user._id,
      isActive: true,
      stockQuantity: 0
    });

    // Total orders this period
    const totalOrders = await Order.countDocuments({
      createdBy: req.user._id,
      createdAt: { $gte: startDate }
    });

    // Pending orders
    const pendingOrders = await Order.countDocuments({
      createdBy: req.user._id,
      orderStatus: { $in: ['Pending', 'Confirmed', 'Processing'] }
    });

    // Total revenue this period
    const revenueData = await Order.aggregate([
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
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;
    const averageOrderValue = revenueData[0]?.averageOrderValue || 0;

    res.json({
      customers: {
        total: totalCustomers,
        new: newCustomers
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders
      },
      revenue: {
        total: totalRevenue,
        average: averageOrderValue
      }
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/sales-chart
// @desc    Get sales data for charts
// @access  Private
router.get('/sales-chart', async (req, res) => {
  try {
    const { period = '30', groupBy = 'day' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    let groupFormat;
    switch (groupBy) {
      case 'day':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'week':
        groupFormat = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'month':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default:
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          createdAt: { $gte: startDate },
          orderStatus: { $in: ['Confirmed', 'Delivered'] }
        }
      },
      {
        $group: {
          _id: groupFormat,
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.json(salesData);
  } catch (error) {
    console.error('Sales chart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/top-products
// @desc    Get top selling products
// @access  Private
router.get('/top-products', async (req, res) => {
  try {
    const { period = '30', limit = 10 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const topProducts = await Order.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          createdAt: { $gte: startDate },
          orderStatus: { $in: ['Confirmed', 'Delivered'] }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          productName: '$product.name',
          productBrand: '$product.brand',
          productCategory: '$product.category',
          totalQuantity: 1,
          totalRevenue: 1,
          orderCount: 1
        }
      },
      {
        $sort: { totalQuantity: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    res.json(topProducts);
  } catch (error) {
    console.error('Top products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/top-customers
// @desc    Get top customers by revenue
// @access  Private
router.get('/top-customers', async (req, res) => {
  try {
    const { period = '30', limit = 10 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const topCustomers = await Order.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          createdAt: { $gte: startDate },
          orderStatus: { $in: ['Confirmed', 'Delivered'] }
        }
      },
      {
        $group: {
          _id: '$customer',
          totalSpent: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
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
          customerEmail: '$customer.email',
          customerBusinessType: '$customer.businessType',
          totalSpent: 1,
          orderCount: 1,
          averageOrderValue: 1
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    res.json(topCustomers);
  } catch (error) {
    console.error('Top customers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/category-performance
// @desc    Get performance by product category
// @access  Private
router.get('/category-performance', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const categoryPerformance = await Order.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          createdAt: { $gte: startDate },
          orderStatus: { $in: ['Confirmed', 'Delivered'] }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $group: {
          _id: '$product.category',
          totalRevenue: { $sum: '$items.totalPrice' },
          totalQuantity: { $sum: '$items.quantity' },
          orderCount: { $sum: 1 },
          averagePrice: { $avg: '$items.unitPrice' }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    res.json(categoryPerformance);
  } catch (error) {
    console.error('Category performance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/recent-orders
// @desc    Get recent orders
// @access  Private
router.get('/recent-orders', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recentOrders = await Order.find({
      createdBy: req.user._id
    })
    .populate('customer', 'name phone')
    .populate('items.product', 'name brand')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

    res.json(recentOrders);
  } catch (error) {
    console.error('Recent orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/low-stock-alerts
// @desc    Get low stock alerts
// @access  Private
router.get('/low-stock-alerts', async (req, res) => {
  try {
    const lowStockProducts = await Product.find({
      createdBy: req.user._id,
      isActive: true,
      $expr: { $lte: ['$stockQuantity', '$minimumStock'] }
    })
    .select('name brand category stockQuantity minimumStock price packSize')
    .sort({ stockQuantity: 1 })
    .lean();

    res.json(lowStockProducts);
  } catch (error) {
    console.error('Low stock alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
