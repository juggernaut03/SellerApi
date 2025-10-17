const mongoose = require('mongoose');

const defectSchema = new mongoose.Schema(
  {
    defectId: {
      type: String,
      unique: true,
      uppercase: true,
    },
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      index: true,
    },
    shipmentReference: {
      type: String,
      trim: true,
      comment: 'External shipment reference number',
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    defectiveQty: {
      type: Number,
      required: [true, 'Defective quantity is required'],
      min: [1, 'Defective quantity must be at least 1'],
    },
    defectType: {
      type: String,
      enum: ['damaged', 'missing_parts', 'wrong_item', 'quality_issue', 'packaging_issue', 'other'],
      default: 'other',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    remarks: {
      type: String,
      trim: true,
    },
    detectedAt: {
      type: String,
      enum: ['receiving', 'quality_check', 'packing', 'customer_return', 'fba_return'],
      default: 'quality_check',
    },
    supplier: {
      type: String,
      trim: true,
    },
    unitCost: {
      type: Number,
      default: 0,
      min: [0, 'Unit cost cannot be negative'],
      comment: 'Cost per unit for loss calculation',
    },
    totalLoss: {
      type: Number,
      default: 0,
      comment: 'Total financial loss (defectiveQty × unitCost)',
    },
    status: {
      type: String,
      enum: ['reported', 'investigating', 'resolved', 'written_off', 'supplier_claim'],
      default: 'reported',
    },
    resolution: {
      type: String,
      trim: true,
      comment: 'How the defect was resolved',
    },
    supplierNotified: {
      type: Boolean,
      default: false,
    },
    claimAmount: {
      type: Number,
      default: 0,
      min: [0, 'Claim amount cannot be negative'],
      comment: 'Amount claimed from supplier',
    },
    claimStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected', 'paid'],
      default: 'none',
    },
    images: [{
      type: String,
      comment: 'URLs of defect images',
    }],
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Generate defect ID automatically
defectSchema.pre('save', async function (next) {
  if (!this.defectId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Defect').countDocuments();
    this.defectId = `DEF${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Calculate total loss before saving
defectSchema.pre('save', function (next) {
  this.totalLoss = this.defectiveQty * this.unitCost;
  next();
});

// Index for text search
defectSchema.index({ productName: 'text', remarks: 'text', sku: 'text' });

// Index for filtering
defectSchema.index({ status: 1, createdAt: -1 });
defectSchema.index({ supplier: 1, status: 1 });

// Static method to get defects by shipment
defectSchema.statics.findByShipment = function (shipmentId) {
  return this.find({ shipmentId });
};

// Static method to get defects by supplier
defectSchema.statics.findBySupplier = function (supplier) {
  return this.find({ supplier });
};

// Method to resolve defect
defectSchema.methods.resolve = function (resolution, resolvedBy) {
  this.status = 'resolved';
  this.resolution = resolution;
  this.resolvedBy = resolvedBy;
  this.resolvedAt = new Date();
  return this.save();
};

const Defect = mongoose.model('Defect', defectSchema);

module.exports = Defect;

