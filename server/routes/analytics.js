const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const CustomerLedger = require('../models/CustomerLedger');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard overview statistics
// @access  Private
router.get('/dashboard', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    const userId = req.user._id;

    // Sales metrics
    const salesMetrics = await Order.aggregate([
      {
        $match: {
          createdBy: userId,
          createdAt: { $gte: startDate },
          orderStatus: { $in: ['Confirmed', 'Processing', 'Shipped', 'Delivered'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    // Daily sales trend
    const dailySales = await Order.aggregate([
      {
        $match: {
          createdBy: userId,
          createdAt: { $gte: startDate },
          orderStatus: { $in: ['Confirmed', 'Processing', 'Shipped', 'Delivered'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          revenue: 1,
          orders: 1
        }
      }
    ]);

    // Top products
    const topProducts = await Order.aggregate([
      {
        $match: {
          createdBy: userId,
          createdAt: { $gte: startDate },
          orderStatus: { $in: ['Confirmed', 'Processing', 'Shipped', 'Delivered'] }
        }
      },
      { $unwind: '$items' },
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
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          brand: '$product.brand',
          category: '$product.category',
          totalQuantity: 1,
          totalRevenue: 1,
          orderCount: 1
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    // Customer metrics
    const customerMetrics = await Customer.aggregate([
      {
        $match: {
          createdBy: userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          newCustomers: { $sum: 1 },
          totalCustomers: { $sum: 1 }
        }
      }
    ]);

    // Low stock products
    const lowStockProducts = await Product.getLowStockProducts(userId)
      .select('name brand stockQuantity minimumStock reorderLevel category')
      .limit(10);

    // Recent orders
    const recentOrders = await Order.find({
      createdBy: userId
    })
    .populate('customer', 'name phone')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('orderNumber customer totalAmount orderStatus createdAt');

    res.json({
      salesMetrics: salesMetrics[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 },
      dailySales,
      topProducts,
      customerMetrics: customerMetrics[0] || { newCustomers: 0, totalCustomers: 0 },
      lowStockProducts,
      recentOrders,
      period: parseInt(period)
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/sales
// @desc    Get detailed sales analytics
// @access  Private
router.get('/sales', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      groupBy = 'day',
      category = '',
      paymentMethod = ''
    } = req.query;
    
    const userId = req.user._id;
    
    // Build match query
    const matchQuery = {
      createdBy: userId,
      orderStatus: { $in: ['Confirmed', 'Processing', 'Shipped', 'Delivered'] }
    };
    
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }
    
    if (paymentMethod) matchQuery.paymentMethod = paymentMethod;

    // Group by configuration
    let groupByConfig;
    switch (groupBy) {
      case 'hour':
        groupByConfig = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        };
        break;
      case 'week':
        groupByConfig = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'month':
        groupByConfig = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default: // day
        groupByConfig = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }

    const salesData = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupByConfig,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' },
          totalItems: { $sum: { $size: '$items' } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ]);

    // Payment method breakdown
    const paymentBreakdown = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Category performance (if products have categories)
    const categoryPerformance = await Order.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      ...(category ? [{ $match: { 'product.category': category } }] : []),
      {
        $group: {
          _id: '$product.category',
          totalRevenue: { $sum: '$items.totalPrice' },
          totalQuantity: { $sum: '$items.quantity' },
          orderCount: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          category: '$_id',
          totalRevenue: 1,
          totalQuantity: 1,
          orderCount: { $size: '$orderCount' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json({
      salesData,
      paymentBreakdown,
      categoryPerformance,
      summary: {
        totalRevenue: salesData.reduce((sum, item) => sum + item.totalRevenue, 0),
        totalOrders: salesData.reduce((sum, item) => sum + item.totalOrders, 0),
        averageOrderValue: salesData.length > 0 
          ? salesData.reduce((sum, item) => sum + item.averageOrderValue, 0) / salesData.length 
          : 0
      }
    });
  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/products
// @desc    Get product performance analytics
// @access  Private
router.get('/products', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      category = '',
      sortBy = 'revenue',
      limit = 20
    } = req.query;
    
    const userId = req.user._id;
    
    const matchQuery = {
      createdBy: userId,
      orderStatus: { $in: ['Confirmed', 'Processing', 'Shipped', 'Delivered'] }
    };
    
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const productPerformance = await Order.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      ...(category ? [{ $match: { 'product.category': category } }] : []),
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$product.name' },
          brand: { $first: '$product.brand' },
          category: { $first: '$product.category' },
          currentStock: { $first: '$product.stockQuantity' },
          minimumStock: { $first: '$product.minimumStock' },
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          averagePrice: { $avg: '$items.unitPrice' },
          orderCount: { $sum: 1 },
          lastSoldDate: { $max: '$createdAt' }
        }
      },
      {
        $addFields: {
          profitMargin: {
            $cond: {
              if: { $gt: ['$averagePrice', 0] },
              then: {
                $multiply: [
                  { $divide: [
                    { $subtract: ['$averagePrice', '$product.costPrice'] },
                    '$averagePrice'
                  ]},
                  100
                ]
              },
              else: 0
            }
          },
          isLowStock: { $lte: ['$currentStock', '$minimumStock'] }
        }
      },
      {
        $sort: {
          [sortBy === 'quantity' ? 'totalQuantitySold' : 
           sortBy === 'orders' ? 'orderCount' : 'totalRevenue']: -1
        }
      },
      { $limit: parseInt(limit) }
    ]);

    // Slow moving products
    const slowMovingProducts = await Product.find({
      createdBy: userId,
      isActive: true,
      lastSoldDate: { 
        $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      }
    })
    .select('name brand category stockQuantity lastSoldDate')
    .sort({ lastSoldDate: 1 })
    .limit(10);

    res.json({
      productPerformance,
      slowMovingProducts,
      summary: {
        totalProducts: productPerformance.length,
        totalRevenue: productPerformance.reduce((sum, p) => sum + p.totalRevenue, 0),
        totalQuantitySold: productPerformance.reduce((sum, p) => sum + p.totalQuantitySold, 0)
      }
    });
  } catch (error) {
    console.error('Product analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/customers
// @desc    Get customer analytics
// @access  Private
router.get('/customers', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      customerGroup = '',
      sortBy = 'revenue',
      limit = 20
    } = req.query;
    
    const userId = req.user._id;
    
    const matchQuery = {
      createdBy: userId,
      orderStatus: { $in: ['Confirmed', 'Processing', 'Shipped', 'Delivered'] }
    };
    
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    // Top customers analysis
    const topCustomers = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$customer',
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' },
          lastOrderDate: { $max: '$createdAt' },
          firstOrderDate: { $min: '$createdAt' }
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
      { $unwind: '$customer' },
      ...(customerGroup ? [{ $match: { 'customer.customerGroup': customerGroup } }] : []),
      {
        $project: {
          name: '$customer.name',
          phone: '$customer.phone',
          customerGroup: '$customer.customerGroup',
          businessType: '$customer.businessType',
          totalRevenue: 1,
          orderCount: 1,
          averageOrderValue: 1,
          lastOrderDate: 1,
          firstOrderDate: 1,
          daysSinceLastOrder: {
            $divide: [
              { $subtract: [new Date(), '$lastOrderDate'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $sort: {
          [sortBy === 'orders' ? 'orderCount' : 
           sortBy === 'frequency' ? 'daysSinceLastOrder' : 'totalRevenue']: 
           sortBy === 'frequency' ? 1 : -1
        }
      },
      { $limit: parseInt(limit) }
    ]);

    // Customer segmentation
    const customerSegmentation = await Customer.aggregate([
      { $match: { createdBy: userId, isActive: true } },
      {
        $group: {
          _id: '$customerGroup',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalPurchases' },
          averageRevenue: { $avg: '$totalPurchases' }
        }
      }
    ]);

    // New vs returning customers
    const customerRetention = await Order.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      {
        $group: {
          _id: '$customer._id',
          orderCount: { $sum: 1 },
          firstOrderDate: { $min: '$createdAt' }
        }
      },
      {
        $group: {
          _id: null,
          newCustomers: {
            $sum: { $cond: [{ $eq: ['$orderCount', 1] }, 1, 0] }
          },
          returningCustomers: {
            $sum: { $cond: [{ $gt: ['$orderCount', 1] }, 1, 0] }
          },
          totalCustomers: { $sum: 1 }
        }
      }
    ]);

    res.json({
      topCustomers,
      customerSegmentation,
      customerRetention: customerRetention[0] || { 
        newCustomers: 0, 
        returningCustomers: 0, 
        totalCustomers: 0 
      },
      summary: {
        totalCustomers: topCustomers.length,
        totalRevenue: topCustomers.reduce((sum, c) => sum + c.totalRevenue, 0),
        averageOrderValue: topCustomers.length > 0 
          ? topCustomers.reduce((sum, c) => sum + c.averageOrderValue, 0) / topCustomers.length 
          : 0
      }
    });
  } catch (error) {
    console.error('Customer analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/inventory
// @desc    Get inventory analytics
// @access  Private
router.get('/inventory', async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Low stock alerts
    const lowStockProducts = await Product.getLowStockProducts(userId)
      .select('name brand category stockQuantity reorderLevel minimumStock');

    // Overstock identification
    const overstockProducts = await Product.getOverstockProducts(userId)
      .select('name brand category stockQuantity maxStockLevel');

    // Stock turnover analysis
    const stockTurnover = await Product.aggregate([
      {
        $match: {
          createdBy: userId,
          isActive: true,
          totalSold: { $gt: 0 }
        }
      },
      {
        $addFields: {
          turnoverRate: {
            $cond: {
              if: { $gt: ['$stockQuantity', 0] },
              then: { $divide: ['$totalSold', '$stockQuantity'] },
              else: 0
            }
          }
        }
      },
      {
        $project: {
          name: 1,
          brand: 1,
          category: 1,
          stockQuantity: 1,
          totalSold: 1,
          turnoverRate: 1,
          lastSoldDate: 1
        }
      },
      { $sort: { turnoverRate: -1 } },
      { $limit: 20 }
    ]);

    // Category-wise stock summary
    const categoryStock = await Product.aggregate([
      {
        $match: {
          createdBy: userId,
          isActive: true
        }
      },
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          totalStockValue: { 
            $sum: { $multiply: ['$stockQuantity', '$price'] }
          },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ['$stockQuantity', '$minimumStock'] }, 1, 0]
            }
          },
          totalQuantity: { $sum: '$stockQuantity' }
        }
      },
      { $sort: { totalStockValue: -1 } }
    ]);

    res.json({
      lowStockProducts,
      overstockProducts,
      stockTurnover,
      categoryStock,
      summary: {
        totalLowStock: lowStockProducts.length,
        totalOverstock: overstockProducts.length,
        totalStockValue: categoryStock.reduce((sum, cat) => sum + cat.totalStockValue, 0)
      }
    });
  } catch (error) {
    console.error('Inventory analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
