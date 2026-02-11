/**
 * Server Entry Point
 * Responsibility: Starts the HTTP server and connects to database
 * - Loads environment variables
 * - Establishes database connection
 * - Starts Express server
 * - Handles uncaught exceptions and unhandled rejections
 * - Graceful shutdown on termination signals
 */

require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');

/**
 * Handle Uncaught Exceptions
 * Must be at the top to catch synchronous errors
 */
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Error:', err.name, err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

/**
 * Connect to Database
 */
connectDB();

/**
 * Server Configuration
 */
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Start Server
 */
const server = app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`🚀 Server running in ${NODE_ENV} mode`);
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
});

/**
 * Handle Unhandled Promise Rejections
 * Catches async errors not handled in try-catch
 */
process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down gracefully...');
  console.error('Error:', err.name, err.message);
  
  // Close server & exit process
  server.close(() => {
    console.log('Server closed');
    process.exit(1);
  });
});

/**
 * Graceful Shutdown Handler
 * Handles SIGTERM and SIGINT signals (Ctrl+C, Docker stop, etc.)
 */
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close database connection
    const mongoose = require('mongoose');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;