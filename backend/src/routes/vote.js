const express = require('express');
const router = express.Router();

const VoteController = require('../controllers/voteController');
const { authenticateToken, deviceFingerprint } = require('../middlewares/auth');
const { validateVote, validateId, validatePagination } = require('../middlewares/validation');

// Apply authentication and device fingerprinting to all routes
router.use(authenticateToken);
router.use(deviceFingerprint);

/**
 * @route   POST /api/votes
 * @desc    Submit a vote for a program
 * @access  Private
 */
router.post('/', validateVote, VoteController.submitVote);

/**
 * @route   GET /api/votes/mine
 * @desc    Get current user's votes for the event
 * @access  Private
 */
router.get('/mine', VoteController.getMyVotes);

/**
 * @route   GET /api/votes/program/:programId
 * @desc    Get voting statistics for a specific program
 * @access  Private
 */
router.get('/program/:programId', validateId('programId'), VoteController.getProgramVotes);

/**
 * @route   GET /api/votes/statistics
 * @desc    Get overall voting statistics for the event
 * @access  Private
 */
router.get('/statistics', VoteController.getVotingStatistics);

/**
 * @route   GET /api/votes/leaderboard
 * @desc    Get real-time leaderboard
 * @access  Private
 * @query   dimension - ranking dimension (composite, stage_presence, performance, etc.)
 * @query   limit - number of programs to return (default: 10)
 */
router.get('/leaderboard', VoteController.getLeaderboard);

/**
 * @route   GET /api/votes/can-vote/:programId
 * @desc    Check if user can vote for a specific program
 * @access  Private
 */
router.get('/can-vote/:programId', validateId('programId'), VoteController.canVote);

/**
 * @route   GET /api/votes/summary
 * @desc    Get voting summary for user dashboard
 * @access  Private
 */
router.get('/summary', VoteController.getVotingSummary);

module.exports = router;