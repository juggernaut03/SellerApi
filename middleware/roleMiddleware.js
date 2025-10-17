const { errorResponse } = require('../utils/responseHandler');

/**
 * Middleware to check if user has required role
 * @param  {...String} roles - Allowed roles
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'User not authenticated', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        'You do not have permission to perform this action',
        403
      );
    }

    next();
  };
};

/**
 * Middleware to check if user has required permissions
 * @param  {...String} permissions - Required permissions
 */
const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'User not authenticated', 401);
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has all required permissions
    const hasPermission = permissions.every((permission) =>
      req.user.permissions.includes(permission)
    );

    if (!hasPermission) {
      return errorResponse(
        res,
        'You do not have the required permissions for this action',
        403
      );
    }

    next();
  };
};

module.exports = {
  requireRole,
  requirePermission,
};
