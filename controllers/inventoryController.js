const inventoryService = require('../services/inventoryService');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Create new inventory item
 * @route POST /api/inventory
 * @access Private (requires 'inventory' permission)
 */
const createItem = async (req, res, next) => {
  try {
    const item = await inventoryService.createInventoryItem(req.body, req.user._id);

    return successResponse(
      res,
      { item },
      'Inventory item created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all inventory items
 * @route GET /api/inventory
 * @access Private (requires 'inventory' permission)
 */
const getAllItems = async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search,
      category: req.query.category,
      supplier: req.query.supplier,
      isLowStock: req.query.isLowStock,
      isActive: req.query.isActive !== 'false',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      page: req.query.page || 1,
      limit: req.query.limit || 50,
    };

    const result = await inventoryService.getAllInventory(filters);

    return successResponse(
      res,
      result,
      'Inventory items retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get inventory item by ID
 * @route GET /api/inventory/:id
 * @access Private (requires 'inventory' permission)
 */
const getItemById = async (req, res, next) => {
  try {
    const item = await inventoryService.getInventoryById(req.params.id);

    if (!item) {
      return errorResponse(res, 'Inventory item not found', 404);
    }

    return successResponse(
      res,
      { item },
      'Inventory item retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get inventory item by SKU
 * @route GET /api/inventory/sku/:sku
 * @access Private (requires 'inventory' permission)
 */
const getItemBySKU = async (req, res, next) => {
  try {
    const item = await inventoryService.getInventoryBySKU(req.params.sku);

    if (!item) {
      return errorResponse(res, 'Inventory item not found', 404);
    }

    return successResponse(
      res,
      { item },
      'Inventory item retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update inventory item
 * @route PATCH /api/inventory/:id
 * @access Private (requires 'inventory' permission)
 */
const updateItem = async (req, res, next) => {
  try {
    const item = await inventoryService.updateInventoryItem(
      req.params.id,
      req.body,
      req.user._id
    );

    if (!item) {
      return errorResponse(res, 'Inventory item not found', 404);
    }

    return successResponse(
      res,
      { item },
      'Inventory item updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update stock quantity
 * @route PATCH /api/inventory/:id/stock
 * @access Private (requires 'inventory' permission)
 */
const updateStock = async (req, res, next) => {
  try {
    const { availableQty, faultyQty } = req.body;

    if (availableQty === undefined) {
      return errorResponse(res, 'availableQty is required', 400);
    }

    const item = await inventoryService.updateStock(
      req.params.id,
      availableQty,
      faultyQty,
      req.user._id
    );

    return successResponse(
      res,
      { item },
      'Stock updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Adjust stock (add or subtract)
 * @route POST /api/inventory/:id/adjust
 * @access Private (requires 'inventory' permission)
 */
const adjustStock = async (req, res, next) => {
  try {
    const { qtyChange, isFaulty } = req.body;

    if (qtyChange === undefined) {
      return errorResponse(res, 'qtyChange is required', 400);
    }

    const item = await inventoryService.adjustStock(
      req.params.id,
      qtyChange,
      isFaulty || false,
      req.user._id
    );

    return successResponse(
      res,
      { item },
      'Stock adjusted successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete inventory item (soft delete)
 * @route DELETE /api/inventory/:id
 * @access Private (requires 'inventory' permission)
 */
const deleteItem = async (req, res, next) => {
  try {
    const item = await inventoryService.deleteInventoryItem(
      req.params.id,
      req.user._id
    );

    if (!item) {
      return errorResponse(res, 'Inventory item not found', 404);
    }

    return successResponse(res, null, 'Inventory item deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get low stock items
 * @route GET /api/inventory/alerts/low-stock
 * @access Private (requires 'inventory' permission)
 */
const getLowStockItems = async (req, res, next) => {
  try {
    const items = await inventoryService.getLowStockItems();

    return successResponse(
      res,
      {
        count: items.length,
        items,
      },
      'Low stock items retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get inventory statistics
 * @route GET /api/inventory/stats
 * @access Private (requires 'inventory' permission)
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await inventoryService.getInventoryStats();

    return successResponse(
      res,
      { stats },
      'Inventory statistics retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk import inventory items
 * @route POST /api/inventory/bulk-import
 * @access Private (requires 'inventory' permission)
 */
const bulkImport = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse(res, 'Items array is required', 400);
    }

    const results = await inventoryService.bulkImportInventory(
      items,
      req.user._id
    );

    return successResponse(
      res,
      results,
      `Bulk import completed. ${results.success.length} succeeded, ${results.failed.length} failed`
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createItem,
  getAllItems,
  getItemById,
  getItemBySKU,
  updateItem,
  updateStock,
  adjustStock,
  deleteItem,
  getLowStockItems,
  getStats,
  bulkImport,
};
