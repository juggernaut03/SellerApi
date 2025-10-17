const mongoose = require('mongoose');

const shipmentItemSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    uppercase: true,
  },
  productName: {
    type: String,
    required: true,
  },
  productId: {
    type: String,
    trim: true,
  },
  asin: {
    type: String,
    uppercase: true,
    trim: true,
  },
  fnsku: {
    type: String,
    uppercase: true,
    trim: true,
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
  qty: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  expectedQty: {
    type: Number,
    default: 0,
    comment: 'Total expected quantity for this SKU across all boxes',
  },
  unitWeight: {
    type: Number,
    default: 0,
    min: [0, 'Unit weight cannot be negative'],
  },
  totalWeight: {
    type: Number,
    default: 0,
  },
});

const boxSchema = new mongoose.Schema({
  boxNo: {
    type: String,
    required: true,
  },
  boxName: {
    type: String,
    trim: true,
    comment: 'Custom box name like P1-B1, P1-B2',
  },
  items: [shipmentItemSchema],
  boxWeight: {
    type: Number,
    default: 0,
    min: [0, 'Box weight cannot be negative'],
    comment: 'Box weight in lbs or kg',
  },
  dimensions: {
    length: {
      type: Number,
      min: [0, 'Length cannot be negative'],
      comment: 'Length in inches',
    },
    width: {
      type: Number,
      min: [0, 'Width cannot be negative'],
      comment: 'Width in inches',
    },
    height: {
      type: Number,
      min: [0, 'Height cannot be negative'],
      comment: 'Height in inches',
    },
  },
  notes: String,
});

const shipmentSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: String,
      unique: true,
      uppercase: true,
    },
    packGroup: {
      type: String,
      trim: true,
      comment: 'Pack group identifier like 1, 2, etc.',
    },
    fbaShipmentId: {
      type: String,
      trim: true,
      uppercase: true,
      comment: 'Amazon FBA shipment ID',
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    destinationType: {
      type: String,
      enum: ['FBA', 'Customer', 'Warehouse', 'Other'],
      default: 'FBA',
    },
    status: {
      type: String,
      enum: ['draft', 'ready', 'shipped', 'delivered', 'cancelled'],
      default: 'draft',
    },
    boxes: [boxSchema],
    totalSKUs: {
      type: Number,
      default: 0,
      comment: 'Total unique SKUs in this shipment',
    },
    totalBoxes: {
      type: Number,
      default: 0,
    },
    totalItems: {
      type: Number,
      default: 0,
    },
    totalWeight: {
      type: Number,
      default: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: [0, 'Shipping cost cannot be negative'],
    },
    carrier: {
      type: String,
      trim: true,
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    shipmentDate: {
      type: Date,
    },
    deliveryDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    invoiceUrl: {
      type: String,
    },
    packingListUrl: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Generate shipment ID automatically
shipmentSchema.pre('save', async function (next) {
  if (!this.shipmentId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Shipment').countDocuments();
    this.shipmentId = `SHP${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Calculate totals before saving
shipmentSchema.pre('save', function (next) {
  // Calculate total boxes
  this.totalBoxes = this.boxes.length;

  // Calculate total items, weight, and unique SKUs
  let totalItems = 0;
  let totalWeight = 0;
  const uniqueSKUs = new Set();

  this.boxes.forEach((box) => {
    // Calculate box weight from items
    let boxItemsWeight = 0;
    box.items.forEach((item) => {
      totalItems += item.qty;
      item.totalWeight = item.qty * item.unitWeight;
      boxItemsWeight += item.totalWeight;
      uniqueSKUs.add(item.sku.toUpperCase());
    });

    // Use box weight or calculated items weight
    if (box.boxWeight === 0) {
      box.boxWeight = boxItemsWeight;
    }

    totalWeight += box.boxWeight;
  });

  this.totalItems = totalItems;
  this.totalWeight = totalWeight;
  this.totalSKUs = uniqueSKUs.size;

  next();
});

// Method to add box
shipmentSchema.methods.addBox = function (boxData) {
  if (this.status !== 'draft') {
    throw new Error('Cannot add boxes to a non-draft shipment');
  }

  this.boxes.push(boxData);
  return this.save();
};

// Method to add item to box
shipmentSchema.methods.addItemToBox = function (boxIndex, itemData) {
  if (this.status !== 'draft') {
    throw new Error('Cannot add items to a non-draft shipment');
  }

  if (boxIndex < 0 || boxIndex >= this.boxes.length) {
    throw new Error('Invalid box index');
  }

  const box = this.boxes[boxIndex];
  const existingItemIndex = box.items.findIndex(
    item => item.sku.toUpperCase() === itemData.sku.toUpperCase()
  );

  if (existingItemIndex !== -1) {
    // Update existing item quantity
    box.items[existingItemIndex].qty += itemData.qty;
    box.items[existingItemIndex].totalWeight = box.items[existingItemIndex].qty * box.items[existingItemIndex].unitWeight;
  } else {
    // Add new item
    box.items.push(itemData);
  }

  return this.save();
};

// Method to finalize shipment
shipmentSchema.methods.finalize = function () {
  if (this.status !== 'draft') {
    throw new Error('Shipment is already finalized');
  }

  if (this.boxes.length === 0) {
    throw new Error('Cannot finalize shipment without boxes');
  }

  this.status = 'ready';
  return this.save();
};

// Method to mark as shipped
shipmentSchema.methods.markAsShipped = function (shipmentDate, trackingNumber, carrier) {
  if (this.status !== 'ready') {
    throw new Error('Shipment must be ready before shipping');
  }

  this.status = 'shipped';
  this.shipmentDate = shipmentDate || new Date();
  if (trackingNumber) this.trackingNumber = trackingNumber;
  if (carrier) this.carrier = carrier;

  return this.save();
};

// Static method to get shipments by status
shipmentSchema.statics.findByStatus = function (status) {
  return this.find({ status });
};

const Shipment = mongoose.model('Shipment', shipmentSchema);

module.exports = Shipment;
