/**
 * Database Configuration
 * Responsibility: Establishes and manages MongoDB connection
 * - Connects to MongoDB Atlas using Mongoose
 * - Implements connection retry logic
 * - Handles connection events (connected, error, disconnected)
 * - Uses environment variables for security
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas
 * Uses async/await for clean asynchronous code
 * Implements proper error handling and logging
 */
const connectDB = async () => {
  try {
    // Mongoose connection options for production
    const options = {
      // Use new URL parser
      // useNewUrlParser and useUnifiedTopology are now defaults in Mongoose 6+
      // but included for clarity and backwards compatibility
      maxPoolSize: 10, // Maximum number of connections in the pool
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Timeout for socket operations
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Handle connection events for monitoring
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    // Exit process with failure code in production
    // This allows orchestrators (PM2, Docker, K8s) to restart the service
    process.exit(1);
  }
};

module.exports = connectDB;