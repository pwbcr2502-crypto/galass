const { verifyToken, validateSession } = require('../utils/jwt');
const { logWarn, logError } = require('../config/logger');

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: 'Access token is required',
        data: null
      });
    }

    // Verify JWT token
    const decoded = verifyToken(token);
    
    // Validate session in database
    const isValidSession = await validateSession(token, decoded.employeeId, decoded.eventId);
    
    if (!isValidSession) {
      logWarn('Invalid session detected', {
        employeeId: decoded.employeeId,
        eventId: decoded.eventId,
        ip: req.ip
      });
      
      return res.status(401).json({
        code: 401,
        message: 'Invalid or expired session',
        data: null
      });
    }

    // Add user info to request
    req.user = {
      id: decoded.employeeId,
      employeeId: decoded.employeeId,
      eventId: decoded.eventId,
      empNo: decoded.empNo,
      name: decoded.name,
      department: decoded.department
    };

    next();
  } catch (error) {
    logError('Authentication failed', error, {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: 'Token has expired',
        data: null
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: 'Invalid token format',
        data: null
      });
    }

    return res.status(401).json({
      code: 401,
      message: 'Authentication failed',
      data: null
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      const isValidSession = await validateSession(token, decoded.employeeId, decoded.eventId);
      
      if (isValidSession) {
        req.user = {
          id: decoded.employeeId,
          employeeId: decoded.employeeId,
          eventId: decoded.eventId,
          empNo: decoded.empNo,
          name: decoded.name,
          department: decoded.department
        };
      }
    }

    next();
  } catch (error) {
    // Log but don't fail - this is optional auth
    logWarn('Optional authentication failed', {
      error: error.message,
      ip: req.ip
    });
    next();
  }
};

// Admin authentication middleware (if needed for admin features)
const authenticateAdmin = async (req, res, next) => {
  try {
    // For now, we'll use a simple approach - admin endpoints require specific admin token
    // In production, you might want more sophisticated role-based access control
    const adminToken = req.headers['x-admin-token'];
    
    if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
      return res.status(403).json({
        code: 403,
        message: 'Admin access required',
        data: null
      });
    }

    req.isAdmin = true;
    next();
  } catch (error) {
    logError('Admin authentication failed', error, {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(403).json({
      code: 403,
      message: 'Admin authentication failed',
      data: null
    });
  }
};

// Rate limiting for authentication endpoints
const createAuthRateLimit = (windowMs = 15 * 60 * 1000, maxAttempts = 5) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = `${req.ip}-${req.body.empNo || 'unknown'}`;
    const now = Date.now();
    
    // Clean old attempts
    const userAttempts = attempts.get(key) || [];
    const recentAttempts = userAttempts.filter(attempt => now - attempt < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      logWarn('Rate limit exceeded for authentication', {
        ip: req.ip,
        empNo: req.body.empNo,
        attempts: recentAttempts.length
      });
      
      return res.status(429).json({
        code: 429,
        message: 'Too many login attempts. Please try again later.',
        data: {
          retryAfter: Math.ceil((recentAttempts[0] + windowMs - now) / 1000)
        }
      });
    }

    // Add current attempt
    recentAttempts.push(now);
    attempts.set(key, recentAttempts);

    // Add attempt info to request
    req.authAttempts = recentAttempts.length;
    
    next();
  };
};

// Device fingerprinting
const deviceFingerprint = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  // Simple device fingerprint - in production you might want more sophisticated method
  const fingerprint = Buffer.from(`${userAgent}-${acceptLanguage}-${acceptEncoding}`)
    .toString('base64')
    .substring(0, 32);

  req.deviceId = fingerprint;
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  authenticateAdmin,
  createAuthRateLimit,
  deviceFingerprint
};