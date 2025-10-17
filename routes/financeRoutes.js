const express = require('express');
const {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  getTransactionsBySKU,
  updateTransaction,
  deleteTransaction,
  getFinancialSummary,
  getProfitBySKU,
  getProfitBySupplier,
} = require('../controllers/financeController');
const authenticate = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes require authentication and 'finance' permission
router.use(authenticate);
router.use(requirePermission('finance'));

// Stats and summary routes (must come before /:id routes)
router.get('/summary', getFinancialSummary);
router.get('/profit/sku/:sku', getProfitBySKU);
router.get('/profit/supplier', getProfitBySupplier);

// Lookup routes
router.get('/sku/:sku', getTransactionsBySKU);

// CRUD operations
router.post('/', createTransaction);
router.get('/', getAllTransactions);
router.get('/:id', getTransactionById);
router.patch('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
