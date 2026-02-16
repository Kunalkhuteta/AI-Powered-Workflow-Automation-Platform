/**
 * Authentication Middleware
 * Responsibility: Protects routes and verifies user identity
 * - Extracts JWT token from request headers
 * - Verifies token validity and expiration
 * - Attaches user information to request object
 * - Handles authentication errors gracefully
 */

const jwt = require('jsonwebtoken');
const User = require('../models/user');
/**
 * Protect Routes Middleware
 * Verifies JWT token and attaches user to request
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    // Expected format: "Bearer <token>"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Split "Bearer token" and get token part
      token = req.headers.authorization.split(' ')[1];
    }

    console.log("TOKEN:", token);
    console.log("JWT_SECRET during verify:", process.env.JWT_SECRET);



    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. No token provided.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID from token payload
    // Select returns password field as well for re-authentication scenarios
    const user = await User.findById(decoded.id).select('-password');

    // Check if user still exists (could have been deleted)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated.',
      });
    }

    // Attach user to request object for use in route handlers
    req.user = user;
    
    // Proceed to next middleware/controller
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
    }

    // Generic error
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Role Authorization Middleware
 * Restricts access based on user roles
 * @param {...String} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // req.user is set by protect middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized.',
      });
    }

    // Check if user's role is in allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };