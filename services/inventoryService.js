const Inventory = require('../models/Inventory');

/**
 * Create new inventory item
 */
const createInventoryItem = async (itemData, userId) => {
  const item = await Inventory.create({
    ...itemData,
    createdBy: userId,
    updatedBy: userId,
  });
  return item;
};

/**
 * Get all inventory items with filters
 */
const getAllInventory = async (filters = {}) => {
  const {
    search,
    category,
    supplier,
    isLowStock,
    isActive = true,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 50,
  } = filters;

  const query = { isActive };

  // Search across name, SKU, barcode
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { barcode: { $regex: search, $options: 'i' } },
    ];
  }

  // Filter by category
  if (category) {
    query.category = category;
  }

  // Filter by supplier
  if (supplier) {
    query.supplier = supplier;
  }

  // Filter by low stock
  if (isLowStock === 'true' || isLowStock === true) {
    query.$expr = { $lte: ['$availableQty', '$lowStockThreshold'] };
  }

  // Sort options
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Pagination
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Inventory.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email'),
    Inventory.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get inventory item by ID
 */
const getInventoryById = async (id) => {
  const item = await Inventory.findById(id)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');
  return item;
};

/**
 * Get inventory item by SKU
 */
const getInventoryBySKU = async (sku) => {
  const item = await Inventory.findOne({ sku: sku.toUpperCase(), isActive: true })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');
  return item;
};

/**
 * Update inventory item
 */
const updateInventoryItem = async (id, updateData, userId) => {
  const item = await Inventory.findByIdAndUpdate(
    id,
    {
      ...updateData,
      updatedBy: userId,
    },
    { new: true, runValidators: true }
  );
  return item;
};

/**
 * Update stock quantity
 */
const updateStock = async (id, availableQty, faultyQty, userId) => {
  const item = await Inventory.findById(id);
  if (!item) {
    throw new Error('Inventory item not found');
  }

  item.availableQty = availableQty;
  if (faultyQty !== undefined) {
    item.faultyQty = faultyQty;
  }
  item.lastRestocked = new Date();
  item.updatedBy = userId;

  await item.save();
  return item;
};

/**
 * Adjust stock (add or subtract)
 */
const adjustStock = async (id, qtyChange, isFaulty = false, userId) => {
  const item = await Inventory.findById(id);
  if (!item) {
    throw new Error('Inventory item not found');
  }

  if (isFaulty) {
    item.faultyQty += qtyChange;
  } else {
    item.availableQty += qtyChange;
  }

  if (item.availableQty < 0) {
    throw new Error('Available quantity cannot be negative');
  }

  if (qtyChange > 0) {
    item.lastRestocked = new Date();
  }

  item.updatedBy = userId;
  await item.save();
  return item;
};

/**
 * Delete inventory item (soft delete)
 */
const deleteInventoryItem = async (id, userId) => {
  const item = await Inventory.findByIdAndUpdate(
    id,
    {
      isActive: false,
      updatedBy: userId,
    },
    { new: true }
  );
  return item;
};

/**
 * Get low stock items
 */
const getLowStockItems = async () => {
  const items = await Inventory.findLowStock();
  return items;
};

/**
 * Get inventory statistics
 */
const getInventoryStats = async () => {
  const stats = await Inventory.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalAvailableQty: { $sum: '$availableQty' },
        totalFaultyQty: { $sum: '$faultyQty' },
        totalValue: {
          $sum: { $multiply: ['$availableQty', '$purchasePrice'] },
        },
        lowStockCount: {
          $sum: {
            $cond: [{ $lte: ['$availableQty', '$lowStockThreshold'] }, 1, 0],
          },
        },
      },
    },
  ]);

  return stats[0] || {
    totalProducts: 0,
    totalAvailableQty: 0,
    totalFaultyQty: 0,
    totalValue: 0,
    lowStockCount: 0,
  };
};

/**
 * Bulk import inventory items
 */
const bulkImportInventory = async (items, userId) => {
  const results = {
    success: [],
    failed: [],
  };

  for (const itemData of items) {
    try {
      const existing = await Inventory.findOne({ sku: itemData.sku.toUpperCase() });
      
      if (existing) {
        // Update existing
        Object.assign(existing, itemData);
        existing.updatedBy = userId;
        await existing.save();
        results.success.push({ sku: itemData.sku, action: 'updated' });
      } else {
        // Create new
        await Inventory.create({
          ...itemData,
          createdBy: userId,
          updatedBy: userId,
        });
        results.success.push({ sku: itemData.sku, action: 'created' });
      }
    } catch (error) {
      results.failed.push({
        sku: itemData.sku,
        error: error.message,
      });
    }
  }

  return results;
};

module.exports = {
  createInventoryItem,
  getAllInventory,
  getInventoryById,
  getInventoryBySKU,
  updateInventoryItem,
  updateStock,
  adjustStock,
  deleteInventoryItem,
  getLowStockItems,
  getInventoryStats,
  bulkImportInventory,
};
