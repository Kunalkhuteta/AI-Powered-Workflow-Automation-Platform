/**
 * User Model
 * Responsibility: Defines user data structure and authentication methods
 * - Schema definition with validation
 * - Password hashing before save (security best practice)
 * - Password comparison method for login
 * - JWT token generation method
 * - Prevents password from being returned in queries
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password in queries by default (security)
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

/**
 * Pre-save Middleware
 * Hash password before saving to database
 * Only runs if password field is modified (efficiency)
 */
userSchema.pre('save', async function (next) {
  // Only hash if password is modified or new
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt (10 rounds is secure and performant)
    const salt = await bcrypt.genSalt(10);
    
    // Hash password with salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance Method: Compare password for login
 * @param {String} candidatePassword - Password provided by user
 * @returns {Boolean} - True if passwords match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Instance Method: Generate JWT token
 * @returns {String} - Signed JWT token
 */
userSchema.methods.generateAuthToken = function () {
  // Payload contains non-sensitive user information
  const payload = {
    id: this._id,
    email: this.email,
    role: this.role,
  };

  // Sign token with secret and set expiration
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

/**
 * Instance Method: Get public user profile
 * Returns user data without sensitive information
 */
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password; // Remove password from response
  return user;
};

module.exports = mongoose.model('User', userSchema);