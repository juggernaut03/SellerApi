const express = require('express');
const {
  createUser,
  getAllUsers,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const authenticate = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireRole('admin'));

router.post('/', createUser);
router.get('/', getAllUsers);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
