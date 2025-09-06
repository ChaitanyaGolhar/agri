const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Seeds', 'Fertilizers', 'Pesticides', 'Tools', 'Equipment', 'Irrigation', 'Other']
  },
  subcategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  packSize: {
    value: { type: Number, required: true },
    unit: { 
      type: String, 
      required: true,
      enum: ['kg', 'g', 'L', 'ml', 'pieces', 'packets', 'bags', 'bottles']
    }
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  minimumStock: {
    type: Number,
    default: 10
  },
  cropTypes: [{
    type: String,
    enum: ['Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Vegetables', 'Fruits', 'Spices', 'All Crops']
  }],
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  specifications: {
    composition: String,
    dosage: String,
    applicationMethod: String,
    shelfLife: String,
    storageConditions: String
  },
  batchNumber: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date
  },
  supplier: {
    name: String,
    contact: String,
    address: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better search performance
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ createdBy: 1, isActive: 1 });
productSchema.index({ stockQuantity: 1 });

// Virtual for low stock status
productSchema.virtual('isLowStock').get(function() {
  return this.stockQuantity <= this.minimumStock;
});

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
  return `₹${this.price.toFixed(2)}`;
});

module.exports = mongoose.model('Product', productSchema);
