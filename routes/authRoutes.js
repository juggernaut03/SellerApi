const express = require('express');
const { login, getProfile } = require('../controllers/authController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/profile', authenticate, getProfile);

module.exports = router;
