const Finance = require('../models/Finance');
const Inventory = require('../models/Inventory');

/**
 * Create financial transaction
 */
const createTransaction = async (transactionData, userId) => {
  // If SKU provided, fetch product details
  if (transactionData.sku) {
    const inventoryItem = await Inventory.findOne({ sku: transactionData.sku.toUpperCase() });
    if (inventoryItem) {
      if (!transactionData.productName) {
        transactionData.productName = inventoryItem.name;
      }
      // Auto-fill costs if not provided and it's an expense
      if (transactionData.type === 'expense' && transactionData.category === 'product_purchase') {
        if (!transactionData.costs) {
          transactionData.costs = {};
        }
        if (!transactionData.costs.purchaseCost) {
          transactionData.costs.purchaseCost = inventoryItem.purchasePrice || 0;
        }
      }
    }
  }

  const transaction = new Finance({
    ...transactionData,
    createdBy: userId,
  });

  await transaction.save();
  return transaction;
};

/**
 * Get all transactions with filters
 */
const getAllTransactions = async (filters = {}) => {
  const {
    type,
    category,
    paymentStatus,
    sku,
    supplier,
    search,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    sortBy = 'transactionDate',
    sortOrder = 'desc',
  } = filters;

  const query = {};

  // Apply filters
  if (type) query.type = type;
  if (category) query.category = category;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (sku) query.sku = sku.toUpperCase();
  if (supplier) query.supplier = supplier;

  // Date range filter
  if (startDate || endDate) {
    query.transactionDate = {};
    if (startDate) query.transactionDate.$gte = new Date(startDate);
    if (endDate) query.transactionDate.$lte = new Date(endDate);
  }

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const [transactions, total] = await Promise.all([
    Finance.find(query)
      .populate('createdBy', 'name email')
      .populate('shipmentId', 'shipmentId destination')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Finance.countDocuments(query),
  ]);

  return {
    transactions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get transaction by ID
 */
const getTransactionById = async (id) => {
  const transaction = await Finance.findById(id)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .populate('shipmentId', 'shipmentId destination boxes');

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  return transaction;
};

/**
 * Get transactions by SKU
 */
const getTransactionsBySKU = async (sku, startDate, endDate) => {
  const query = { sku: sku.toUpperCase() };

  if (startDate || endDate) {
    query.transactionDate = {};
    if (startDate) query.transactionDate.$gte = new Date(startDate);
    if (endDate) query.transactionDate.$lte = new Date(endDate);
  }

  const transactions = await Finance.find(query)
    .populate('createdBy', 'name email')
    .sort({ transactionDate: -1 });

  return transactions;
};

/**
 * Update transaction
 */
const updateTransaction = async (id, updateData, userId) => {
  const transaction = await Finance.findById(id);

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  // Don't allow changing type or createdBy
  delete updateData.type;
  delete updateData.createdBy;

  Object.assign(transaction, updateData);
  transaction.updatedBy = userId;

  await transaction.save();
  return transaction;
};

/**
 * Delete transaction
 */
const deleteTransaction = async (id) => {
  const transaction = await Finance.findById(id);

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  await Finance.findByIdAndDelete(id);
  return transaction;
};

/**
 * Get financial summary/statistics
 */
const getFinancialSummary = async (filters = {}) => {
  const { startDate, endDate, sku, supplier, category } = filters;

  const matchQuery = {};

  if (startDate || endDate) {
    matchQuery.transactionDate = {};
    if (startDate) matchQuery.transactionDate.$gte = new Date(startDate);
    if (endDate) matchQuery.transactionDate.$lte = new Date(endDate);
  }

  if (sku) {
    matchQuery.sku = sku.toUpperCase();
  }

  if (supplier) {
    matchQuery.supplier = supplier;
  }

  if (category) {
    matchQuery.category = category;
  }

  const [
    overallStats,
    byCategory,
    byType,
    topProducts,
    monthlyTrend,
  ] = await Promise.all([
    // Overall statistics
    Finance.aggregate([
      { $match: matchQuery },
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
          totalTransactions: { $sum: 1 },
          avgProfit: { $avg: '$profit' },
          totalCosts: { $sum: '$totalCost' },
        },
      },
    ]),
    // By category
    Finance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalProfit: { $sum: '$profit' },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]),
    // By type
    Finance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalProfit: { $sum: '$profit' },
        },
      },
    ]),
    // Top products by profit
    Finance.aggregate([
      {
        $match: {
          ...matchQuery,
          sku: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$sku',
          productName: { $first: '$productName' },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
            }
          },
          totalCost: { $sum: '$totalCost' },
          totalProfit: { $sum: '$profit' },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { totalProfit: -1 } },
      { $limit: 10 },
    ]),
    // Monthly trend (last 12 months)
    Finance.aggregate([
      {
        $match: {
          transactionDate: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' },
          },
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
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  // Calculate profit if date range provided
  let profitByDateRange = null;
  if (startDate && endDate) {
    profitByDateRange = await Finance.calculateProfit(startDate, endDate);
  }

  return {
    overall: overallStats[0] || {
      totalIncome: 0,
      totalExpense: 0,
      totalProfit: 0,
      totalTransactions: 0,
      avgProfit: 0,
      totalCosts: 0,
    },
    byCategory,
    byType,
    topProducts,
    monthlyTrend,
    profitByDateRange,
  };
};

/**
 * Get profit by SKU
 */
const getProfitBySKU = async (sku, startDate, endDate) => {
  const profitData = await Finance.getProfitBySKU(sku, startDate, endDate);

  if (!profitData) {
    return {
      sku: sku.toUpperCase(),
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      transactionCount: 0,
      profitMargin: 0,
    };
  }

  // Calculate profit margin
  profitData.profitMargin = profitData.totalRevenue > 0
    ? (profitData.totalProfit / profitData.totalRevenue) * 100
    : 0;

  return profitData;
};

/**
 * Get profit by supplier
 */
const getProfitBySupplier = async (startDate, endDate) => {
  const matchQuery = {};

  if (startDate || endDate) {
    matchQuery.transactionDate = {};
    if (startDate) matchQuery.transactionDate.$gte = new Date(startDate);
    if (endDate) matchQuery.transactionDate.$lte = new Date(endDate);
  }

  const supplierStats = await Finance.aggregate([
    {
      $match: {
        ...matchQuery,
        supplier: { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$supplier',
        totalRevenue: {
          $sum: {
            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
          }
        },
        totalExpense: {
          $sum: {
            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
          }
        },
        totalCost: { $sum: '$totalCost' },
        totalProfit: { $sum: '$profit' },
        transactionCount: { $sum: 1 },
      },
    },
    { $sort: { totalProfit: -1 } },
  ]);

  return supplierStats;
};

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  getTransactionsBySKU,
  updateTransaction,
  deleteTransaction,
  getFinancialSummary,
  getProfitBySKU,
  getProfitBySupplier,
};

