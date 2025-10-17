const financeService = require('../services/financeService');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const logger = require('../config/logger');

/**
 * @desc    Create financial transaction
 * @route   POST /api/finance
 * @access  Private
 */
const createTransaction = async (req, res, next) => {
  try {
    const transaction = await financeService.createTransaction(req.body, req.user._id);
    return successResponse(res, { transaction }, 'Transaction created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all transactions with filters
 * @route   GET /api/finance
 * @access  Private
 */
const getAllTransactions = async (req, res, next) => {
  try {
    const result = await financeService.getAllTransactions(req.query);
    return successResponse(res, result, 'Transactions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get transaction by ID
 * @route   GET /api/finance/:id
 * @access  Private
 */
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await financeService.getTransactionById(req.params.id);
    return successResponse(res, { transaction }, 'Transaction retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get transactions by SKU
 * @route   GET /api/finance/sku/:sku
 * @access  Private
 */
const getTransactionsBySKU = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const transactions = await financeService.getTransactionsBySKU(
      req.params.sku,
      startDate,
      endDate
    );
    return successResponse(res, { transactions }, 'Transactions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update transaction
 * @route   PATCH /api/finance/:id
 * @access  Private
 */
const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await financeService.updateTransaction(
      req.params.id,
      req.body,
      req.user._id
    );
    return successResponse(res, { transaction }, 'Transaction updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete transaction
 * @route   DELETE /api/finance/:id
 * @access  Private
 */
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await financeService.deleteTransaction(req.params.id);
    return successResponse(res, { transaction }, 'Transaction deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get financial summary and statistics
 * @route   GET /api/finance/summary
 * @access  Private
 */
const getFinancialSummary = async (req, res, next) => {
  try {
    const summary = await financeService.getFinancialSummary(req.query);
    return successResponse(res, { summary }, 'Financial summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get profit by SKU
 * @route   GET /api/finance/profit/sku/:sku
 * @access  Private
 */
const getProfitBySKU = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const profit = await financeService.getProfitBySKU(req.params.sku, startDate, endDate);
    return successResponse(res, { profit }, 'Profit data retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get profit by supplier
 * @route   GET /api/finance/profit/supplier
 * @access  Private
 */
const getProfitBySupplier = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const suppliers = await financeService.getProfitBySupplier(startDate, endDate);
    return successResponse(res, { suppliers }, 'Supplier profit data retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  getTransactionsBySKU,
  updateTransaction,
  deleteTransaction,
  getFinancialSummary,
  getProfitBySKU,
  getProfitBySupplier,
};
