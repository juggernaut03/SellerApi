const express = require('express');
const {
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
} = require('../controllers/defectController');
const authenticate = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes require authentication and 'defects' permission
router.use(authenticate);
router.use(requirePermission('defects'));

// Stats route (must come before /:id routes)
router.get('/stats', getDefectStats);

// Lookup routes
router.get('/shipment/:shipmentId', getDefectsByShipment);
router.get('/supplier/:supplier', getDefectsBySupplier);

// CRUD operations
router.post('/', createDefect);
router.get('/', getAllDefects);
router.get('/:id', getDefectById);
router.patch('/:id', updateDefect);
router.delete('/:id', deleteDefect);

// Actions
router.post('/:id/resolve', resolveDefect);
router.patch('/:id/claim', updateSupplierClaim);

module.exports = router;
