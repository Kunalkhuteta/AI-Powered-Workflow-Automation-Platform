/**
 * Authentication Routes
 * Responsibility: Defines authentication endpoints
 * - Maps HTTP methods and paths to controllers
 * - Applies validation middleware
 * - Applies authentication middleware where needed
 */

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
} = require('../controller/authController');
const {
  validateRegister,
  validateLogin,
} = require('../middleware/requestvalidator.middleware');
const { protect } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', validateRegister, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get token
 * @access  Public
 */
router.post('/login', validateLogin, login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get('/me', protect, getMe);

module.exports = router;