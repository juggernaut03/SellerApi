const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Create new user (Admin only)
 * @route POST /api/users
 * @access Private (Admin)
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, permissions } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return errorResponse(res, 'Please provide name, email, and password', 400);
    }

    if (password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'User with this email already exists', 400);
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'viewer',
      permissions: permissions || [],
    });

    return successResponse(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        },
      },
      'User created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users
 * @route GET /api/users
 * @access Private (Admin)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true }).select('-password');

    return successResponse(
      res,
      {
        count: users.length,
        users,
      },
      'Users retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * @route PATCH /api/users/:id
 * @access Private (Admin)
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, permissions, isActive } = req.body;

    // Find user
    const user = await User.findById(id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Update fields
    if (name) user.name = name;
    if (role) user.role = role;
    if (permissions !== undefined) user.permissions = permissions;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    return successResponse(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          isActive: user.isActive,
        },
      },
      'User updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (soft delete)
 * @route DELETE /api/users/:id
 * @access Private (Admin)
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find user
    const user = await User.findById(id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Prevent deleting own account
    if (user._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 'You cannot delete your own account', 400);
    }

    // Soft delete by setting isActive to false
    user.isActive = false;
    await user.save();

    return successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  getAllUsers,
  updateUser,
  deleteUser,
};
