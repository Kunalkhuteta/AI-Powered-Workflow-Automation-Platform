/**
 * Workflow Routes
 * Responsibility: Defines workflow endpoints
 * - All routes are protected (require authentication)
 * - Maps HTTP methods to controller actions
 * - Applies validation middleware
 * - Implements RESTful conventions
 */

const express = require('express');
const router = express.Router();
const {
  createWorkflow,
  getWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  getWorkflowStats,
} = require('../controller/Workflowcontroller');
const {
  validateWorkflowCreate,
  validateWorkflowUpdate,
  validateObjectId,
} = require('../middleware/requestvalidator.middleware');
const { protect } = require('../middleware/auth.middleware');

/**
 * Apply authentication middleware to all routes
 * All workflow operations require authentication
 */
router.use(protect);

/**
 * @route   GET /api/workflows/stats
 * @desc    Get workflow statistics for user
 * @access  Private
 * Note: Must be before /:id route to avoid conflict
 */
router.get('/stats', getWorkflowStats);

/**
 * @route   POST /api/workflows
 * @desc    Create new workflow
 * @access  Private
 */
router.post('/', validateWorkflowCreate, createWorkflow);

/**
 * @route   GET /api/workflows
 * @desc    Get all workflows for authenticated user
 * @access  Private
 */
router.get('/', getWorkflows);

/**
 * @route   GET /api/workflows/:id
 * @desc    Get single workflow by ID
 * @access  Private
 */
router.get('/:id', validateObjectId, getWorkflow);

/**
 * @route   PUT /api/workflows/:id
 * @desc    Update workflow
 * @access  Private
 */
router.put('/:id', validateObjectId, validateWorkflowUpdate, updateWorkflow);

/**
 * @route   DELETE /api/workflows/:id
 * @desc    Delete workflow
 * @access  Private
 */
router.delete('/:id', validateObjectId, deleteWorkflow);

module.exports = router;