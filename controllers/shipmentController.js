const shipmentService = require('../services/shipmentService');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Create new shipment
 * @route POST /api/shipments
 * @access Private (requires 'shipments' permission)
 */
const createShipment = async (req, res, next) => {
  try {
    const shipment = await shipmentService.createShipment(req.body, req.user._id);

    return successResponse(
      res,
      { shipment },
      'Shipment created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all shipments
 * @route GET /api/shipments
 * @access Private (requires 'shipments' permission)
 */
const getAllShipments = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      destination: req.query.destination,
      search: req.query.search,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      page: req.query.page || 1,
      limit: req.query.limit || 50,
    };

    const result = await shipmentService.getAllShipments(filters);

    return successResponse(
      res,
      result,
      'Shipments retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipment by ID
 * @route GET /api/shipments/:id
 * @access Private (requires 'shipments' permission)
 */
const getShipmentById = async (req, res, next) => {
  try {
    const shipment = await shipmentService.getShipmentById(req.params.id);

    if (!shipment) {
      return errorResponse(res, 'Shipment not found', 404);
    }

    return successResponse(
      res,
      { shipment },
      'Shipment retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipment by shipment ID
 * @route GET /api/shipments/shipment-id/:shipmentId
 * @access Private (requires 'shipments' permission)
 */
const getShipmentByShipmentId = async (req, res, next) => {
  try {
    const shipment = await shipmentService.getShipmentByShipmentId(
      req.params.shipmentId
    );

    if (!shipment) {
      return errorResponse(res, 'Shipment not found', 404);
    }

    return successResponse(
      res,
      { shipment },
      'Shipment retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update shipment
 * @route PATCH /api/shipments/:id
 * @access Private (requires 'shipments' permission)
 */
const updateShipment = async (req, res, next) => {
  try {
    const shipment = await shipmentService.updateShipment(
      req.params.id,
      req.body,
      req.user._id
    );

    return successResponse(
      res,
      { shipment },
      'Shipment updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Add box to shipment
 * @route POST /api/shipments/:id/boxes
 * @access Private (requires 'shipments' permission)
 */
const addBox = async (req, res, next) => {
  try {
    const shipment = await shipmentService.addBox(
      req.params.id,
      req.body,
      req.user._id
    );

    return successResponse(
      res,
      { shipment },
      'Box added to shipment successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Add item to box
 * @route POST /api/shipments/:id/boxes/:boxIndex/items
 * @access Private (requires 'shipments' permission)
 */
const addItemToBox = async (req, res, next) => {
  try {
    const shipment = await shipmentService.addItemToBox(
      req.params.id,
      parseInt(req.params.boxIndex),
      req.body,
      req.user._id
    );

    return successResponse(
      res,
      { shipment },
      'Item added to box successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Duplicate an existing box
 * @route POST /api/shipments/:id/boxes/:boxIndex/duplicate
 * @access Private (requires 'shipments' permission)
 */
const duplicateBox = async (req, res, next) => {
  try {
    const shipment = await shipmentService.duplicateBox(
      req.params.id,
      parseInt(req.params.boxIndex),
      req.body,
      req.user._id
    );

    return successResponse(
      res,
      { shipment },
      'Box duplicated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Finalize shipment
 * @route POST /api/shipments/:id/finalize
 * @access Private (requires 'shipments' permission)
 */
const finalizeShipment = async (req, res, next) => {
  try {
    const shipment = await shipmentService.finalizeShipment(
      req.params.id,
      req.user._id
    );

    return successResponse(
      res,
      { shipment },
      'Shipment finalized successfully. Inventory has been deducted.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Mark shipment as shipped
 * @route POST /api/shipments/:id/ship
 * @access Private (requires 'shipments' permission)
 */
const markAsShipped = async (req, res, next) => {
  try {
    const { shipmentDate, trackingNumber, carrier } = req.body;

    const shipment = await shipmentService.markAsShipped(
      req.params.id,
      shipmentDate,
      trackingNumber,
      carrier,
      req.user._id
    );

    return successResponse(
      res,
      { shipment },
      'Shipment marked as shipped successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel shipment
 * @route POST /api/shipments/:id/cancel
 * @access Private (requires 'shipments' permission)
 */
const cancelShipment = async (req, res, next) => {
  try {
    const shipment = await shipmentService.cancelShipment(
      req.params.id,
      req.user._id
    );

    return successResponse(
      res,
      { shipment },
      'Shipment cancelled successfully. Inventory has been restored.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipment statistics
 * @route GET /api/shipments/stats
 * @access Private (requires 'shipments' permission)
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await shipmentService.getShipmentStats();

    return successResponse(
      res,
      { stats },
      'Shipment statistics retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete shipment
 * @route DELETE /api/shipments/:id
 * @access Private (requires 'shipments' permission)
 */
const deleteShipment = async (req, res, next) => {
  try {
    await shipmentService.deleteShipment(req.params.id, req.user._id);

    return successResponse(res, null, 'Shipment deleted successfully');
  } catch (error) {
    next(error);
  }
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
  getStats,
  deleteShipment,
};
