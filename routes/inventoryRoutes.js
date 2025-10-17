const express = require('express');
const {
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
} = require('../controllers/inventoryController');
const authenticate = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes require authentication and 'inventory' permission
router.use(authenticate);
router.use(requirePermission('inventory'));

// Stats and alerts routes (must come before /:id routes)
router.get('/stats', getStats);
router.get('/alerts/low-stock', getLowStockItems);

// Bulk operations
router.post('/bulk-import', bulkImport);

// SKU lookup
router.get('/sku/:sku', getItemBySKU);

// CRUD operations
router.post('/', createItem);
router.get('/', getAllItems);
router.get('/:id', getItemById);
router.patch('/:id', updateItem);
router.delete('/:id', deleteItem);

// Stock management
router.patch('/:id/stock', updateStock);
router.post('/:id/adjust', adjustStock);

module.exports = router;
