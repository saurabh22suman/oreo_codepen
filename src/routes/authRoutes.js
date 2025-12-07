/**
 * Auth Routes
 * Authentication-related endpoints
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginRateLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');

// POST /api/login - Authenticate user (with rate limiting)
router.post('/login', loginRateLimiter, asyncHandler(authController.login.bind(authController)));

// POST /api/logout - End session
router.post('/logout', asyncHandler(authController.logout.bind(authController)));

// GET /api/auth/check - Check auth status
router.get('/auth/check', asyncHandler(authController.checkAuth.bind(authController)));

module.exports = router;
