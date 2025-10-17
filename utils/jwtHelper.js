const jwt = require('jsonwebtoken');
const { config } = require('../config/env');

/**
 * Generate JWT token
 * @param {String} userId - User ID
 * @param {String} role - User role
 * @param {Array} permissions - User permissions
 * @returns {String} JWT token
 */
const generateToken = (userId, role, permissions = []) => {
  const payload = {
    userId,
    role,
    permissions,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
