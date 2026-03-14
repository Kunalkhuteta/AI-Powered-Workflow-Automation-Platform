/**
 * Execution Controller
 * Responsibility: Proxy workflow execution requests to Python engine
 * - Fetches workflow from MongoDB
 * - Forwards to Python FastAPI execution engine
 * - Stores execution results
 * - Returns results to client
 */

const Workflow = require('../models/workflow');
const { asyncHandler } = require('../middleware/errorHandling.middleware');
const axios = require('axios');
 
// Python execution engine URL
const EXECUTION_ENGINE_URL = process.env.EXECUTION_ENGINE_URL || 'http://localhost:8000';

/**
 * @desc    Execute workflow
 * @route   POST /api/workflows/:id/execute
 * @access  Private
 */
const executeWorkflow = asyncHandler(async (req, res) => {
  const workflowId = req.params.id;

  // Step 1: Fetch workflow from database
  const workflow = await Workflow.findById(workflowId);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Workflow not found',
    });
  }

  // Step 2: Verify ownership
  if (!workflow.isOwner(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to execute this workflow',
    });
  }

  // Step 3: Prepare execution request
  const executionRequest = {
    workflowId: workflow._id.toString(),
    nodes: workflow.nodes,
    edges: workflow.edges,
    initialContext: req.body.initialContext || {},
  };

  try {
    // Step 4: Call Python execution engine
    const response = await axios.post(
      `${EXECUTION_ENGINE_URL}/api/execute`,
      executionRequest,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 300000, // 5 minute timeout (adjust based on workflow complexity)
      }
    );

    const executionResult = response.data;

    // Step 5: Update workflow with last execution time
    workflow.lastExecutedAt = new Date();
    await workflow.save();

    // Step 6: Return execution result
    // In Phase 3: Store execution result in MongoDB for history
    res.status(200).json({
      success: true,
      message: 'Workflow executed successfully',
      data: executionResult,
    });

  } catch (error) {
    // Handle Python engine errors
    if (error.response) {
      // Python engine returned an error response
      return res.status(error.response.status || 500).json({
        success: false,
        message: 'Execution engine error',
        error: error.response.data,
      });
    } else if (error.request) {
      // Request was made but no response received
      return res.status(503).json({
        success: false,
        message: 'Execution engine unavailable',
        error: 'Could not connect to execution engine',
      });
    } else {
      // Other errors
      throw error;
    }
  }
});

/**
 * @desc    Get workflow execution status
 * @route   GET /api/workflows/:id/execution/status
 * @access  Private
 */
const getExecutionStatus = asyncHandler(async (req, res) => {
  const workflowId = req.params.id;

  // Fetch workflow
  const workflow = await Workflow.findById(workflowId);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Workflow not found',
    });
  }

  // Verify ownership
  if (!workflow.isOwner(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this workflow',
    });
  }

  // Return basic execution info
  // In Phase 3: Query actual execution logs from MongoDB
  res.status(200).json({
    success: true,
    data: {
      workflowId: workflow._id,
      lastExecutedAt: workflow.lastExecutedAt,
      status: workflow.lastExecutedAt ? 'completed' : 'never_executed',
    },
  });
});

/**
 * @desc    Get execution history
 * @route   GET /api/workflows/:id/execution/history
 * @access  Private
 */
const getExecutionHistory = asyncHandler(async (req, res) => {
  const workflowId = req.params.id;

  // Fetch workflow
  const workflow = await Workflow.findById(workflowId);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Workflow not found',
    });
  }

  // Verify ownership
  if (!workflow.isOwner(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this workflow',
    });
  }

  try {
    // Call Python engine for execution history
    const response = await axios.get(
      `${EXECUTION_ENGINE_URL}/api/history/${workflowId}`,
      {
        params: {
          limit: req.query.limit || 10,
        },
      }
    );

    res.status(200).json({
      success: true,
      data: response.data,
    });

  } catch (error) {
    if (error.response) {
      return res.status(error.response.status || 500).json({
        success: false,
        message: 'Failed to fetch execution history',
        error: error.response.data,
      });
    }
    throw error;
  }
});

module.exports = {
  executeWorkflow,
  getExecutionStatus,
  getExecutionHistory,
};