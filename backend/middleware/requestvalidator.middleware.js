/**
 * Validation Middleware
 * Responsibility: Validates and sanitizes request data
 * - Defines validation rules for different endpoints
 * - Prevents invalid data from reaching controllers
 * - Provides clear validation error messages
 * - Uses express-validator for robust validation
 */

const { body, param, validationResult } = require('express-validator');

/**
 * Validation Result Handler
 * Checks for validation errors and returns formatted response
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Format validation errors
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }
  
  next();
};

/**
 * User Registration Validation Rules
 */
const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  
  validate,
];

/**
 * User Login Validation Rules
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  validate,
];

/**
 * Workflow Creation Validation Rules
 */
const validateWorkflowCreate = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Workflow name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Workflow name must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('nodes')
    .optional()
    .isArray()
    .withMessage('Nodes must be an array'),
  
  body('edges')
    .optional()
    .isArray()
    .withMessage('Edges must be an array'),
  
  body('status')
    .optional()
    .isIn(['draft', 'active', 'paused', 'archived'])
    .withMessage('Invalid status value'),
  
  validate,
];

/**
 * Workflow Update Validation Rules
 */
const validateWorkflowUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Workflow name must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('nodes')
    .optional()
    .isArray()
    .withMessage('Nodes must be an array'),
  
  body('edges')
    .optional()
    .isArray()
    .withMessage('Edges must be an array'),
  
  body('status')
    .optional()
    .isIn(['draft', 'active', 'paused', 'archived'])
    .withMessage('Invalid status value'),
  
  validate,
];

/**
 * MongoDB ObjectId Validation
 */
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid workflow ID format'),
  
  validate,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateWorkflowCreate,
  validateWorkflowUpdate,
  validateObjectId,
};