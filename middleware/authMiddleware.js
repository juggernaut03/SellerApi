const { verifyToken } = require('../utils/jwtHelper');
const { errorResponse } = require('../utils/responseHandler');
const User = require('../models/User');

/**
 * Authentication middleware to verify JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'No token provided, authorization denied', 401);
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyToken(token);

    // Find user
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (!user.isActive) {
      return errorResponse(res, 'User account is deactivated', 403);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.message === 'Token has expired') {
      return errorResponse(res, 'Token has expired, please login again', 401);
    }
    if (error.message === 'Invalid token') {
      return errorResponse(res, 'Invalid token', 401);
    }
    return errorResponse(res, 'Authentication failed', 401);
  }
};

module.exports = authenticate;
