/**
 * Workflow Model - UPDATED with Conditional Branching Support
 * 
 * Changes:
 * - Added 'label' field to edges for conditional branches
 * - Backward compatible with existing workflows
 */

const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Workflow must belong to a user'],
      index: true,
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
      type: [mongoose.Schema.Types.Mixed],
      default: [],
      validate: {
        validator: function (nodes) {
          return Array.isArray(nodes);
        },
        message: 'Nodes must be an array',
      },
    },
    edges: {
      type: [{
        source: {
          type: String,
          required: true
        },
        target: {
          type: String,
          required: true
        },
        // NEW: Label for conditional branches
        label: {
          type: String,
          enum: ['true', 'false', 'default', ''],
          default: 'default'
        },
        // Optional React Flow fields
        id: String,
        sourceHandle: String,
        targetHandle: String,
      }],
      default: [],
      validate: {
        validator: function (edges) {
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
      default: false,
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
workflowSchema.index({ userId: 1, status: 1 });
workflowSchema.index({ name: 'text', description: 'text' });

// Virtuals
workflowSchema.virtual('nodeCount').get(function () {
  return this.nodes ? this.nodes.length : 0;
});

workflowSchema.virtual('edgeCount').get(function () {
  return this.edges ? this.edges.length : 0;
});

// Pre-save Middleware
workflowSchema.pre('save', function (next) {
  if (!this.isNew && (this.isModified('nodes') || this.isModified('edges'))) {
    this.version += 1;
  }
  next();
});

// Static Methods
workflowSchema.statics.findByUserId = function (userId, filters = {}) {
  return this.find({ userId, ...filters }).sort({ updatedAt: -1 });
};

// Instance Methods
workflowSchema.methods.isOwner = function (userId) {
  return this.userId.toString() === userId.toString();
};

/**
 * NEW: Get conditional edges for a node
 * Returns edges grouped by label (true/false/default)
 */
workflowSchema.methods.getConditionalEdges = function (nodeId) {
  const edges = this.edges.filter(e => e.source === nodeId);
  return {
    true: edges.filter(e => e.label === 'true'),
    false: edges.filter(e => e.label === 'false'),
    default: edges.filter(e => !e.label || e.label === 'default' || e.label === '')
  };
};

module.exports = mongoose.model('Workflow', workflowSchema);