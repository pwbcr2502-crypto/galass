const express = require('express');
const router = express.Router();

const ProgramController = require('../controllers/programController');
const { authenticateToken, authenticateAdmin } = require('../middlewares/auth');
const { validateProgram, validateId } = require('../middlewares/validation');

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/programs
 * @desc    Get all programs for current event
 * @access  Private
 */
router.get('/', ProgramController.getPrograms);

/**
 * @route   GET /api/programs/current
 * @desc    Get current voting program
 * @access  Private
 */
router.get('/current', ProgramController.getCurrentProgram);

/**
 * @route   GET /api/programs/next
 * @desc    Get next program in sequence
 * @access  Private
 */
router.get('/next', ProgramController.getNextProgram);

/**
 * @route   GET /api/programs/schedule
 * @desc    Get program schedule/timeline
 * @access  Private
 */
router.get('/schedule', ProgramController.getSchedule);

/**
 * @route   GET /api/programs/:id
 * @desc    Get single program details
 * @access  Private
 */
router.get('/:id', validateId(), ProgramController.getProgram);

/**
 * @route   GET /api/programs/:id/voting-status
 * @desc    Get program voting status
 * @access  Private
 */
router.get('/:id/voting-status', validateId(), ProgramController.getVotingStatus);

// Admin only routes
/**
 * @route   POST /api/programs
 * @desc    Create new program
 * @access  Admin
 */
router.post('/', authenticateAdmin, validateProgram, ProgramController.createProgram);

/**
 * @route   PUT /api/programs/:id
 * @desc    Update program
 * @access  Admin
 */
router.put('/:id', authenticateAdmin, validateId(), ProgramController.updateProgram);

/**
 * @route   DELETE /api/programs/:id
 * @desc    Delete program
 * @access  Admin
 */
router.delete('/:id', authenticateAdmin, validateId(), ProgramController.deleteProgram);

module.exports = router;