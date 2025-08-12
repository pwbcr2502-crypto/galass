const express = require('express');
const router = express.Router();

const AdminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middlewares/auth');
const { validateVoteWindow, validateId } = require('../middlewares/validation');

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard data
 * @access  Admin
 */
router.get('/dashboard', AdminController.getDashboard);

/**
 * @route   POST /api/admin/programs/:id/vote-window
 * @desc    Control voting window for a program
 * @access  Admin
 * @body    { action: 'open|close', duration?: number }
 */
router.post('/programs/:id/vote-window', 
  validateId(), 
  validateVoteWindow, 
  AdminController.controlVoteWindow
);

/**
 * @route   GET /api/admin/employees
 * @desc    Get employees with pagination and filters
 * @access  Admin
 * @query   page, limit, department, search
 */
router.get('/employees', AdminController.getEmployees);

/**
 * @route   POST /api/admin/employees/import
 * @desc    Batch import employees
 * @access  Admin
 * @body    { employees: Array<{empNo, name, department?, mobile?}> }
 */
router.post('/employees/import', AdminController.importEmployees);

/**
 * @route   GET /api/admin/qrcode/:eventCode
 * @desc    Generate QR code for event
 * @access  Admin
 */
router.get('/qrcode/:eventCode', AdminController.generateQRCode);

/**
 * @route   GET /api/admin/export/votes
 * @desc    Export voting data
 * @access  Admin
 * @query   eventId, format (json|csv)
 */
router.get('/export/votes', AdminController.exportVotes);

/**
 * @route   POST /api/admin/awards/calculate
 * @desc    Calculate and publish awards
 * @access  Admin
 * @body    { eventId: number }
 */
router.post('/awards/calculate', AdminController.calculateAwards);

/**
 * @route   GET /api/admin/awards
 * @desc    Get published awards
 * @access  Admin
 * @query   eventId
 */
router.get('/awards', AdminController.getAwards);

/**
 * @route   GET /api/admin/programs
 * @desc    Get all programs for admin management
 * @access  Admin
 */
router.get('/programs', AdminController.getPrograms);

/**
 * @route   POST /api/admin/programs
 * @desc    Create new program
 * @access  Admin
 */
router.post('/programs', AdminController.createProgram);

/**
 * @route   PUT /api/admin/programs/:id
 * @desc    Update program
 * @access  Admin
 */
router.put('/programs/:id', AdminController.updateProgram);

/**
 * @route   DELETE /api/admin/programs/:id
 * @desc    Delete program
 * @access  Admin
 */
router.delete('/programs/:id', AdminController.deleteProgram);

/**
 * @route   GET /api/admin/events
 * @desc    Get all events
 * @access  Admin
 */
router.get('/events', AdminController.getEvents);

/**
 * @route   POST /api/admin/events
 * @desc    Create new event
 * @access  Admin
 */
router.post('/events', AdminController.createEvent);

/**
 * @route   PUT /api/admin/events/:id
 * @desc    Update event
 * @access  Admin
 */
router.put('/events/:id', AdminController.updateEvent);

/**
 * @route   DELETE /api/admin/events/:id
 * @desc    Delete event
 * @access  Admin
 */
router.delete('/events/:id', AdminController.deleteEvent);

/**
 * @route   GET /api/admin/health
 * @desc    System health check
 * @access  Admin
 */
router.get('/health', AdminController.healthCheck);

module.exports = router;