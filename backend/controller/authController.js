/**
 * Authentication Controller
 * Responsibility: Handles user authentication operations
 * - User registration with password hashing
 * - User login with JWT token generation
 * - Input validation and error handling
 * - Security best practices (password hashing, token generation)
 */

const User = require('../models/user');
const { asyncHandler } = require('../middleware/errorHandling.middleware');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  // Using lean() for better performance (returns plain JS object)
  const existingUser = await User.findOne({ email }).lean();

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists',
    });
  }

  // Create new user
  // Password will be automatically hashed by pre-save middleware
  const user = await User.create({
    name,
    email,
    password,
  });

  // Generate JWT token
  const token = user.generateAuthToken();

  // Send response (password excluded via toJSON method)
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    },
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password field (normally excluded)
  const user = await User.findOne({ email }).select('+password');

  // Check if user exists
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Check if account is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated. Please contact support.',
    });
  }

  // Verify password using instance method
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Generate JWT token
  const token = user.generateAuthToken();

  // Send response
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    },
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by protect middleware
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

module.exports = {
  register,
  login,
  getMe,
};