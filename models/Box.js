const mongoose = require('mongoose');

/**
 * Box model - Optional standalone box tracking
 * Note: Boxes are also embedded in Shipment model
 * This model is for advanced box-level tracking if needed
 */

const boxItemSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    uppercase: true,
  },
  productName: {
    type: String,
    required: true,
  },
  qty: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  unitWeight: {
    type: Number,
    default: 0,
  },
});

const boxSchema = new mongoose.Schema(
  {
    boxNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
    },
    items: [boxItemSchema],
    weight: {
      type: Number,
      default: 0,
      min: [0, 'Weight cannot be negative'],
    },
    dimensions: {
      length: {
        type: Number,
        min: 0,
      },
      width: {
        type: Number,
        min: 0,
      },
      height: {
        type: Number,
        min: 0,
      },
      unit: {
        type: String,
        enum: ['cm', 'inch'],
        default: 'cm',
      },
    },
    barcode: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['packed', 'sealed', 'shipped', 'delivered'],
      default: 'packed',
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Calculate total weight from items
boxSchema.pre('save', function (next) {
  if (this.weight === 0 && this.items.length > 0) {
    this.weight = this.items.reduce((total, item) => {
      return total + (item.qty * item.unitWeight);
    }, 0);
  }
  next();
});

// Virtual for box volume
boxSchema.virtual('volume').get(function () {
  if (this.dimensions && this.dimensions.length && this.dimensions.width && this.dimensions.height) {
    return this.dimensions.length * this.dimensions.width * this.dimensions.height;
  }
  return 0;
});

const Box = mongoose.model('Box', boxSchema);

module.exports = Box;
