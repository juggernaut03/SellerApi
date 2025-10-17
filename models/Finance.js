const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      unique: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense', 'refund', 'adjustment'],
      required: [true, 'Transaction type is required'],
      index: true,
    },
    category: {
      type: String,
      enum: [
        'amazon_payment',
        'product_purchase',
        'shipping_cost',
        'packaging_cost',
        'amazon_fees',
        'advertising',
        'storage_fees',
        'misc_expense',
        'refund',
        'adjustment',
        'other'
      ],
      required: [true, 'Category is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Link to related entities
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      index: true,
    },
    sku: {
      type: String,
      uppercase: true,
      trim: true,
      index: true,
    },
    productName: {
      type: String,
      trim: true,
    },
    // Amazon specific
    orderId: {
      type: String,
      trim: true,
      index: true,
      comment: 'Amazon order ID',
    },
    settlementId: {
      type: String,
      trim: true,
      comment: 'Amazon settlement ID',
    },
    // Detailed breakdown
    breakdown: {
      productSales: {
        type: Number,
        default: 0,
      },
      shippingCredits: {
        type: Number,
        default: 0,
      },
      giftWrapCredits: {
        type: Number,
        default: 0,
      },
      promotionalRebates: {
        type: Number,
        default: 0,
      },
      amazonFees: {
        type: Number,
        default: 0,
      },
      fbaFees: {
        type: Number,
        default: 0,
      },
      commissionFees: {
        type: Number,
        default: 0,
      },
      storageFees: {
        type: Number,
        default: 0,
      },
      otherFees: {
        type: Number,
        default: 0,
      },
    },
    // Cost tracking
    costs: {
      purchaseCost: {
        type: Number,
        default: 0,
        comment: 'Cost to purchase/manufacture product',
      },
      shippingCost: {
        type: Number,
        default: 0,
        comment: 'Cost to ship to Amazon',
      },
      packagingCost: {
        type: Number,
        default: 0,
        comment: 'Packaging materials cost',
      },
      miscCost: {
        type: Number,
        default: 0,
        comment: 'Other miscellaneous costs',
      },
    },
    totalCost: {
      type: Number,
      default: 0,
      comment: 'Sum of all costs',
    },
    profit: {
      type: Number,
      default: 0,
      comment: 'Net profit (amount - totalCost - fees)',
    },
    profitMargin: {
      type: Number,
      default: 0,
      comment: 'Profit margin percentage',
    },
    transactionDate: {
      type: Date,
      required: [true, 'Transaction date is required'],
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['amazon', 'bank_transfer', 'cash', 'credit_card', 'other'],
      default: 'amazon',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed',
    },
    supplier: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    attachments: [{
      type: String,
      comment: 'URLs of receipts, invoices, etc.',
    }],
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

// Generate transaction ID automatically
financeSchema.pre('save', async function (next) {
  if (!this.transactionId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Finance').countDocuments();
    const prefix = this.type === 'income' ? 'INC' : this.type === 'expense' ? 'EXP' : 'TXN';
    this.transactionId = `${prefix}${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Calculate totals before saving
financeSchema.pre('save', function (next) {
  // Calculate total cost
  this.totalCost =
    (this.costs.purchaseCost || 0) +
    (this.costs.shippingCost || 0) +
    (this.costs.packagingCost || 0) +
    (this.costs.miscCost || 0);

  // Calculate total fees
  const totalFees =
    (this.breakdown.amazonFees || 0) +
    (this.breakdown.fbaFees || 0) +
    (this.breakdown.commissionFees || 0) +
    (this.breakdown.storageFees || 0) +
    (this.breakdown.otherFees || 0);

  // Calculate profit
  if (this.type === 'income') {
    this.profit = this.amount - this.totalCost - totalFees;

    // Calculate profit margin
    if (this.amount > 0) {
      this.profitMargin = (this.profit / this.amount) * 100;
    }
  } else if (this.type === 'expense') {
    this.profit = -this.amount;
    this.profitMargin = 0;
  }

  next();
});

// Index for text search
financeSchema.index({ description: 'text', productName: 'text', sku: 'text' });

// Index for date range queries
financeSchema.index({ transactionDate: -1 });
financeSchema.index({ type: 1, transactionDate: -1 });
financeSchema.index({ category: 1, transactionDate: -1 });

// Virtual for net amount
financeSchema.virtual('netAmount').get(function () {
  return this.type === 'income' ? this.amount : -this.amount;
});

// Static method to calculate profit for a date range
financeSchema.statics.calculateProfit = async function (startDate, endDate) {
  const result = await this.aggregate([
    {
      $match: {
        transactionDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
          }
        },
        totalExpense: {
          $sum: {
            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
          }
        },
        totalProfit: { $sum: '$profit' },
        transactionCount: { $sum: 1 }
      }
    }
  ]);

  return result[0] || { totalIncome: 0, totalExpense: 0, totalProfit: 0, transactionCount: 0 };
};

// Static method to get profit by SKU
financeSchema.statics.getProfitBySKU = async function (sku, startDate, endDate) {
  const match = { sku: sku.toUpperCase() };
  if (startDate && endDate) {
    match.transactionDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$sku',
        totalRevenue: {
          $sum: {
            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
          }
        },
        totalCost: { $sum: '$totalCost' },
        totalProfit: { $sum: '$profit' },
        transactionCount: { $sum: 1 }
      }
    }
  ]);

  return result[0] || null;
};

const Finance = mongoose.model('Finance', financeSchema);

module.exports = Finance;

