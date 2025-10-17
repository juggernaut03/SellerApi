const defectService = require('../services/defectService');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const logger = require('../config/logger');

/**
 * @desc    Create new defect report
 * @route   POST /api/defects
 * @access  Private
 */
const createDefect = async (req, res, next) => {
  try {
    const defect = await defectService.createDefect(req.body, req.user._id);
    return successResponse(res, { defect }, 'Defect reported successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all defects with filters
 * @route   GET /api/defects
 * @access  Private
 */
const getAllDefects = async (req, res, next) => {
  try {
    const result = await defectService.getAllDefects(req.query);
    return successResponse(res, result, 'Defects retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get defect by ID
 * @route   GET /api/defects/:id
 * @access  Private
 */
const getDefectById = async (req, res, next) => {
  try {
    const defect = await defectService.getDefectById(req.params.id);
    return successResponse(res, { defect }, 'Defect retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get defects by shipment
 * @route   GET /api/defects/shipment/:shipmentId
 * @access  Private
 */
const getDefectsByShipment = async (req, res, next) => {
  try {
    const defects = await defectService.getDefectsByShipment(req.params.shipmentId);
    return successResponse(res, { defects }, 'Defects retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get defects by supplier
 * @route   GET /api/defects/supplier/:supplier
 * @access  Private
 */
const getDefectsBySupplier = async (req, res, next) => {
  try {
    const defects = await defectService.getDefectsBySupplier(req.params.supplier);
    return successResponse(res, { defects }, 'Defects retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update defect
 * @route   PATCH /api/defects/:id
 * @access  Private
 */
const updateDefect = async (req, res, next) => {
  try {
    const defect = await defectService.updateDefect(req.params.id, req.body, req.user._id);
    return successResponse(res, { defect }, 'Defect updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resolve defect
 * @route   POST /api/defects/:id/resolve
 * @access  Private
 */
const resolveDefect = async (req, res, next) => {
  try {
    const { resolution } = req.body;
    if (!resolution) {
      return errorResponse(res, 'Resolution description is required', 400);
    }
    
    const defect = await defectService.resolveDefect(req.params.id, resolution, req.user._id);
    return successResponse(res, { defect }, 'Defect resolved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update supplier claim
 * @route   PATCH /api/defects/:id/claim
 * @access  Private
 */
const updateSupplierClaim = async (req, res, next) => {
  try {
    const defect = await defectService.updateSupplierClaim(req.params.id, req.body, req.user._id);
    return successResponse(res, { defect }, 'Supplier claim updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete defect
 * @route   DELETE /api/defects/:id
 * @access  Private
 */
const deleteDefect = async (req, res, next) => {
  try {
    const defect = await defectService.deleteDefect(req.params.id);
    return successResponse(res, { defect }, 'Defect deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get defect statistics
 * @route   GET /api/defects/stats
 * @access  Private
 */
const getDefectStats = async (req, res, next) => {
  try {
    const stats = await defectService.getDefectStats(req.query);
    return successResponse(res, { stats }, 'Defect statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
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
