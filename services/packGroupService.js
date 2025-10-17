const Shipment = require('../models/Shipment');
const Inventory = require('../models/Inventory');

/**
 * Get pack group data in CSV-exportable format
 * This prepares data for Amazon FBA pack group CSV
 */
const getPackGroupData = async (shipmentId) => {
  const shipment = await Shipment.findById(shipmentId)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!shipment) {
    throw new Error('Shipment not found');
  }

  // Collect all unique SKUs and their total expected quantities
  const skuMap = new Map();
  
  shipment.boxes.forEach((box) => {
    box.items.forEach((item) => {
      const skuKey = item.sku.toUpperCase();
      if (!skuMap.has(skuKey)) {
        skuMap.set(skuKey, {
          sku: item.sku,
          productName: item.productName,
          productId: item.productId || '',
          asin: item.asin || '',
          fnsku: item.fnsku || '',
          condition: item.condition || 'NewItem',
          prepType: item.prepType || 'NONE',
          expectedQty: 0,
          boxedQty: 0,
          boxQuantities: new Array(shipment.boxes.length).fill(0),
        });
      }
      const skuData = skuMap.get(skuKey);
      const boxIndex = shipment.boxes.indexOf(box);
      skuData.boxQuantities[boxIndex] += item.qty;
      skuData.boxedQty += item.qty;
    });
  });

  // Calculate expected quantity (sum of all boxed quantities)
  skuMap.forEach((skuData) => {
    skuData.expectedQty = skuData.boxedQty;
  });

  // Prepare box details
  const boxDetails = shipment.boxes.map((box) => ({
    boxNo: box.boxNo,
    boxName: box.boxName || box.boxNo,
    boxWeight: box.boxWeight || 0,
    length: box.dimensions?.length || 0,
    width: box.dimensions?.width || 0,
    height: box.dimensions?.height || 0,
  }));

  return {
    packGroup: shipment.packGroup || '1',
    fbaShipmentId: shipment.fbaShipmentId || '',
    destination: shipment.destination,
    totalSKUs: shipment.totalSKUs,
    totalItems: shipment.totalItems,
    totalBoxes: shipment.totalBoxes,
    skus: Array.from(skuMap.values()),
    boxes: boxDetails,
    shipment,
  };
};

/**
 * Create shipment from pack group data
 * This is useful when importing from UI or CSV
 */
const createFromPackGroup = async (packGroupData, userId) => {
  const { packGroup, fbaShipmentId, destination, boxes, skus } = packGroupData;

  // Validate that all SKUs exist in inventory
  const inventoryValidation = await Promise.all(
    skus.map(async (sku) => {
      const inventoryItem = await Inventory.findOne({ sku: sku.sku.toUpperCase() });
      if (!inventoryItem) {
        throw new Error(`SKU ${sku.sku} not found in inventory`);
      }
      return {
        sku: inventoryItem.sku,
        name: inventoryItem.name,
        asin: inventoryItem.asin || sku.asin,
        fnsku: inventoryItem.fnsku || sku.fnsku,
        productId: inventoryItem.productId || sku.productId,
        condition: inventoryItem.condition || sku.condition,
        prepType: inventoryItem.prepType || sku.prepType,
        unitWeight: inventoryItem.unitWeight,
      };
    })
  );

  // Create shipment with boxes
  const shipment = new Shipment({
    packGroup,
    fbaShipmentId,
    destination,
    destinationType: 'FBA',
    status: 'draft',
    createdBy: userId,
    updatedBy: userId,
  });

  // Add boxes with items
  boxes.forEach((boxData, boxIndex) => {
    const boxItems = [];

    skus.forEach((skuData) => {
      const qty = skuData.boxQuantities[boxIndex];
      if (qty > 0) {
        const inventoryItem = inventoryValidation.find(
          (inv) => inv.sku === skuData.sku.toUpperCase()
        );

        boxItems.push({
          sku: skuData.sku,
          productName: skuData.productName,
          productId: inventoryItem.productId,
          asin: inventoryItem.asin,
          fnsku: inventoryItem.fnsku,
          condition: inventoryItem.condition,
          prepType: inventoryItem.prepType,
          qty,
          expectedQty: skuData.expectedQty,
          unitWeight: inventoryItem.unitWeight,
        });
      }
    });

    shipment.boxes.push({
      boxNo: boxData.boxNo || `BOX${boxIndex + 1}`,
      boxName: boxData.boxName || `P${packGroup}-B${boxIndex + 1}`,
      items: boxItems,
      boxWeight: boxData.boxWeight || 0,
      dimensions: {
        length: boxData.length || 0,
        width: boxData.width || 0,
        height: boxData.height || 0,
      },
      notes: boxData.notes || '',
    });
  });

  await shipment.save();
  return shipment;
};

/**
 * Update box distribution for a shipment
 * This allows updating how SKUs are distributed across boxes
 */
const updateBoxDistribution = async (shipmentId, distributionData, userId) => {
  const shipment = await Shipment.findById(shipmentId);

  if (!shipment) {
    throw new Error('Shipment not found');
  }

  if (shipment.status !== 'draft') {
    throw new Error('Cannot modify a non-draft shipment');
  }

  // distributionData format: { sku: 'SKU001', boxQuantities: [10, 20, 15] }
  distributionData.forEach((dist) => {
    dist.boxQuantities.forEach((qty, boxIndex) => {
      if (boxIndex < shipment.boxes.length) {
        const box = shipment.boxes[boxIndex];
        const existingItemIndex = box.items.findIndex(
          (item) => item.sku.toUpperCase() === dist.sku.toUpperCase()
        );

        if (qty > 0) {
          if (existingItemIndex !== -1) {
            // Update existing item
            box.items[existingItemIndex].qty = qty;
          } else {
            // Add new item (need to fetch from inventory)
            throw new Error(
              `Cannot add new SKU ${dist.sku} to box ${boxIndex}. Use addItemToBox instead.`
            );
          }
        } else if (existingItemIndex !== -1) {
          // Remove item if quantity is 0
          box.items.splice(existingItemIndex, 1);
        }
      }
    });
  });

  shipment.updatedBy = userId;
  await shipment.save();
  return shipment;
};

module.exports = {
  getPackGroupData,
  createFromPackGroup,
  updateBoxDistribution,
};

