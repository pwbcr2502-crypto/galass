const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/authController');
const { authenticateToken, createAuthRateLimit, deviceFingerprint } = require('../middlewares/auth');
const { validateLogin } = require('../middlewares/validation');

// Apply device fingerprinting to all auth routes
router.use(deviceFingerprint);

// Apply rate limiting to login endpoint
const loginRateLimit = createAuthRateLimit(15 * 60 * 1000, 5); // 5 attempts per 15 minutes

/**
 * @route   POST /api/auth/login
 * @desc    Employee login with event code and employee number
 * @access  Public
 */
router.post('/login', loginRateLimit, validateLogin, AuthController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Employee logout (revoke session)
 * @access  Private
 */
router.post('/logout', authenticateToken, AuthController.logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile and voting history
 * @access  Private
 */
router.get('/profile', authenticateToken, AuthController.getProfile);

/**
 * @route   GET /api/auth/validate
 * @desc    Validate current token (health check for frontend)
 * @access  Private
 */
router.get('/validate', authenticateToken, AuthController.validateToken);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh current token
 * @access  Private
 */
router.post('/refresh', authenticateToken, AuthController.refreshToken);

/**
 * @route   GET /api/auth/session
 * @desc    Get current session information
 * @access  Private
 */
router.get('/session', authenticateToken, AuthController.getSessionInfo);

/**
 * @route   POST /api/auth/admin-login
 * @desc    Admin login with username/password
 * @access  Public
 */
router.post('/admin-login', AuthController.adminLogin);

module.exports = router;