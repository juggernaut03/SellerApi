const express = require('express');
const router = express.Router();
const {
  getPackGroupData,
  createFromPackGroup,
  updateBoxDistribution,
} = require('../controllers/packGroupController');
const authenticate = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/roleMiddleware');

// All routes require authentication and shipments permission
router.use(authenticate);
router.use(requirePermission('shipments'));

/**
 * @route   GET /api/pack-groups/:id
 * @desc    Get pack group data for CSV export
 * @access  Private (requires shipments permission)
 */
router.get('/:id', getPackGroupData);

/**
 * @route   POST /api/pack-groups
 * @desc    Create shipment from pack group data
 * @access  Private (requires shipments permission)
 */
router.post('/', createFromPackGroup);

/**
 * @route   PUT /api/pack-groups/:id/distribution
 * @desc    Update box distribution for a shipment
 * @access  Private (requires shipments permission)
 */
router.put('/:id/distribution', updateBoxDistribution);

module.exports = router;

