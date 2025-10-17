const User = require('../models/User');
const { generateToken } = require('../utils/jwtHelper');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return errorResponse(res, 'Please provide email and password', 400);
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      return errorResponse(res, 'Account is deactivated', 403);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken(user._id, user.role, user.permissions);

    // Return user data and token
    return successResponse(
      res,
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        },
      },
      'Login successful',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get logged-in user profile
 * @route GET /api/auth/profile
 * @access Private
 */
const getProfile = async (req, res, next) => {
  try {
    return successResponse(
      res,
      {
        user: req.user,
      },
      'Profile retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getProfile,
};
