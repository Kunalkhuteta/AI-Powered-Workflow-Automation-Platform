/**
 * Workflow Controller
 * Responsibility: Handles all workflow CRUD operations
 * - Create new workflows
 * - Retrieve workflows (single and list)
 * - Update existing workflows
 * - Delete workflows
 * - Enforces ownership validation
 * - Implements pagination and filtering
 */

const Workflow = require('../models/workflow');
const { asyncHandler } = require('../middleware/errorHandling.middleware');

/**
 * @desc    Create new workflow
 * @route   POST /api/workflows
 * @access  Private
 */
const createWorkflow = asyncHandler(async (req, res) => {
  const { name, description, nodes, edges, status, tags } = req.body;

  // Create workflow with authenticated user's ID
  const workflow = await Workflow.create({
    userId: req.user._id, // Set from auth middleware
    name,
    description,
    nodes: nodes || [],
    edges: edges || [],
    status: status || 'draft',
    tags: tags || [],
  });

  res.status(201).json({
    success: true,
    message: 'Workflow created successfully',
    data: workflow,
  });
});

/**
 * @desc    Get all workflows for authenticated user
 * @route   GET /api/workflows
 * @access  Private
 */
const getWorkflows = asyncHandler(async (req, res) => {
  // Extract query parameters for filtering and pagination
  const {
    status,
    search,
    page = 1,
    limit = 10,
    sortBy = 'updatedAt',
    order = 'desc',
  } = req.query;

  // Build query filter
  const filter = { userId: req.user._id };

  // Add status filter if provided
  if (status) {
    filter.status = status;
  }

  // Add search filter (searches name and description)
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOrder = order === 'desc' ? -1 : 1;

  // Execute query with pagination
  const workflows = await Workflow.find(filter)
    .sort({ [sortBy]: sortOrder })
    .limit(parseInt(limit))
    .skip(skip)
    .lean(); // Returns plain JS objects (better performance)

  // Get total count for pagination metadata
  const total = await Workflow.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: workflows.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
    data: workflows,
  });
});

/**
 * @desc    Get single workflow by ID
 * @route   GET /api/workflows/:id
 * @access  Private
 */
const getWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findById(req.params.id);

  // Check if workflow exists
  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Workflow not found',
    });
  }

  // Verify ownership - users can only access their own workflows
  if (!workflow.isOwner(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this workflow',
    });
  }

  res.status(200).json({
    success: true,
    data: workflow,
  });
});

/**
 * @desc    Update workflow
 * @route   PUT /api/workflows/:id
 * @access  Private
 */
const updateWorkflow = asyncHandler(async (req, res) => {
  let workflow = await Workflow.findById(req.params.id);

  // Check if workflow exists
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
      message: 'Not authorized to update this workflow',
    });
  }

  // Fields allowed to be updated
  const allowedUpdates = [
    'name',
    'description',
    'nodes',
    'edges',
    'status',
    'tags',
    'isPublic',
  ];

  // Filter request body to only include allowed fields
  const updates = {};
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  // Update workflow
  // Using findByIdAndUpdate with runValidators ensures schema validation
  workflow = await Workflow.findByIdAndUpdate(
    req.params.id,
    updates,
    {
      new: true, // Return updated document
      runValidators: true, // Run model validators
    }
  );

  res.status(200).json({
    success: true,
    message: 'Workflow updated successfully',
    data: workflow,
  });
});

/**
 * @desc    Delete workflow
 * @route   DELETE /api/workflows/:id
 * @access  Private
 */
const deleteWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findById(req.params.id);

  // Check if workflow exists
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
      message: 'Not authorized to delete this workflow',
    });
  }

  // Delete workflow
  await workflow.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Workflow deleted successfully',
    data: { id: req.params.id },
  });
});

/**
 * @desc    Get workflow statistics for user
 * @route   GET /api/workflows/stats
 * @access  Private
 */
const getWorkflowStats = asyncHandler(async (req, res) => {
  const stats = await Workflow.aggregate([
    // Match workflows belonging to the user
    { $match: { userId: req.user._id } },
    
    // Group by status and count
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  // Get total workflow count
  const total = await Workflow.countDocuments({ userId: req.user._id });

  res.status(200).json({
    success: true,
    data: {
      total,
      byStatus: stats,
    },
  });
});

module.exports = {
  createWorkflow,
  getWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  getWorkflowStats,
};