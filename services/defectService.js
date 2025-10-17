const Defect = require('../models/Defect');
const Inventory = require('../models/Inventory');

/**
 * Create new defect report
 */
const createDefect = async (defectData, userId) => {
  // Validate SKU exists
  const inventoryItem = await Inventory.findOne({ sku: defectData.sku.toUpperCase() });
  if (!inventoryItem) {
    throw new Error(`SKU ${defectData.sku} not found in inventory`);
  }

  // Auto-fill product name if not provided
  if (!defectData.productName) {
    defectData.productName = inventoryItem.name;
  }

  // Auto-fill unit cost if not provided
  if (!defectData.unitCost) {
    defectData.unitCost = inventoryItem.purchasePrice || 0;
  }

  // Auto-fill supplier if not provided
  if (!defectData.supplier && inventoryItem.supplier) {
    defectData.supplier = inventoryItem.supplier;
  }

  const defect = new Defect({
    ...defectData,
    reportedBy: userId,
  });

  await defect.save();

  // Update inventory faulty quantity
  inventoryItem.faultyQty += defectData.defectiveQty;
  await inventoryItem.save();

  return defect;
};

/**
 * Get all defects with filters
 */
const getAllDefects = async (filters = {}) => {
  const {
    status,
    severity,
    supplier,
    detectedAt,
    search,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const query = {};

  // Apply filters
  if (status) query.status = status;
  if (severity) query.severity = severity;
  if (supplier) query.supplier = supplier;
  if (detectedAt) query.detectedAt = detectedAt;

  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const [defects, total] = await Promise.all([
    Defect.find(query)
      .populate('reportedBy', 'name email')
      .populate('resolvedBy', 'name email')
      .populate('shipmentId', 'shipmentId destination')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Defect.countDocuments(query),
  ]);

  return {
    defects,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get defect by ID
 */
const getDefectById = async (id) => {
  const defect = await Defect.findById(id)
    .populate('reportedBy', 'name email')
    .populate('resolvedBy', 'name email')
    .populate('shipmentId', 'shipmentId destination boxes');

  if (!defect) {
    throw new Error('Defect not found');
  }

  return defect;
};

/**
 * Get defects by shipment
 */
const getDefectsByShipment = async (shipmentId) => {
  const defects = await Defect.findByShipment(shipmentId)
    .populate('reportedBy', 'name email')
    .populate('resolvedBy', 'name email');

  return defects;
};

/**
 * Get defects by supplier
 */
const getDefectsBySupplier = async (supplier) => {
  const defects = await Defect.findBySupplier(supplier)
    .populate('reportedBy', 'name email')
    .populate('resolvedBy', 'name email')
    .sort({ createdAt: -1 });

  return defects;
};

/**
 * Update defect
 */
const updateDefect = async (id, updateData, userId) => {
  const defect = await Defect.findById(id);

  if (!defect) {
    throw new Error('Defect not found');
  }

  // Don't allow changing SKU or defectiveQty after creation
  delete updateData.sku;
  delete updateData.defectiveQty;
  delete updateData.reportedBy;

  Object.assign(defect, updateData);
  defect.updatedBy = userId;

  await defect.save();
  return defect;
};

/**
 * Resolve defect
 */
const resolveDefect = async (id, resolution, userId) => {
  const defect = await Defect.findById(id);

  if (!defect) {
    throw new Error('Defect not found');
  }

  if (defect.status === 'resolved') {
    throw new Error('Defect is already resolved');
  }

  await defect.resolve(resolution, userId);
  return defect;
};

/**
 * Update supplier claim
 */
const updateSupplierClaim = async (id, claimData, userId) => {
  const defect = await Defect.findById(id);

  if (!defect) {
    throw new Error('Defect not found');
  }

  defect.claimAmount = claimData.claimAmount || defect.claimAmount;
  defect.claimStatus = claimData.claimStatus || defect.claimStatus;
  defect.supplierNotified = claimData.supplierNotified !== undefined ? claimData.supplierNotified : defect.supplierNotified;
  defect.updatedBy = userId;

  await defect.save();
  return defect;
};

/**
 * Delete defect
 */
const deleteDefect = async (id) => {
  const defect = await Defect.findById(id);

  if (!defect) {
    throw new Error('Defect not found');
  }

  // Restore inventory faulty quantity
  const inventoryItem = await Inventory.findOne({ sku: defect.sku });
  if (inventoryItem) {
    inventoryItem.faultyQty = Math.max(0, inventoryItem.faultyQty - defect.defectiveQty);
    await inventoryItem.save();
  }

  await Defect.findByIdAndDelete(id);
  return defect;
};

/**
 * Get defect statistics
 */
const getDefectStats = async (filters = {}) => {
  const { startDate, endDate, supplier } = filters;

  const matchQuery = {};

  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
    if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
  }

  if (supplier) {
    matchQuery.supplier = supplier;
  }

  const [
    statusStats,
    severityStats,
    typeStats,
    totalLoss,
    supplierStats,
  ] = await Promise.all([
    // Status breakdown
    Defect.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalQty: { $sum: '$defectiveQty' },
          totalLoss: { $sum: '$totalLoss' },
        },
      },
    ]),
    // Severity breakdown
    Defect.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
          totalQty: { $sum: '$defectiveQty' },
        },
      },
    ]),
    // Defect type breakdown
    Defect.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$defectType',
          count: { $sum: 1 },
          totalQty: { $sum: '$defectiveQty' },
        },
      },
    ]),
    // Total loss calculation
    Defect.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalDefects: { $sum: 1 },
          totalDefectiveQty: { $sum: '$defectiveQty' },
          totalLoss: { $sum: '$totalLoss' },
          totalClaim: { $sum: '$claimAmount' },
        },
      },
    ]),
    // Supplier statistics
    Defect.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$supplier',
          count: { $sum: 1 },
          totalQty: { $sum: '$defectiveQty' },
          totalLoss: { $sum: '$totalLoss' },
          totalClaim: { $sum: '$claimAmount' },
        },
      },
      { $sort: { totalLoss: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return {
    byStatus: statusStats,
    bySeverity: severityStats,
    byType: typeStats,
    overall: totalLoss[0] || {
      totalDefects: 0,
      totalDefectiveQty: 0,
      totalLoss: 0,
      totalClaim: 0,
    },
    topSuppliers: supplierStats,
  };
};

module.exports = {
  createDefect,
  getAllDefects,
  getDefectById,
  getDefectsByShipment,
  getDefectsBySupplier,
  updateDefect,
  resolveDefect,
  updateSupplierClaim,
  deleteDefect,
  getDefectStats,
};
