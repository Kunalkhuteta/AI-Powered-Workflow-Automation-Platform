/**
 * Express Application Configuration
 * Responsibility: Configures Express app with middleware and routes
 * - Sets up security middleware (helmet, cors, rate limiting)
 * - Configures body parsing
 * - Mounts route handlers
 * - Configures error handling
 * - Separates app configuration from server startup (for testing)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const { errorHandler, notFound } = require('./middleware/errorHandling.middleware');
const authRoutes = require('./routes/auth.routes');
const workflowRoutes = require('./routes/workflow.routes');
 
// Initialize Express app
const app = express();

/**
 * Security Middleware
 */

// Helmet: Sets various HTTP headers for security
app.use(helmet());

// CORS: Enable Cross-Origin Resource Sharing
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Rate Limiting: Prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Body Parsing Middleware
 */

// Parse JSON payloads
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded payloads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Logging Middleware
 */

// Morgan: HTTP request logger (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/**
 * Health Check Route
 * Useful for monitoring and load balancers
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

/**
 * API Routes
 */

// Mount authentication routes
app.use('/api/auth', authLimiter, authRoutes);

// Mount workflow routes
app.use('/api/workflows', workflowRoutes);

/**
 * Welcome Route
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Workflow Automation Platform API',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

/**
 * Error Handling Middleware
 * Must be registered after all routes
 */

// 404 handler - catches requests to non-existent routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;