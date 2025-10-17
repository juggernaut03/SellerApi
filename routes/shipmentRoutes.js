const express = require('express');
const {
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
} = require('../controllers/shipmentController');
const authenticate = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes require authentication and 'shipments' permission
router.use(authenticate);
router.use(requirePermission('shipments'));

// Stats route (must come before /:id routes)
router.get('/stats', getStats);

// Shipment ID lookup
router.get('/shipment-id/:shipmentId', getShipmentByShipmentId);

// CRUD operations
router.post('/', createShipment);
router.get('/', getAllShipments);
router.get('/:id', getShipmentById);
router.patch('/:id', updateShipment);
router.delete('/:id', deleteShipment);

// Box management
router.post('/:id/boxes', addBox);
router.post('/:id/boxes/:boxIndex/items', addItemToBox);
router.post('/:id/boxes/:boxIndex/duplicate', duplicateBox);

// Shipment workflow
router.post('/:id/finalize', finalizeShipment);
router.post('/:id/ship', markAsShipped);
router.post('/:id/cancel', cancelShipment);

module.exports = router;
