/**
 * Workflow Model
 * Responsibility: Defines AI workflow structure and relationships
 * - References User model (relational data)
 * - Stores workflow nodes and edges (AI automation graph)
 * - Validates required fields
 * - Automatic timestamps for tracking
 * - Indexes for query performance
 */

const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to User model
      required: [true, 'Workflow must belong to a user'],
      index: true, // Index for faster queries by userId
    },
    name: {
      type: String,
      required: [true, 'Please provide a workflow name'],
      trim: true,
      minlength: [3, 'Workflow name must be at least 3 characters'],
      maxlength: [100, 'Workflow name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    nodes: {
      type: [mongoose.Schema.Types.Mixed], // Array of node objects
      default: [],
      validate: {
        validator: function (nodes) {
          // Ensure nodes is an array
          return Array.isArray(nodes);
        },
        message: 'Nodes must be an array',
      },
    },
    edges: {
      type: [mongoose.Schema.Types.Mixed], // Array of edge objects (connections)
      default: [],
      validate: {
        validator: function (edges) {
          // Ensure edges is an array
          return Array.isArray(edges);
        },
        message: 'Edges must be an array',
      },
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'archived'],
      default: 'draft',
    },
    isPublic: {
      type: Boolean,
      default: false, // Private by default
    },
    tags: {
      type: [String],
      default: [],
    },
    version: {
      type: Number,
      default: 1,
    },
    lastExecutedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: { virtuals: true }, // Include virtuals when converting to JSON
    toObject: { virtuals: true },
  }
);

/**
 * Compound Index
 * Optimize queries that filter by userId and status together
 * Common query pattern: Find all active workflows for a user
 */
workflowSchema.index({ userId: 1, status: 1 });

/**
 * Text Index
 * Enable full-text search on name and description
 */
workflowSchema.index({ name: 'text', description: 'text' });

/**
 * Virtual: nodeCount
 * Calculate number of nodes without storing in DB
 */
workflowSchema.virtual('nodeCount').get(function () {
  return this.nodes ? this.nodes.length : 0;
});

/**
 * Virtual: edgeCount
 * Calculate number of edges without storing in DB
 */
workflowSchema.virtual('edgeCount').get(function () {
  return this.edges ? this.edges.length : 0;
});

/**
 * Pre-save Middleware
 * Update version number on modifications (for tracking changes)
 */
workflowSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified('nodes') || this.isModified('edges')) {
    this.version += 1;
  }
  next();
});

/**
 * Static Method: Find user's workflows
 * @param {ObjectId} userId - User's ID
 * @param {Object} filters - Additional filters
 * @returns {Array} - User's workflows
 */
workflowSchema.statics.findByUserId = function (userId, filters = {}) {
  return this.find({ userId, ...filters }).sort({ updatedAt: -1 });
};

/**
 * Instance Method: Check if user owns this workflow
 * @param {ObjectId} userId - User's ID to check
 * @returns {Boolean} - True if user owns workflow
 */
workflowSchema.methods.isOwner = function (userId) {
  return this.userId.toString() === userId.toString();
};

module.exports = mongoose.model('Workflow', workflowSchema);