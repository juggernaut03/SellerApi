const Shipment = require('../models/Shipment');
const Inventory = require('../models/Inventory');

/**
 * Create new shipment
 */
const createShipment = async (shipmentData, userId) => {
  const shipment = await Shipment.create({
    ...shipmentData,
    createdBy: userId,
    updatedBy: userId,
  });
  return shipment;
};

/**
 * Get all shipments with filters
 */
const getAllShipments = async (filters = {}) => {
  const {
    status,
    destination,
    search,
    fromDate,
    toDate,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 50,
  } = filters;

  const query = {};

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by destination
  if (destination) {
    query.destination = { $regex: destination, $options: 'i' };
  }

  // Search by shipment ID or tracking number
  if (search) {
    query.$or = [
      { shipmentId: { $regex: search, $options: 'i' } },
      { trackingNumber: { $regex: search, $options: 'i' } },
    ];
  }

  // Filter by date range
  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) query.createdAt.$gte = new Date(fromDate);
    if (toDate) query.createdAt.$lte = new Date(toDate);
  }

  // Sort options
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Pagination
  const skip = (page - 1) * limit;

  const [shipments, total] = await Promise.all([
    Shipment.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email'),
    Shipment.countDocuments(query),
  ]);

  return {
    shipments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get shipment by ID
 */
const getShipmentById = async (id) => {
  const shipment = await Shipment.findById(id)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');
  return shipment;
};

/**
 * Get shipment by shipment ID
 */
const getShipmentByShipmentId = async (shipmentId) => {
  const shipment = await Shipment.findOne({ 
    shipmentId: shipmentId.toUpperCase() 
  })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');
  return shipment;
};

/**
 * Update shipment
 */
const updateShipment = async (id, updateData, userId) => {
  const shipment = await Shipment.findById(id);
  
  if (!shipment) {
    throw new Error('Shipment not found');
  }

  if (shipment.status !== 'draft' && updateData.boxes) {
    throw new Error('Cannot modify boxes of a non-draft shipment');
  }

  Object.assign(shipment, updateData);
  shipment.updatedBy = userId;
  
  await shipment.save();
  return shipment;
};

/**
 * Add box to shipment
 */
const addBox = async (id, boxData, userId) => {
  const shipment = await Shipment.findById(id);
  
  if (!shipment) {
    throw new Error('Shipment not found');
  }

  // Validate items have inventory
  for (const item of boxData.items || []) {
    const inventoryItem = await Inventory.findOne({ 
      sku: item.sku.toUpperCase(),
      isActive: true 
    });

    if (!inventoryItem) {
      throw new Error(`SKU ${item.sku} not found in inventory`);
    }

    // Check if enough stock available
    if (inventoryItem.availableQty < item.qty) {
      throw new Error(
        `Insufficient stock for SKU ${item.sku}. Available: ${inventoryItem.availableQty}, Required: ${item.qty}`
      );
    }

    // Set product name and unit weight from inventory
    item.productName = item.productName || inventoryItem.name;
    item.unitWeight = item.unitWeight || inventoryItem.unitWeight;
  }

  await shipment.addBox(boxData);
  shipment.updatedBy = userId;
  await shipment.save();
  
  return shipment;
};

/**
 * Add item to existing box
 */
const addItemToBox = async (id, boxIndex, itemData, userId) => {
  const shipment = await Shipment.findById(id);
  
  if (!shipment) {
    throw new Error('Shipment not found');
  }

  // Validate inventory
  const inventoryItem = await Inventory.findOne({ 
    sku: itemData.sku.toUpperCase(),
    isActive: true 
  });

  if (!inventoryItem) {
    throw new Error(`SKU ${itemData.sku} not found in inventory`);
  }

  if (inventoryItem.availableQty < itemData.qty) {
    throw new Error(
      `Insufficient stock for SKU ${itemData.sku}. Available: ${inventoryItem.availableQty}, Required: ${itemData.qty}`
    );
  }

  // Set product details from inventory
  itemData.productName = itemData.productName || inventoryItem.name;
  itemData.unitWeight = itemData.unitWeight || inventoryItem.unitWeight;

  await shipment.addItemToBox(boxIndex, itemData);
  shipment.updatedBy = userId;
  await shipment.save();
  
  return shipment;
};

/**
 * Finalize shipment
 */
const finalizeShipment = async (id, userId) => {
  const shipment = await Shipment.findById(id);
  
  if (!shipment) {
    throw new Error('Shipment not found');
  }

  // Deduct inventory for all items
  for (const box of shipment.boxes) {
    for (const item of box.items) {
      await Inventory.findOneAndUpdate(
        { sku: item.sku.toUpperCase() },
        { $inc: { availableQty: -item.qty } }
      );
    }
  }

  await shipment.finalize();
  shipment.updatedBy = userId;
  await shipment.save();
  
  return shipment;
};

/**
 * Mark shipment as shipped
 */
const markAsShipped = async (id, shipmentDate, trackingNumber, carrier, userId) => {
  const shipment = await Shipment.findById(id);
  
  if (!shipment) {
    throw new Error('Shipment not found');
  }

  await shipment.markAsShipped(shipmentDate, trackingNumber, carrier);
  shipment.updatedBy = userId;
  await shipment.save();
  
  return shipment;
};

/**
 * Cancel shipment
 */
const cancelShipment = async (id, userId) => {
  const shipment = await Shipment.findById(id);
  
  if (!shipment) {
    throw new Error('Shipment not found');
  }

  if (shipment.status === 'shipped' || shipment.status === 'delivered') {
    throw new Error('Cannot cancel a shipped or delivered shipment');
  }

  // Restore inventory if shipment was finalized
  if (shipment.status === 'ready') {
    for (const box of shipment.boxes) {
      for (const item of box.items) {
        await Inventory.findOneAndUpdate(
          { sku: item.sku.toUpperCase() },
          { $inc: { availableQty: item.qty } }
        );
      }
    }
  }

  shipment.status = 'cancelled';
  shipment.updatedBy = userId;
  await shipment.save();
  
  return shipment;
};

/**
 * Get shipment statistics
 */
const getShipmentStats = async () => {
  const stats = await Shipment.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBoxes: { $sum: '$totalBoxes' },
        totalItems: { $sum: '$totalItems' },
        totalWeight: { $sum: '$totalWeight' },
        totalCost: { $sum: '$shippingCost' },
      },
    },
  ]);

  return stats;
};

