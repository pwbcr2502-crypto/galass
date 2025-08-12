const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const voteRoutes = require('./vote');
const programRoutes = require('./program');
const adminRoutes = require('./admin');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: 'API is running',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// API version info
router.get('/version', (req, res) => {
  res.json({
    code: 200,
    message: 'API version information',
    data: {
      name: 'Anniversary Voting System API',
      version: '1.0.0',
      description: 'Backend API for company anniversary voting system',
      author: 'Company Anniversary Team'
    }
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/votes', voteRoutes);
router.use('/programs', programRoutes);
router.use('/admin', adminRoutes);

// Catch all unmatched routes
router.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: 'API endpoint not found',
    data: {
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;