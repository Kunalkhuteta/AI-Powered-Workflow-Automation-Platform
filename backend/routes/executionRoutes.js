/**
 * Execution Routes
 * Responsibility: Define workflow execution endpoints
 * - Execute workflow (proxies to Python engine)
 * - Get execution status
 * - Get execution history
 */

const express = require('express');
const router = express.Router({ mergeParams: true }); // Merge params from parent router
const {
  executeWorkflow,
  getExecutionStatus,
  getExecutionHistory,
} = require('../controller/executionController');
const { protect } = require('../middleware/auth.middleware');

/**
 * All execution routes require authentication
 */
router.use(protect);

/**
 * @route   POST /api/workflows/:id/execute
 * @desc    Execute a workflow
 * @access  Private
 */
router.post('/execute', executeWorkflow);

/**
 * @route   GET /api/workflows/:id/execution/status
 * @desc    Get workflow execution status
 * @access  Private
 */
router.get('/execution/status', getExecutionStatus);

/**
 * @route   GET /api/workflows/:id/execution/history
 * @desc    Get workflow execution history
 * @access  Private
 */
router.get('/execution/history', getExecutionHistory);

module.exports = router;