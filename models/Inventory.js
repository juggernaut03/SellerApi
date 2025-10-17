const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
      index: true,
    },
    // Amazon FBA specific fields
    asin: {
      type: String,
      uppercase: true,
      trim: true,
      index: true,
    },
    fnsku: {
      type: String,
      uppercase: true,
      trim: true,
      index: true,
    },
    productId: {
      type: String,
      trim: true,
      comment: 'Amazon product ID or internal ID',
    },
    condition: {
      type: String,
      enum: ['NewItem', 'UsedLikeNew', 'UsedVeryGood', 'UsedGood', 'UsedAcceptable'],
      default: 'NewItem',
    },
    prepType: {
      type: String,
      enum: ['NONE', 'Polybagging', 'Bubble wrap', 'Taping', 'Labeling', 'Black shrink wrap'],
      default: 'NONE',
    },
    whoPrepUnits: {
      type: String,
      trim: true,
      comment: 'Who prepares units - merchant or Amazon',
    },
    whoLabelUnits: {
      type: String,
      trim: true,
      comment: 'Who labels units - merchant or Amazon',
    },
    availableQty: {
      type: Number,
      default: 0,
      min: [0, 'Available quantity cannot be negative'],
    },
    faultyQty: {
      type: Number,
      default: 0,
      min: [0, 'Faulty quantity cannot be negative'],
    },
    unitWeight: {
      type: Number,
      default: 0,
      min: [0, 'Unit weight cannot be negative'],
      comment: 'Weight in kg',
    },
    purchasePrice: {
      type: Number,
      default: 0,
      min: [0, 'Purchase price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      default: 0,
      min: [0, 'Selling price cannot be negative'],
    },
    supplier: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Low stock threshold cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastRestocked: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for total quantity
inventorySchema.virtual('totalQty').get(function () {
  return this.availableQty + this.faultyQty;
});

// Virtual for low stock status
inventorySchema.virtual('isLowStock').get(function () {
  return this.availableQty <= this.lowStockThreshold;
});

// Virtual for profit margin
inventorySchema.virtual('profitMargin').get(function () {
  if (this.purchasePrice === 0) return 0;
  return ((this.sellingPrice - this.purchasePrice) / this.purchasePrice) * 100;
});

// Index for text search
inventorySchema.index({ name: 'text', sku: 'text', barcode: 'text' });

// Method to update stock
inventorySchema.methods.updateStock = function (availableQty, faultyQty = null) {
  this.availableQty = availableQty;
  if (faultyQty !== null) {
    this.faultyQty = faultyQty;
  }
  this.lastRestocked = new Date();
  return this.save();
};

// Method to adjust stock (add/subtract)
inventorySchema.methods.adjustStock = function (qtyChange, isFaulty = false) {
  if (isFaulty) {
    this.faultyQty += qtyChange;
  } else {
    this.availableQty += qtyChange;
  }
  if (qtyChange > 0) {
    this.lastRestocked = new Date();
  }
  return this.save();
};

// Static method to find low stock items
inventorySchema.statics.findLowStock = function () {
  return this.find({ 
    isActive: true,
    $expr: { $lte: ['$availableQty', '$lowStockThreshold'] }
  });
};

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