/**
 * Delete shipment (only draft shipments)
 */
const deleteShipment = async (id, userId) => {
  const shipment = await Shipment.findById(id);
  
  if (!shipment) {
    throw new Error('Shipment not found');
  }

  if (shipment.status !== 'draft') {
    throw new Error('Can only delete draft shipments');
  }

  await Shipment.findByIdAndDelete(id);
  return shipment;
};

/**
 * Duplicate an existing box
 */
const duplicateBox = async (id, boxIndex, newBoxData, userId) => {
  const shipment = await Shipment.findById(id);
  
  if (!shipment) {
    throw new Error('Shipment not found');
  }

  if (shipment.status !== 'draft') {
    throw new Error('Cannot add boxes to a non-draft shipment');
  }

  if (boxIndex < 0 || boxIndex >= shipment.boxes.length) {
    throw new Error('Invalid box index');
  }

  // Get the source box
  const sourceBox = shipment.boxes[boxIndex];

  // Create new box with copied items
  const newBox = {
    boxNo: newBoxData.boxNo || `BOX${shipment.boxes.length + 1}`,
    boxName: newBoxData.boxName || sourceBox.boxName,
    items: sourceBox.items.map(item => ({
      sku: item.sku,
      productName: item.productName,
      productId: item.productId,
      asin: item.asin,
      fnsku: item.fnsku,
      condition: item.condition,
      prepType: item.prepType,
      qty: item.qty,
      expectedQty: item.expectedQty,
      unitWeight: item.unitWeight,
      totalWeight: item.totalWeight,
    })),
    boxWeight: newBoxData.boxWeight !== undefined ? newBoxData.boxWeight : sourceBox.boxWeight,
    dimensions: newBoxData.dimensions || sourceBox.dimensions,
    notes: newBoxData.notes || sourceBox.notes,
  };

  // Validate all items still have inventory
  for (const item of newBox.items) {
    const inventoryItem = await Inventory.findOne({ 
      sku: item.sku.toUpperCase(),
      isActive: true 
    });

    if (!inventoryItem) {
      throw new Error(`SKU ${item.sku} not found in inventory`);
    }

    if (inventoryItem.availableQty < item.qty) {
      throw new Error(
        `Insufficient stock for SKU ${item.sku}. Available: ${inventoryItem.availableQty}, Required: ${item.qty}`
      );
    }
  }

  shipment.boxes.push(newBox);
  shipment.updatedBy = userId;
  await shipment.save();

  return shipment;
};

module.exports = {
  createShipment,
  getAllShipments,
  getShipmentById,
  getShipmentByShipmentId,
  updateShipment,
  addBox,
  addItemToBox,
  duplicateBox,
  finalizeShipment,
  markAsShipped,
  cancelShipment,
  getShipmentStats,
  deleteShipment,
};
