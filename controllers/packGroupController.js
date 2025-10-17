const packGroupService = require('../services/packGroupService');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const logger = require('../config/logger');

/**
 * @desc    Get pack group data for CSV export
 * @route   GET /api/pack-groups/:id
 * @access  Private
 */
const getPackGroupData = async (req, res) => {
  try {
    const packGroupData = await packGroupService.getPackGroupData(req.params.id);
    successResponse(res, packGroupData, 'Pack group data retrieved successfully');
  } catch (error) {
    logger.error('Error getting pack group data:', error);
    errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Create shipment from pack group data
 * @route   POST /api/pack-groups
 * @access  Private
 */
const createFromPackGroup = async (req, res) => {
  try {
    const { packGroup, fbaShipmentId, destination, boxes, skus } = req.body;

    // Basic validation
    if (!destination || !boxes || !skus) {
      return errorResponse(
        res,
        'Missing required fields: destination, boxes, and skus are required',
        400
      );
    }

    if (!Array.isArray(boxes) || boxes.length === 0) {
      return errorResponse(res, 'Boxes must be a non-empty array', 400);
    }

    if (!Array.isArray(skus) || skus.length === 0) {
      return errorResponse(res, 'SKUs must be a non-empty array', 400);
    }

    // Validate each SKU has boxQuantities array
    for (const sku of skus) {
      if (!sku.sku || !sku.productName) {
        return errorResponse(res, 'Each SKU must have sku and productName', 400);
      }
      if (!Array.isArray(sku.boxQuantities) || sku.boxQuantities.length !== boxes.length) {
        return errorResponse(
          res,
          `SKU ${sku.sku}: boxQuantities array length must match boxes count`,
          400
        );
      }
    }

    const packGroupData = {
      packGroup: packGroup || '1',
      fbaShipmentId: fbaShipmentId || '',
      destination,
      boxes,
      skus,
    };

    const shipment = await packGroupService.createFromPackGroup(
      packGroupData,
      req.user._id
    );

    successResponse(res, { shipment }, 'Shipment created from pack group successfully', 201);
  } catch (error) {
    logger.error('Error creating shipment from pack group:', error);
    errorResponse(res, error.message, 400);
  }
};

/**
 * @desc    Update box distribution for a shipment
 * @route   PUT /api/pack-groups/:id/distribution
 * @access  Private
 */
const updateBoxDistribution = async (req, res) => {
  try {
    const { distributionData } = req.body;

    if (!Array.isArray(distributionData)) {
      return errorResponse(res, 'distributionData must be an array', 400);
    }

    // Validate each distribution entry
    for (const dist of distributionData) {
      if (!dist.sku || !Array.isArray(dist.boxQuantities)) {
        return errorResponse(
          res,
          'Each distribution entry must have sku and boxQuantities array',
          400
        );
      }
    }

    const shipment = await packGroupService.updateBoxDistribution(
      req.params.id,
      distributionData,
      req.user._id
    );

    successResponse(res, { shipment }, 'Box distribution updated successfully');
  } catch (error) {
    logger.error('Error updating box distribution:', error);
    errorResponse(res, error.message, 400);
  }
};

module.exports = {
  getPackGroupData,
  createFromPackGroup,
  updateBoxDistribution,
};

