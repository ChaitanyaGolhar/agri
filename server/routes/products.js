const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// @route   GET /api/products
// @desc    Get all products with search and filter
// @access  Private
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      category = '',
      cropType = '',
      brand = '',
      minPrice = '',
      maxPrice = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      lowStock = false
    } = req.query;

    const query = { createdBy: req.user._id, isActive: true };

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by crop type
    if (cropType) {
      query.cropTypes = { $in: [cropType] };
    }

    // Filter by brand
    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Low stock filter
    if (lowStock === 'true') {
      const products = await Product.find({ createdBy: req.user._id, isActive: true });
      const lowStockProducts = products.filter(p => p.stockQuantity <= p.minimumStock);
      const lowStockIds = lowStockProducts.map(p => p._id);
      query._id = { $in: lowStockIds };
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Product.countDocuments(query);

    // Add virtual fields
    const productsWithVirtuals = products.map(product => ({
      ...product,
      isLowStock: product.stockQuantity <= product.minimumStock,
      formattedPrice: `₹${product.price.toFixed(2)}`
    }));

    res.json({
      products: productsWithVirtuals,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      ...product.toObject(),
      isLowStock: product.stockQuantity <= product.minimumStock,
      formattedPrice: `₹${product.price.toFixed(2)}`
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private
router.post('/', [
  body('name').notEmpty().withMessage('Product name is required'),
  body('category').isIn(['Seeds', 'Fertilizers', 'Pesticides', 'Tools', 'Equipment', 'Irrigation', 'Other'])
    .withMessage('Invalid category'),
  body('brand').notEmpty().withMessage('Brand is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('packSize.value').isNumeric().withMessage('Pack size value must be a number'),
  body('packSize.unit').isIn(['kg', 'g', 'L', 'ml', 'pieces', 'packets', 'bags', 'bottles'])
    .withMessage('Invalid pack size unit'),
  body('stockQuantity').isNumeric().withMessage('Stock quantity must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const productData = {
      ...req.body,
      createdBy: req.user._id
    };

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
  body('category').optional().isIn(['Seeds', 'Fertilizers', 'Pesticides', 'Tools', 'Equipment', 'Irrigation', 'Other']),
  body('price').optional().isNumeric().withMessage('Price must be a number'),
  body('stockQuantity').optional().isNumeric().withMessage('Stock quantity must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (soft delete)
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      message: 'Product deactivated successfully',
      product
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/products/:id/stock
// @desc    Update product stock
// @access  Private
router.put('/:id/stock', [
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('operation').isIn(['add', 'subtract', 'set']).withMessage('Operation must be add, subtract, or set')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { quantity, operation, reason } = req.body;
    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let newQuantity = product.stockQuantity;
    switch (operation) {
      case 'add':
        newQuantity += quantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, newQuantity - quantity);
        break;
      case 'set':
        newQuantity = Math.max(0, quantity);
        break;
    }

    product.stockQuantity = newQuantity;
    await product.save();

    res.json({
      message: 'Stock updated successfully',
      product: {
        ...product.toObject(),
        isLowStock: product.stockQuantity <= product.minimumStock
      }
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/categories/list
// @desc    Get product categories and subcategories
// @access  Private
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Product.distinct('category', {
      createdBy: req.user._id,
      isActive: true
    });

    const subcategories = await Product.distinct('subcategory', {
      createdBy: req.user._id,
      isActive: true,
      subcategory: { $ne: null, $ne: '' }
    });

    const brands = await Product.distinct('brand', {
      createdBy: req.user._id,
      isActive: true
    });

    const cropTypes = await Product.distinct('cropTypes', {
      createdBy: req.user._id,
      isActive: true
    });

    res.json({
      categories,
      subcategories,
      brands,
      cropTypes: cropTypes.flat()
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/stats/overview
// @desc    Get product statistics
// @access  Private
router.get('/stats/overview', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({
      createdBy: req.user._id,
      isActive: true
    });

    const lowStockProducts = await Product.countDocuments({
      createdBy: req.user._id,
      isActive: true,
      $expr: { $lte: ['$stockQuantity', '$minimumStock'] }
    });

    const outOfStockProducts = await Product.countDocuments({
      createdBy: req.user._id,
      isActive: true,
      stockQuantity: 0
    });

    const categoryStats = await Product.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          isActive: true
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$stockQuantity'] } }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      categoryStats
    });
  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
