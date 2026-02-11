/**
 * Error Handling Middleware
 * Responsibility: Centralized error handling across the application
 * - Catches all errors from async routes
 * - Formats error responses consistently
 * - Handles different error types (validation, cast, duplicate key)
 * - Provides detailed errors in development, generic in production
 * - Logs errors for monitoring
 */

/**
 * Error Handler Middleware
 * Must be placed after all routes
 */
const errorHandler = (err, req, res, next) => {
  // Create a copy of error object
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging (in production, use proper logging service)
  console.error('Error:', err);

  // Mongoose bad ObjectId (CastError)
  // Occurs when invalid ID format is provided
  if (err.name === 'CastError') {
    const message = `Resource not found with id: ${err.value}`;
    error = {
      message,
      statusCode: 404,
    };
  }

  // Mongoose duplicate key error (code 11000)
  // Occurs when trying to insert duplicate unique field
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists. Please use a different ${field}.`;
    error = {
      message,
      statusCode: 400,
    };
  }

  // Mongoose validation error
  // Occurs when schema validation fails
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = {
      message: messages.join(', '),
      statusCode: 400,
    };
  }

  // JWT errors are handled in auth middleware
  // But adding fallback here for completeness
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      statusCode: 401,
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      statusCode: 401,
    };
  }

  // Send error response
  res.status(error.statusCode || err.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    // Include stack trace only in development for debugging
    ...(process.env.NODE_ENV === 'development' && {
      error: err,
      stack: err.stack,
    }),
  });
};

/**
 * 404 Not Found Handler
 * Catches requests to non-existent routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Async Handler Wrapper
 * Eliminates need for try-catch in async route handlers
 * Usage: asyncHandler(async (req, res) => { ... })
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, notFound, asyncHandler };